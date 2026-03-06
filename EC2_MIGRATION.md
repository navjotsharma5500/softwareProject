# EC2 Instance Migration Guide

> Stack: Node.js 20 / Express · PM2 · Nginx · Let's Encrypt SSL · MongoDB · Cloudflare DNS
> Domain: `lostandfoundapi.guestapp.in`

---

## Step 1 — Provision the New EC2

- Launch a new EC2 instance (Ubuntu recommended, same OS as old instance).
- Open the following security group ports:
  - **22** — SSH
  - **80** — HTTP
  - **443** — HTTPS
  - **3000** — Node.js app (if direct access is needed)
- Download/attach your `.pem` key or create a new one.

---

## Step 2 — Set Up the New Instance

SSH into the new instance and install all dependencies:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

```

---

## Step 3 — Verify App Path on Old Instance (if unsure)

Before cloning on the new instance, confirm where the app lives on the old one:

```bash
# Option 1 — check PM2's working directory:
pm2 info backend

# Option 2 — search the filesystem:
find / -name "softwareProject" -type d 2>/dev/null
```

Look for the `root path` in `pm2 info` — that's the definitive location. Use the same path on the new instance.

---

## Step 4 — Clone & Configure the App

```bash
git clone git@github.com:navjotsharma5500/softwareProject.git ~/softwareProject
cd ~/softwareProject/backend
npm install --omit=dev
```

### Transfer the `.env` file

```bash
# On the OLD instance — copy to local machine:
scp -i your-key.pem ubuntu@OLD_IP:~/softwareProject/backend/.env ./backend.env

# Then copy from local machine to the NEW instance:
scp -i your-key.pem ./backend.env ubuntu@NEW_IP:~/softwareProject/backend/.env
```

---

## Step 5 — Configure Nginx

> **Why Nginx if you have Cloudflare?**
> Cloudflare proxies traffic _to_ your EC2, but something on the server still needs to receive on port 80/443 and forward to Node.js on port 3000. Nginx handles that reverse proxy, plus SSL termination, security headers, CORS, and upload size limits. The flow is:
> `Browser → Cloudflare → Nginx (port 443) → Node.js (port 3000)`

```bash
sudo cp ~/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi
sudo ln -s /etc/nginx/sites-available/lostandfoundapi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remove default if present
sudo nginx -t                                  # verify config before applying
sudo systemctl enable nginx
sudo systemctl reload nginx
```

---

## Step 6 — Issue SSL Certificate (Let's Encrypt)

Reissue a fresh certificate for the new instance (do NOT copy old certs — reissuing is simpler and safer):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lostandfoundapi.guestapp.in
```

Certbot will automatically update your Nginx config with the new cert paths.

---

## Step 7 — Start the App with PM2

On first boot, start PM2 manually (GitHub Actions will handle all future deploys):

```bash
cd ~/softwareProject/backend
pm2 start index.js --name backend
pm2 save
pm2 startup   # copy and run the printed command to enable auto-start on reboot
```

Check that the app is running:

```bash
pm2 status
pm2 logs backend
```

---

## Step 8 — Update Config & Secrets for the New Instance

**`.github/workflows/deploy.yml`** — update the host IP:

```yaml
# Before:
host: 43.205.143.123

# After:
host: NEW_EC2_PUBLIC_IP
```

**GitHub Secrets** — update `DEPLOY_KEY` with the new instance's SSH private key:

1. Go to **GitHub → Settings → Secrets and variables → Actions**
2. Edit `DEPLOY_KEY` and paste the new instance's private key contents.

Commit and push the `deploy.yml` change. The next push to `main` will deploy to the new instance.

---

## Step 9 — Point DNS to the New Instance

In **Cloudflare**:

1. Go to DNS settings for `guestapp.in`.
2. Find the **A record** for `lostandfoundapi`.
3. Update its value to the **new EC2's public IP**.
4. Save — propagation is near-instant with Cloudflare (proxied / orange cloud).

---

## Step 10 — Verify & Decommission Old Instance

1. Test the API health endpoint: `https://lostandfoundapi.guestapp.in/health`
2. Check PM2 logs for errors: `pm2 logs backend`
3. Verify frontend (Vercel) can reach the API without CORS errors.
4. **Stop** (do not terminate yet) the old EC2 instance.
5. Monitor for **24–48 hours**, then terminate the old instance once confirmed stable.

---

## Key Files to Transfer

| File                  | Path on Server                    |
| --------------------- | --------------------------------- |
| Environment variables | `~/softwareProject/backend/.env`  |
| GitHub/SSH deploy key | `~/.ssh/`                         |
| SSL certificates      | Reissue via Certbot (do not copy) |

---

## After Migration Checklist

- [ ] App starts cleanly: `pm2 status`
- [ ] No errors in logs: `pm2 logs backend`
- [ ] Health endpoint responds: `GET /health`
- [ ] HTTPS works: `https://lostandfoundapi.guestapp.in`
- [ ] Frontend on Vercel authenticates and fetches data correctly
- [ ] `deploy.yml` updated with new IP and committed
- [ ] `DEPLOY_KEY` GitHub secret updated
- [ ] Old EC2 instance stopped/terminated
