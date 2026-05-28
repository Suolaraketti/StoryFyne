# StoryFyne GPU Render Worker

GPU-accelerated video rendering for StoryFyne explainer videos. Runs on AWS EC2 GPU instances (g4dn/g5/g6) with NVIDIA GPUs and renders Remotion videos 5-10x faster than Lambda.

---

## Quick Start (5 minutes)

### Step 1: Launch an EC2 GPU Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. **Name**: `storyfyne-gpu-worker`
4. **AMI**: Ubuntu 22.04 LTS (search "Ubuntu Server 22.04 LTS")
5. **Instance type**: `g4dn.xlarge` (cheapest with GPU) or `g5.xlarge` (faster)
6. **Key pair**: Create or select an existing one
7. **Network settings**: 
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 3000) from anywhere (or your backend IP)
8. **Storage**: 50 GB gp3 (default 30GB is tight)
9. **Advanced → Request Spot instance**: Check this to save ~70% ($0.15/hr instead of $0.53/hr)
10. Click **Launch instance**

> **Note**: If you get a quota error for g4dn, request a limit increase at:  
> Service Quotas → EC2 → "Running On-Demand G and VT instances" → Request increase

### Step 2: Connect & Run Setup

```bash
# Replace with your key file and instance IP
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP

# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/storyfyne-render-worker/setup-gpu-instance.sh -o setup.sh
chmod +x setup.sh
./setup.sh

# Reboot to ensure GPU drivers load
sudo reboot

# Reconnect after reboot
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP
nvidia-smi  # Should show your GPU
```

### Step 3: Deploy the Worker Code

```bash
cd ~/storyfyne-render-worker

# Copy your code (from local machine, in another terminal)
# Or clone from git:
git clone https://github.com/YOUR_REPO/StoryFyne.git /tmp/storyfyne

cp -r /tmp/storyfyne/storyfyne-render-worker/* .

# Install dependencies
npm install

# Build
npm run build

# Set environment variables
cat << 'ENV' > .env
PORT=3000
BACKEND_WEBHOOK_URL=https://your-backend.up.railway.app/api/render-complete
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET=storyfyne-videos
REMOTION_GL=vulkan
REMOTION_CHROME_MODE=chrome-for-testing
ENV

# Start the worker
sudo systemctl start storyfyne-render-worker

# Check status
sudo systemctl status storyfyne-render-worker
journalctl -u storyfyne-render-worker -f
```

### Step 4: Test the Worker

```bash
# From your local machine or backend
curl http://YOUR_INSTANCE_IP:3000/health

# Should return:
# {"status":"ok","isRendering":false,"currentJob":null,"gpu":true}

curl http://YOUR_INSTANCE_IP:3000/gpu-info

# Should return GPU name, memory, driver version
```

### Step 5: Submit a Test Render

```bash
curl -X POST http://YOUR_INSTANCE_IP:3000/render \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-001",
    "storyId": "test-story",
    "serveUrl": "https://remotionlambda-useast1-0x3rvofsis.s3.us-east-1.amazonaws.com/sites/u9yh9sqdi2",
    "compositionId": "ExplainerVideo",
    "inputProps": "{\"scenes\":[{\"type\":\"title\",\"text\":\"GPU Test\",\"audioUrl\":\"\",\"durationInFrames\":90}],\"aspectRatio\":\"16:9\",\"primaryColor\":\"#4f46e5\"}",
    "outputFileName": "test-gpu.mp4",
    "durationInFrames": 90,
    "fps": 30,
    "width": 1920,
    "height": 1080
  }'

# Poll status
curl http://YOUR_INSTANCE_IP:3000/status/test-001
```

---

## Cost Breakdown

| Setup | Per Hour | Per 3-Min Video |
|---|---|---|
| Lambda (current) | ~$0.20/hr equivalent | ~$0.01 |
| EC2 g4dn.xlarge On-Demand | $0.53/hr | ~$0.009 |
| EC2 g4dn.xlarge **Spot** | ~$0.15/hr | ~$0.0025 |
| EC2 g5.xlarge Spot | ~$0.30/hr | ~$0.005 |

**Spot instances save 70%** and are fine for rendering (if interrupted, just retry).

### Monthly Cost (100 videos/month)
- **Lambda**: $1.00
- **GPU Spot**: $0.25 + ~$5/month for a warm instance = ~$5.25

