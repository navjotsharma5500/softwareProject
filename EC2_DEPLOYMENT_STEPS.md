# Lost & Found Portal — EC2 Deployment Guide (Production)

This guide explains **exactly** how to deploy your Lost & Found portal on a new EC2 instance where Node, Nginx, PM2, and MongoDB are already installed and a previous website is running.

---

## CampusConnect Production Deployment (with Nginx, Custom URLs)

### 1. Nginx Configuration (Step-by-Step)

**Goal:**

- Serve frontend at: https://campusconnect.thapar.edu/lostnfound/
- Serve backend API at: https://campusconnect.thapar.edu/api/

**Step 1:** SSH into your EC2 instance.

**Step 2:** Open or create the Nginx config file:

```sh
sudo nano /etc/nginx/sites-available/lostfound
```

**Step 3:** Paste this config (edit paths if your project root is different):

```nginx
server {
  listen 80;
  server_name campusconnect.thapar.edu;

  # Serve frontend static files
  location /lostnfound/ {
    alias /var/www/lostfound/frontend/dist/;
    try_files $uri $uri/ /lostnfound/index.html;
  }

  # Proxy API requests to backend
  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Step 4:** Enable the config:

```sh
sudo ln -sf /etc/nginx/sites-available/lostfound /etc/nginx/sites-enabled/lostfound
```

**Step 5:** Test and reload Nginx:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

**What to copy for Nginx:**

- The entire contents of your frontend build folder (`frontend/dist/`) must be present at `/var/www/lostfound/frontend/dist/`.
- Nginx does NOT copy files itself; you must copy them after every frontend build (see below for commands).

---

### 2. What to Copy Where (Detailed)

**Frontend:**

1. Build the frontend:

```sh
cd /var/www/lostfound/frontend
npm install
npm run build
```

2. Copy the build output to the Nginx-served directory (if not already there):

```sh
sudo mkdir -p /var/www/lostfound/frontend/dist
sudo cp -r dist/* /var/www/lostfound/frontend/dist/
```

- If you build in-place, just ensure `/var/www/lostfound/frontend/dist/` contains your latest build.

**Backend:**

1. Start the backend (from `/var/www/lostfound/backend`):

```sh
cd /var/www/lostfound/backend
npm install --omit=dev
pm2 start index.js --name backend
pm2 save
```

- The backend listens on `127.0.0.1:3000` (not public), as required by Nginx proxy.

---

### 3. What URLs to Use (Summary)

- **Frontend:**
  - Users visit: `https://campusconnect.thapar.edu/lostnfound/`
- **API:**
  - All API calls go to: `https://campusconnect.thapar.edu/api/`
  - No Vercel or other host needed; everything is on this EC2.

---

### 4. .env Settings (Where and What)

**Frontend:**

1. Go to the frontend folder:

```sh
cd /var/www/lostfound/frontend
cp .env.example .env
nano .env
```

2. Set:

```
VITE_API_BASE_URL=https://campusconnect.thapar.edu/api
VITE_NODE_ENV=production
```

**Backend:**

1. Go to the backend folder:

```sh
cd /var/www/lostfound/backend
cp .env.example .env
nano .env
```

2. Set:

```
FRONTEND_URL=https://campusconnect.thapar.edu/lostnfound
GOOGLE_CALLBACK_URL=https://campusconnect.thapar.edu/api/auth/google/callback
PORT=3000
NODE_ENV=production
# ...other secrets (see .env.example)
```

---

### 5. How to Test (Checklist)

1. Open your browser and go to: `https://campusconnect.thapar.edu/lostnfound/`
2. Try logging in, submitting a report, etc.
3. Open browser dev tools > Network tab:

- Confirm all API requests go to `/api/` (not localhost or Vercel).

4. If you see 404s or blank pages:

- Check that `/var/www/lostfound/frontend/dist/` contains your build.
- Check Nginx config and reload if changed.
- Check PM2 status: `pm2 status`
- Check backend logs: `pm2 logs backend`

---

---

**Summary:**

- Nginx serves `/lostnfound/` from `/var/www/lostfound/frontend/dist/`
- Nginx proxies `/api/` to backend running on `127.0.0.1:3000`
- All URLs are under `https://campusconnect.thapar.edu/`
- .env files must be set as above, in the correct folders
- Always reload Nginx after changing config or copying new frontend builds

If you need the config as a file or want SSL (HTTPS) config, let me know!

git clone https://github.com/navjotsharma5500/softwareProject.git .

## Checklist

- [ ] Backend runs (`pm2 status` shows backend online)
- [ ] Frontend builds (`frontend/dist/` exists and is served by Nginx)
- [ ] API connected (frontend can call backend endpoints)
- [ ] Images upload (ImageKit keys set)
- [ ] Emails send (Gmail SMTP works)
- [ ] Database connected (MongoDB URI correct)
- [ ] Site accessible via public IP/domain

---

## Troubleshooting

- **CORS errors:** Check `FRONTEND_URL` in backend `.env` and `VITE_API_BASE_URL` in frontend `.env`.
- **API 404:** Make sure Nginx proxies `/api/` to backend.
- **Image upload/email issues:** Check `.env` secrets.
- **MongoDB connection:** Ensure MongoDB is running and accessible.

---

## 10. Updating the Site

```sh
cd /var/www/lostfound

git pull
cd backend && npm install --omit=dev && pm2 restart backend
cd ../frontend && npm install && npm run build && sudo cp -r dist/* /var/www/lostfound/frontend/dist/
sudo nginx -t && sudo systemctl reload nginx
```

---

**Done! Your Lost & Found portal should now be live on your new EC2.**
