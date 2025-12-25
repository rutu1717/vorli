# Vorli - Oracle Cloud Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Oracle Cloud VM                          │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │   Nginx     │────▶│  Go Backend │────▶│ Docker       │  │
│  │  (Port 80)  │     │  (Port 8080)│     │ code-runner  │  │
│  └─────────────┘     └─────────────┘     └──────────────┘  │
│        │                                                    │
│        ▼                                                    │
│  ┌─────────────┐                                           │
│  │   Static    │                                           │
│  │   Files     │                                           │
│  │  (Frontend) │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Oracle Cloud Account** with a Compute Instance (VM)
   - Recommended: VM.Standard.E2.1.Micro (Always Free Tier) or larger
   - OS: Ubuntu 22.04
   - At least 1GB RAM

2. **Open Ports** in Oracle Cloud Security List:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

---

## Step 1: Connect to Your Oracle VM

```bash
ssh -i <your-private-key> ubuntu@<your-vm-public-ip>
```

---

## Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx

# Install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Node.js (for building frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Log out and back in for docker group
exit
```

---

## Step 3: Upload Your Code

```bash
# Option A: Using Git
git clone https://github.com/yourusername/vorli.git
cd vorli

# Option B: Using SCP (from your local machine)
scp -i <your-key> -r d:/vorli ubuntu@<vm-ip>:~/vorli
```

---

## Step 4: Build Docker Image

```bash
cd ~/vorli/backend
docker build -t code-runner -f docker/Dockerfile.runner docker/
docker images code-runner
```

---

## Step 5: Build Frontend

```bash
cd ~/vorli/frontend/vite-project
npm install
npm run build
```

**Update WebSocket URL in `src/websocket.ts` before building:**
```typescript
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
this.ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/execute`);
```

---

## Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/vorli
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/ubuntu/vorli/frontend/vite-project/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /ws/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vorli /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: Create Backend Service

```bash
sudo nano /etc/systemd/system/vorli.service
```

```ini
[Unit]
Description=Vorli Backend
After=network.target docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/vorli/backend
ExecStart=/usr/local/go/bin/go run main.go unified_handler.go
Restart=always
Environment=GEMINI_API_KEY=your-key-here

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable vorli
sudo systemctl start vorli
```

---

## Step 8: Open Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Also open ports in Oracle Cloud Console → VCN → Security Lists**

---

## Step 9: Add SSL (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Useful Commands

```bash
sudo systemctl status vorli      # Check backend status
sudo journalctl -u vorli -f      # View logs
docker container prune -f        # Cleanup containers
```
