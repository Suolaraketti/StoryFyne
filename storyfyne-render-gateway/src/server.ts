import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda";
import { speculateFunctionName } from "@remotion/lambda-client";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8001;

// Validation schemas
const renderRequestSchema = z.object({
  serveUrl: z.string().url(),
  compositionId: z.string(),
  inputProps: z.record(z.any()),
  outName: z.string().optional(),
  codec: z.enum(["h264", "h265", "vp8", "vp9", "prores", "gif"]).optional().default("h264"),
  imageFormat: z.enum(["jpeg", "png", "none"]).optional().default("jpeg"),
  maxRetries: z.number().optional().default(1),
  privacy: z.enum(["public", "private", "no-acl"]).optional().default("public"),
});

const statusRequestSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "storyfyne-render-gateway" });
});

// Start a render
app.post("/render", async (req, res) => {
  console.log(`[RENDER] Incoming request | composition=${req.body?.compositionId} | outName=${req.body?.outName}`);
  
  const parseResult = renderRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error("[RENDER] Validation failed", parseResult.error.flatten());
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }

  const {
    serveUrl,
    compositionId,
    inputProps,
    outName,
    codec,
    imageFormat,
    maxRetries,
    privacy,
  } = parseResult.data;

  try {
    const functionName = speculateFunctionName({
      diskSizeInMb: 2048,
      memorySizeInMb: 2048,
      timeoutInSeconds: 600,
    });
    console.log(`[RENDER] Speculated functionName=${functionName} | region=${process.env.REMOTION_AWS_REGION || "us-east-1"}`);

    const result = await renderMediaOnLambda({
      region: (process.env.REMOTION_AWS_REGION as any) || "us-east-1",
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps,
      codec,
      imageFormat,
      maxRetries: 3,
      privacy,
      outName: outName || undefined,
      downloadBehavior: { type: "download", fileName: outName || "video.mp4" },
      concurrencyPerLambda: 1,
      framesPerLambda: 600,
    });

    console.log(`[RENDER] SUCCESS | renderId=${result.renderId} | bucket=${result.bucketName}`);
    res.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
      cloudWatchMainLogs: result.cloudWatchMainLogs,
    });
  } catch (error: any) {
    console.error("[RENDER] FAILED", error.message || String(error));
    res.status(500).json({
      error: "Failed to start render",
      message: error.message || String(error),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Check render status
app.get("/status", async (req, res) => {
  const parseResult = statusRequestSchema.safeParse({
    renderId: req.query.renderId,
    bucketName: req.query.bucketName,
  });
  if (!parseResult.success) {
    console.error("[STATUS] Validation failed", parseResult.error.flatten());
    res.status(400).json({ error: "Invalid query params", details: parseResult.error.flatten() });
    return;
  }

  const { renderId, bucketName } = parseResult.data;

  try {
    const functionName = speculateFunctionName({
      diskSizeInMb: 2048,
      memorySizeInMb: 2048,
      timeoutInSeconds: 600,
    });

    const progress = await getRenderProgress({
      region: (process.env.REMOTION_AWS_REGION as any) || "us-east-1",
      renderId,
      bucketName,
      functionName,
    });

    let status: string;
    let progressPercent = 0;
    let outputFile: string | undefined;
    let errors: string[] | undefined;

    if (progress.fatalErrorEncountered || progress.errors.length > 0) {
      status = "failed";
      errors = progress.errors.map((e) => e.message || "Unknown error");
      console.error(`[STATUS] renderId=${renderId} FAILED | errors=${JSON.stringify(errors)}`);
    } else if (progress.done && progress.outputFile) {
      status = "completed";
      outputFile = progress.outputFile;
      progressPercent = 100;
      console.log(`[STATUS] renderId=${renderId} COMPLETED | outputFile=${outputFile?.substring(0, 100)}`);
    } else {
      status = "rendering";
      progressPercent = Math.round(progress.overallProgress * 100);
      if (progressPercent % 10 === 0) {
        console.log(`[STATUS] renderId=${renderId} RENDERING | ${progressPercent}% | frames=${progress.framesRendered}`);
      }
    }

    res.json({
      status,
      progressPercent,
      outputFile,
      errors,
      renderSize: progress.renderSize,
      framesRendered: progress.framesRendered,
    });
  } catch (error: any) {
    console.error(`[STATUS] renderId=${renderId} EXCEPTION | ${error.message || String(error)}`);
    res.status(500).json({
      error: "Failed to check render status",
      message: error.message || String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Storyfyne Render Gateway listening on port ${PORT}`);
  console.log(`Remotion AWS Region: ${process.env.REMOTION_AWS_REGION || "us-east-1"}`);
});
