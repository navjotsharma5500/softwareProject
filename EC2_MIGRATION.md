# EC2 Instance Migration Guide

`lostandfoundapi.guestapp.in` · Node 20 · PM2 · Nginx · Certbot · Cloudflare

---

## Step 1 — Provision the New EC2

- Launch Ubuntu EC2, open ports **22, 80, 443**
- Attach or create a `.pem` key

---

## Step 2 — Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

## Step 3 — Clone & Transfer `.env`

Clone manually via SSH from your laptop, then transfer `.env`:

On the new instance, manually recreate the `.env`:

```bash
cd ~/softwareProject/backend
nano .env
```

Then on the old instance, read the values to copy over:

```bash
cat ~/softwareProject/backend/.env
```

Then back on the new instance:

```bash
npm install --omit=dev
```

---

## Step 4 — Nginx + SSL

> DNS A record in Cloudflare must point to the new EC2 IP **before** this step.

```bash
sudo apt install -y certbot python3-certbot-nginx

# copy config (don't reload yet — certs don't exist yet)
sudo cp ~/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi
sudo ln -s /etc/nginx/sites-available/lostandfoundapi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# certbot gets the cert AND reloads nginx automatically
sudo certbot --nginx -d lostandfoundapi.guestapp.in
```

---

## Step 5 — Verify Nginx

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## Step 6 — Start App with PM2

```bash
cd ~/softwareProject/backend
pm2 start index.js --name backend
pm2 save
pm2 startup
```

> `pm2 startup` will print a command like `sudo env PATH=... pm2 startup systemd ...` — **copy and run that exact command.**

```bash
pm2 status
pm2 logs backend
```

---

## Step 7 — Update DNS & Config

**Cloudflare** — update A record for `lostandfoundapi` → new EC2 IP

**`deploy.yml`** — update host:

```yaml
host: NEW_EC2_PUBLIC_IP
```

**GitHub Secrets** — update `DEPLOY_KEY` with the new instance's private key:
`Settings → Secrets and variables → Actions → DEPLOY_KEY`

Commit & push `deploy.yml (SURYA KARDEGA when he has the key )`.

---

## Step 8 — Verify & Decommission

```bash
# health check
curl https://lostandfoundapi.guestapp.in/health
```

- Stop old EC2, monitor 24–48h, then terminate.

---

## Checklist

- [ ] `pm2 status` clean
- [ ] `pm2 logs backend` no errors
- [ ] `GET /health` responds
- [ ] HTTPS works
- [ ] Vercel frontend works end-to-end
- [ ] `deploy.yml` updated + pushed
- [ ] `DEPLOY_KEY` secret updated
- [ ] Old EC2 terminated
