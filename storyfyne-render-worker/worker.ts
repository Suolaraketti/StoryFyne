/**
 * StoryFyne GPU Render Worker
 * 
 * Runs on EC2 GPU instances (g4dn/g5/g6).
 * Receives render jobs via HTTP, renders with GPU acceleration,
 * uploads output to R2, and reports back.
 * 
 * Environment variables:
 *   RENDER_QUALITY=premium
 *   REMOTION_GL=vulkan
 *   REMOTION_CHROME_MODE=chrome-for-testing
 *   BACKEND_WEBHOOK_URL=https://your-backend.up.railway.app/api/render-complete
 *   R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID=xxx
 *   R2_SECRET_ACCESS_KEY=xxx
 *   R2_BUCKET=storyfyne-videos
 *   PORT=3000
 */

import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";
import os from "os";
import https from "https";
import http from "http";

const execAsync = promisify(exec);
const app = express();
app.use(express.json({ limit: "50mb" }));

// ─── Config ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const BACKEND_WEBHOOK_URL = process.env.BACKEND_WEBHOOK_URL || "";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_API_TOKEN = process.env.R2_API_TOKEN || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const R2_BUCKET = process.env.R2_BUCKET || "storyfyne-videos";
const WORK_DIR = process.env.WORK_DIR || "/home/ubuntu/storyfyne-render-worker/jobs";
const BUNDLE_DIR = process.env.BUNDLE_DIR || "/home/ubuntu/storyfyne-render-worker/bundle";
const REMOTION_GL = process.env.REMOTION_GL || "vulkan";
const REMOTION_CHROME_MODE = process.env.REMOTION_CHROME_MODE || "chrome-for-testing";

let isRendering = false;
let currentJob: RenderJob | null = null;

// ─── Types ──────────────────────────────────────────────────────────

interface RenderJob {
  jobId: string;
  storyId: string;
  serveUrl: string;
  compositionId: string;
  inputProps: string; // JSON string
  outputFileName: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

interface JobStatus {
  jobId: string;
  storyId: string;
  status: "queued" | "rendering" | "uploading" | "done" | "error";
  progress?: number;
  outputUrl?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  renderTimeMs?: number;
}

const jobStatuses = new Map<string, JobStatus>();

// ─── Helpers ────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

async function ensureDirs() {
  await fs.ensureDir(WORK_DIR);
  await fs.ensureDir(BUNDLE_DIR);
}

async function downloadBundle(serveUrl: string, targetDir: string): Promise<boolean> {
  // If serveUrl is a local path, copy it. If remote, download.
  if (serveUrl.startsWith("http")) {
    log(`Downloading bundle from ${serveUrl}...`);
    // For remote S3 URLs, we skip download and pass the URL directly to Remotion
    return true;
  }
  // Local path — ensure it exists
  if (await fs.pathExists(serveUrl)) {
    await fs.copy(serveUrl, targetDir, { overwrite: true });
    return true;
  }
  return false;
}

async function renderVideo(job: RenderJob): Promise<string> {
  const jobDir = path.join(WORK_DIR, job.jobId);
  await fs.ensureDir(jobDir);

  const propsPath = path.join(jobDir, "props.json");
  await fs.writeFile(propsPath, job.inputProps);

  const outputPath = path.join(jobDir, job.outputFileName);

  // Use local bundle if available (has the new premium code)
  // __dirname is dist/ so go up 2 levels to reach project root
  const localBundle = path.resolve(__dirname, "..", "..", "storyfyne-remotion", "build", "index.html");
  const useLocalBundle = await fs.pathExists(localBundle);
  const serveUrl = useLocalBundle ? localBundle : job.serveUrl;

  if (useLocalBundle) {
    log(`[${job.jobId}] ✓ USING LOCAL PREMIUM BUNDLE: ${serveUrl}`);
  } else {
    log(`[${job.jobId}] ✗ Local bundle not found at ${localBundle}, falling back to remote serveUrl: ${serveUrl}`);
  }

  // Build Remotion render command with GPU flags
  const cmd = [
    `npx remotion render`,
    `"${serveUrl}"`,
    `"${job.compositionId}"`,
    `"${outputPath}"`,
    `--props="${propsPath}"`,
    `--codec=h264`,
    `--gl=${REMOTION_GL}`,
    `--chrome-mode=${REMOTION_CHROME_MODE}`,
    `--log=verbose`,
    // Concurrency: safe for 8GB VRAM
    `--concurrency=2`,
  ].join(" ");

  log(`[${job.jobId}] Starting render: ${cmd}`);
  const startTime = Date.now();

  const { stdout, stderr } = await execAsync(cmd, {
    cwd: jobDir,
    env: {
      ...process.env,
      REMOTION_GL,
      REMOTION_CHROME_MODE,
    },
    timeout: 600000, // 10 minutes max
  });

  const renderTime = Date.now() - startTime;
  log(`[${job.jobId}] Render complete in ${renderTime}ms`);

  // Check output exists
  if (!(await fs.pathExists(outputPath))) {
    throw new Error(`Output file not found: ${outputPath}\nstdout: ${stdout}\nstderr: ${stderr}`);
  }

  // Update idle timer so auto-shutdown doesn't kill us mid-render
  await fs.writeFile(`${os.tmpdir()}/storyfyne_last_render`, String(Math.floor(Date.now() / 1000)));

  return outputPath;
}

async function uploadToR2(localPath: string, key: string): Promise<string> {
  log(`Uploading ${localPath} to R2 as ${key}...`);

  if (!R2_ACCOUNT_ID || !R2_API_TOKEN || !R2_PUBLIC_URL) {
    throw new Error("R2_ACCOUNT_ID, R2_API_TOKEN, and R2_PUBLIC_URL must be set");
  }

  const data = await fs.readFile(localPath);
  const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;

  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      uploadUrl,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${R2_API_TOKEN}`,
          "Content-Type": "video/mp4",
          "Content-Length": data.length,
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => reject(new Error(`R2 upload failed: ${res.statusCode} - ${body}`)));
        }
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  log(`Upload complete: ${publicUrl}`);
  return publicUrl;
}

async function reportToBackend(status: JobStatus) {
  if (!BACKEND_WEBHOOK_URL) return;
  try {
    const payload = JSON.stringify(status);
    const url = new URL(BACKEND_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    await new Promise<void>((resolve, reject) => {
      const client = url.protocol === "https:" ? https : http;
      const req = client.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Backend returned ${res.statusCode}`));
        }
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  } catch (err) {
    log(`Failed to report to backend: ${err}`);
  }
}

