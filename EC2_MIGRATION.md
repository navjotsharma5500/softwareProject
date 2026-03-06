# EC2 Instance Migration Guide

`lostandfoundapi.guestapp.in` · Node 20 · PM2 · Nginx · Certbot · Cloudflare

---

## Step 1 — Provision the New EC2

- Launch **Ubuntu EC2**
- Open ports in Security Group:

```
22 (SSH)
80 (HTTP)
443 (HTTPS)
```

- Attach or create a `.pem` SSH key

---

## Step 2 — Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y nodejs nginx git

sudo npm install -g pm2
```

Verify installation:

```bash
node -v
npm -v
pm2 -v
```

---

## Step 3 — Clone Project

Go to home directory:

```bash
cd ~
```

Clone repository:

```bash
git clone https://github.com/<your-org>/<repo>.git softwareProject
```

Enter project root:

```bash
cd softwareProject
```

Install dependencies **in the root folder**:

```bash
npm install --omit=dev
```

---

## Step 4 — Transfer `.env`

Go to backend folder:

```bash
cd backend
```

Create `.env`:

```bash
nano .env
```

On the **old EC2 instance**, read the existing env file:

```bash
cat ~/softwareProject/backend/.env
```

Copy all values and paste them into the new instance `.env`.

Save:

```
CTRL + O
ENTER
CTRL + X
```

---

## Step 5 — Setup Nginx + SSL

⚠️ **Before this step, update Cloudflare DNS**

Set A record:

```
lostandfoundapi.guestapp.in → NEW_EC2_PUBLIC_IP
```

Install certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Copy nginx config:

```bash
sudo cp ~/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/lostandfoundapi /etc/nginx/sites-enabled/
```

Remove default site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Generate SSL certificate:

```bash
sudo certbot --nginx -d lostandfoundapi.guestapp.in
```

Certbot will automatically:

- Generate SSL certificate
- Configure nginx
- Reload nginx

---

## Step 6 — Verify Nginx

Check config:

```bash
sudo nginx -t
```

Enable nginx:

```bash
sudo systemctl enable nginx
```

Check status:

```bash
sudo systemctl status nginx
```

---

## Step 7 — Start Backend with PM2

Go to backend directory:

```bash
cd ~/softwareProject/backend
```

Start server:

```bash
pm2 start index.js --name backend
```

Save PM2 process list:

```bash
pm2 save
```

Enable PM2 startup:

```bash
pm2 startup
```

PM2 will output a command like:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

⚠️ **Copy and run that exact command**

Check processes:

```bash
pm2 status
```

View logs:

```bash
pm2 logs backend
```

---

## Step 8 — Update Deployment Config

Update `deploy.yml`:

```yaml
host: NEW_EC2_PUBLIC_IP
```

Commit and push the change.

---

Update **GitHub Secret**

```
GitHub
→ Settings
→ Secrets and variables
→ Actions
→ DEPLOY_KEY
```

Replace with the **new EC2 private key**.

Commit & push `deploy.yml`.

(SURYA KARDEGA when he has the key)

---

## Step 9 — Verify Deployment

Run health check:

```bash
curl https://lostandfoundapi.guestapp.in/health
```

Confirm:

- API responds
- HTTPS works
- Vercel frontend connects to backend
- Database routes work

---

## Step 10 — Decommission Old Server

Stop the old EC2 instance.

Monitor system for **24–48 hours**.

If everything works:

Terminate the old EC2 instance.

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