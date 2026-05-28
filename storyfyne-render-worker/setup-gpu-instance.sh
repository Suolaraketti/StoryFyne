#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# StoryFyne GPU Render Worker — EC2 Setup Script
# Run this on a fresh Ubuntu 22.04 g4dn.xlarge (or larger) instance
# ═══════════════════════════════════════════════════════════════════════

set -e

INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
echo "=== Setting up StoryFyne GPU Render Worker ==="
echo "Instance: $INSTANCE_ID | Region: $REGION"

# ─── 1. System Update & Kernel ──────────────────────────────────────
echo "[1/9] Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ─── 2. Install Node.js 20 ──────────────────────────────────────────
echo "[2/9] Installing Node.js 20..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update -y
sudo apt-get install -y nodejs

# ─── 3. Install Chromium Dependencies ───────────────────────────────
echo "[3/9] Installing Chromium dependencies..."
sudo apt-get install -y \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils \
  wget \
  curl \
  git \
  unzip \
  build-essential \
  libvulkan1

# ─── 4. Install NVIDIA GPU Drivers ──────────────────────────────────
echo "[4/9] Installing NVIDIA GPU drivers..."
# For g4dn (T4) and g5 (A10G) instances — driver 535 is stable
DRIVER_URL="https://us.download.nvidia.com/tesla/535.104.12/NVIDIA-Linux-x86_64-535.104.12.run"
DRIVER_NAME="NVIDIA-Linux-driver.run"
wget -q -O "$DRIVER_NAME" "$DRIVER_URL"
sudo sh "$DRIVER_NAME" --disable-nouveau --silent || true
rm -f "$DRIVER_NAME"

# Verify GPU
nvidia-smi || echo "WARNING: nvidia-smi failed. GPU may need a reboot."

# ─── 5. Install Docker (optional but recommended) ───────────────────
echo "[5/9] Installing Docker..."
sudo apt-get install -y ca-certificates gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu

# ─── 6. Setup Render Worker Directory ───────────────────────────────
echo "[6/9] Setting up render worker..."
mkdir -p /home/ubuntu/storyfyne-render-worker
cd /home/ubuntu/storyfyne-render-worker

# Install PM2 for process management
sudo npm install -g pm2

# ─── 7. Install Remotion CLI globally ───────────────────────────────
echo "[7/9] Installing Remotion CLI..."
sudo npm install -g remotion@4.0.284

# ─── 8. Create auto-shutdown script (cost saving) ───────────────────
echo "[8/9] Creating auto-shutdown script..."
cat << 'EOF' | sudo tee /usr/local/bin/storyfyne-shutdown-if-idle
#!/bin/bash
# Auto-shutdown if no render has run in the last 15 minutes
IDLE_FILE="/tmp/storyfyne_last_render"
if [ ! -f "$IDLE_FILE" ]; then
  date +%s > "$IDLE_FILE"
fi
LAST_RENDER=$(cat "$IDLE_FILE")
NOW=$(date +%s)
IDLE_MINUTES=$(( (NOW - LAST_RENDER) / 60 ))
if [ "$IDLE_MINUTES" -gt 15 ]; then
  echo "Idle for $IDLE_MINUTES minutes. Shutting down."
  shutdown -h now
fi
EOF
sudo chmod +x /usr/local/bin/storyfyne-shutdown-if-idle

# Add cron job for idle shutdown
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/storyfyne-shutdown-if-idle") | crontab -

# ─── 9. Create systemd service for render worker ────────────────────
echo "[9/9] Creating systemd service..."

# The worker will be deployed separately, but create the service template now
cat << 'EOF' | sudo tee /etc/systemd/system/storyfyne-render-worker.service
[Unit]
Description=StoryFyne GPU Render Worker
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/storyfyne-render-worker
Environment="NODE_ENV=production"
Environment="RENDER_QUALITY=premium"
Environment="REMOTION_GL=vulkan"
Environment="REMOTION_CHROME_MODE=chrome-for-testing"
ExecStart=/usr/bin/node /home/ubuntu/storyfyne-render-worker/dist/worker.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  GPU Render Worker setup COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Deploy your Remotion bundle to this instance"
echo "  2. Deploy the render worker code"
echo "  3. Start the worker: sudo systemctl start storyfyne-render-worker"
echo "  4. Enable on boot: sudo systemctl enable storyfyne-render-worker"
echo ""
echo "GPU Status:"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null || echo "  (GPU will be available after reboot if this is first install)"
echo ""
echo "Cost-saving features enabled:"
echo "  • Auto-shutdown after 15 minutes of idle time"
echo "  • Spot instance compatible"
echo ""