async function processJob(job: RenderJob) {
  const status: JobStatus = {
    jobId: job.jobId,
    storyId: job.storyId,
    status: "rendering",
    startedAt: new Date().toISOString(),
  };
  jobStatuses.set(job.jobId, status);
  isRendering = true;
  currentJob = job;

  try {
    const outputPath = await renderVideo(job);

    status.status = "uploading";
    jobStatuses.set(job.jobId, status);
    await reportToBackend(status);

    const r2Key = `explainer/${job.storyId}/${job.outputFileName}`;
    const outputUrl = await uploadToR2(outputPath, r2Key);

    status.status = "done";
    status.outputUrl = outputUrl;
    status.completedAt = new Date().toISOString();
    status.renderTimeMs = Date.now() - new Date(status.startedAt!).getTime();

    // Cleanup
    const jobDir = path.join(WORK_DIR, job.jobId);
    await fs.remove(jobDir);
  } catch (err: any) {
    status.status = "error";
    status.error = err.message || String(err);
    status.completedAt = new Date().toISOString();
    log(`[${job.jobId}] Render failed: ${err.message}`);
  }

  jobStatuses.set(job.jobId, status);
  await reportToBackend(status);
  isRendering = false;
  currentJob = null;
}

// ─── Routes ─────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    isRendering,
    currentJob: currentJob?.jobId || null,
    gpu: REMOTION_GL !== "sw",
    uptime: process.uptime(),
  });
});

app.get("/gpu-info", async (req, res) => {
  try {
    const { stdout } = await execAsync("nvidia-smi --query-gpu=name,memory.total,driver_version,temperature.gpu,utilization.gpu --format=csv,noheader");
    const [name, mem, driver, temp, util] = stdout.trim().split(", ").map(s => s.trim());
    res.json({ name, memory: mem, driver, temperature: temp, utilization: util });
  } catch {
    res.status(500).json({ error: "GPU not available or nvidia-smi failed" });
  }
});

app.post("/render", async (req, res) => {
  const job: RenderJob = req.body;

  if (!job.jobId || !job.serveUrl || !job.compositionId) {
    res.status(400).json({ error: "Missing required fields: jobId, serveUrl, compositionId" });
    return;
  }

  if (isRendering) {
    res.status(429).json({ error: "Already rendering", currentJob: currentJob?.jobId });
    return;
  }

  log(`[${job.jobId}] Received render job for story ${job.storyId}`);
  res.json({ accepted: true, jobId: job.jobId });

  // Process asynchronously
  processJob(job).catch((err) => {
    log(`[${job.jobId}] Unhandled error: ${err}`);
  });
});

app.get("/status/:jobId", (req, res) => {
  const status = jobStatuses.get(req.params.jobId);
  if (!status) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(status);
});

app.get("/jobs", (req, res) => {
  const jobs = Array.from(jobStatuses.values());
  res.json(jobs);
});

// ─── Startup ────────────────────────────────────────────────────────

async function main() {
  await ensureDirs();

  // Touch idle file so shutdown script doesn't kill us immediately
  await fs.writeFile(`${os.tmpdir()}/storyfyne_last_render`, String(Math.floor(Date.now() / 1000)));

  app.listen(PORT, () => {
    log(`═══════════════════════════════════════════════════════════`);
    log(`  StoryFyne GPU Render Worker ready on port ${PORT}`);
    log(`  GPU backend: ${REMOTION_GL}`);
    log(`  Chrome mode: ${REMOTION_CHROME_MODE}`);
    log(`  Work dir: ${WORK_DIR}`);
    log(`  Backend webhook: ${BACKEND_WEBHOOK_URL || "(none)"}`);
    log(`═══════════════════════════════════════════════════════════`);
  });
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