**The GPU is actually cheaper per video** because it renders so much faster.

---

## Architecture

```
┌─────────────────┐     POST /render      ┌─────────────────────┐
│ StoryFyne       │ ────────────────────► │ EC2 GPU Instance    │
│ Backend         │                       │ g4dn.xlarge Spot    │
│ (Railway)       │ ◄──────────────────── │ Ubuntu 22.04        │
└─────────────────┘   Webhook on complete │ NVIDIA T4 GPU       │
                                          │ Vulkan + Chrome     │
                                          └─────────────────────┘
                                                   │
                                                   ▼ upload
                                          ┌─────────────────────┐
                                          │ Cloudflare R2       │
                                          │ (video storage)     │
                                          └─────────────────────┘
```

### How it works

1. Backend receives a "premium" render request
2. Backend POSTs to GPU worker's `/render` endpoint
3. Worker renders with `--gl=vulkan` (GPU-accelerated)
4. Worker uploads MP4 to R2
5. Worker POSTs result to backend webhook
6. Backend updates the story with the video URL

---

## Auto-Shutdown (Cost Saving)

The setup script installs an idle shutdown script. After 15 minutes of no renders, the instance shuts itself down.

**To disable:**
```bash
crontab -r  # Remove the idle check cron job
```

**To manually start/stop:**
```bash
# From your local machine (AWS CLI)
aws ec2 start-instances --instance-ids i-xxxxxxxxxxxxxxxxx
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxxxxxxx
```

---

## Backend Integration

Add to your FastAPI backend:

```python
import os

GPU_WORKER_URL = os.getenv("GPU_WORKER_URL", "http://YOUR_INSTANCE_IP:3000")
USE_GPU = os.getenv("USE_GPU", "false").lower() == "true"

async def submit_render_to_gpu(story_id: str, input_props: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GPU_WORKER_URL}/render",
            json={
                "jobId": f"story-{story_id}",
                "storyId": story_id,
                "serveUrl": REMOTION_SERVE_URL,
                "compositionId": "ExplainerVideo",
                "inputProps": json.dumps(input_props),
                "outputFileName": f"{story_id}.mp4",
                "durationInFrames": input_props.get("durationInFrames", 900),
                "fps": 30,
                "width": 1920,
                "height": 1080,
            },
            timeout=10.0,
        )
        return response.json()

@app.post("/api/render-complete")
async def render_complete_webhook(request: Request):
    data = await request.json()
    story_id = data["storyId"]
    output_url = data.get("outputUrl")
    
    if data["status"] == "done":
        # Save video URL to your database
        await save_story_video(story_id, output_url)
    else:
        logger.error(f"Render failed for {story_id}: {data.get('error')}")
    
    return {"ok": True}
```

---

## Troubleshooting

### "nvidia-smi failed" after setup
```bash
# The driver needs a reboot after first install
sudo reboot
# Then reconnect and try again
```

### "vkCreateInstance failed" during render
This warning is **normal** on headless GPU instances. The render still uses GPU acceleration. If rendering is still slow:
```bash
# Verify Chrome is using GPU
npx remotion gpu --gl=vulkan --chrome-mode=chrome-for-testing
```

### Instance won't start (spot interruption)
Spot instances can be interrupted. Just relaunch:
```bash
aws ec2 run-instances --instance-type g4dn.xlarge --spot-options ...
```
Or use On-Demand for reliability.

### Port 3000 not reachable
```bash
# On the EC2 instance
sudo ufw allow 3000
# Or check AWS Security Group allows inbound port 3000
```

---

## Next Level: Auto-Scaling Fleet

For production, use **AWS Auto Scaling Groups** with Spot:

1. Create a **Launch Template** with your configured AMI
2. Create an **Auto Scaling Group** with min=0, max=3, desired=0
3. Use **AWS SQS** as the job queue
4. Backend puts jobs on SQS
5. ASG scales up when queue depth > 0
6. Workers poll SQS, render, then scale down when idle

This gives you **serverless GPU** — zero cost when idle, infinite scale when busy.

---

## Files

| File | Purpose |
|---|---|
| `setup-gpu-instance.sh` | One-shot setup script for fresh Ubuntu 22.04 |
| `worker.ts` | Express service that receives render jobs |
| `package.json` | Dependencies |
| `tsconfig.json` | TypeScript config |
