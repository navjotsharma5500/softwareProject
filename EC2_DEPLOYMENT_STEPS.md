# Lost & Found Portal — EC2 Deployment Guide (Production)

This guide explains **exactly** how to deploy your Lost & Found portal on a new EC2 instance where Node, Nginx, PM2, and MongoDB are already installed.

**What You're Building:**

You have been given the domain: **https://campusconnect.thapar.edu/**

This is a SHARED domain with other services (like `/api/venue/enquiry/...`), so your Lost & Found API is namespaced:

- **Frontend:** https://campusconnect.thapar.edu/lostnfound/ (and all its routes)
- **API:** https://campusconnect.thapar.edu/api/lostnfound/ (all backend endpoints)

This means:

- ✅ No separate domain needed
- ✅ No Vercel domain needed
- ✅ Everything runs under campusconnect.thapar.edu
- ✅ API is namespaced to avoid conflicts with other services
- ✅ Nginx routes both paths to the correct services

**How It Works:**

Your EC2 instance will:

1. Serve React frontend static files at `/lostnfound/` path
2. Proxy API requests at `/api/lostnfound/` path to Node.js backend running on port 3000
3. Both use the same domain (campusconnect.thapar.edu)

---

## Prerequisites

Before starting, ensure you have:

- [ ] **DNS verified:** Domain `campusconnect.thapar.edu` has DNS A record pointing to your EC2's public IP
  - Test with: `ping campusconnect.thapar.edu` or `nslookup campusconnect.thapar.edu`
  - If not set up, ask your administrator to create the DNS A record
- [ ] SSH access to your EC2 instance
- [ ] Node.js 20+ installed
- [ ] Nginx installed and running
- [ ] MongoDB running and accessible
- [ ] Your production `.env` values ready
- [ ] Git installed

---

## Understanding the Architecture

**DNS Setup (Already done for you):**

- When someone visits `https://campusconnect.thapar.edu/lostnfound/`, their browser looks up the DNS A record
- DNS points to your EC2's public IP address
- The request reaches your EC2's Nginx web server

**Nginx Routing (What we'll configure):**

- All requests come to Nginx listening on port 80 (HTTP) or 443 (HTTPS)
- Nginx looks at the request path:
  - If path is `/lostnfound/*` → serve React static files
  - If path is `/api/lostnfound/*` → forward to Node.js backend on localhost:3000 (stripping the `/lostnfound` part)
- Both responses go back with the same domain in the URL

**Example Request Flow:**

```
User visits: https://campusconnect.thapar.edu/lostnfound/
                    ↓
           DNS resolves to EC2 IP
                    ↓
           Nginx receives request on port 80/443
                    ↓
           Nginx sees /lostnfound/ path
                    ↓
           Sends static files from /var/www/lostfound/frontend/dist/
                    ↓
           Browser renders React app

---

User's app calls: https://campusconnect.thapar.edu/api/lostnfound/user/items
                    ↓
           Nginx receives request on port 80/443
                    ↓
           Nginx sees /api/lostnfound/ path
                    ↓
           Nginx rewrites to /api/user/items (strips /lostnfound)
                    ↓
           Nginx proxies to http://127.0.0.1:3000/api/user/items
                    ↓
           Node.js backend responds
                    ↓
           Nginx returns response to browser
```

---

## Complete Deployment Steps

### Step 0: Clone the Repository

SSH into your EC2 and clone the project:

```sh
cd /var/www
sudo mkdir -p lostfound
sudo chown $USER:$USER lostfound
cd lostfound

# Clone the repository
git clone https://github.com/navjotsharma5500/softwareProject.git .

# Verify the clone
ls -la  # Should show backend, frontend, .git, etc.
```

---

### Step 1: Configure Nginx

1. **Create the Nginx config file:**

```sh
sudo nano /etc/nginx/sites-available/lostfound
```

2. **Paste this config:**

```nginx
server {
    listen 80;
    server_name campusconnect.thapar.edu;

    # Serve frontend static files
    location /lostnfound/ {
        alias /var/www/lostfound/frontend/dist/;
        try_files $uri $uri/ /lostnfound/index.html;
    }

    # Proxy Lost & Found API requests to backend
    # This rewrites /api/lostnfound/... to /api/... before proxying
    location /api/lostnfound/ {
        # Rewrite: strip /lostnfound from the path
        rewrite ^/api/lostnfound(/.*)$ /api$1 break;

        # Proxy to Node.js backend
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Enable the config:**

```sh
sudo ln -sf /etc/nginx/sites-available/lostfound /etc/nginx/sites-enabled/lostfound
```

4. **Test and reload:**

```sh
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 2: Setup Backend

1. **Navigate to backend folder and setup .env:**

```sh
cd /var/www/lostfound/backend
cp .env.example .env
nano .env
```

2. **Edit and fill these critical values:**

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/lostfound
MONGODB_URI=mongodb://localhost:27017/lostfound

# Authentication
JWT_SECRET=your-production-secret-here

# Frontend URL (MUST use the domain you were given)
FRONTEND_URL=https://campusconnect.thapar.edu/lostnfound

# Google OAuth Callback (MUST use the namespaced API domain)
GOOGLE_CALLBACK_URL=https://campusconnect.thapar.edu/api/lostnfound/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
GMAIL_USER=your-gmail-address
GMAIL_PASS=your-gmail-app-password

# Image Upload
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# AI/Chatbot
GEMINI_API_KEY=your-gemini-api-key
```

**⚠️ IMPORTANT:**

- `FRONTEND_URL` must be: `https://campusconnect.thapar.edu/lostnfound`
- `GOOGLE_CALLBACK_URL` must be: `https://campusconnect.thapar.edu/api/auth/google/callback`
- DO NOT use localhost or IP addresses
- DO NOT use different domains
- These must match what's actually running on your EC2

3. **Install dependencies and start with PM2:**

```sh
npm install --omit=dev
pm2 start index.js --name backend
pm2 save
```

4. **Enable PM2 to restart automatically on server reboot:**

```sh
# Generate the startup command
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Copy and run the entire command from the output above
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Save the process list again
pm2 save
```

5. **Verify PM2 startup is enabled:**

```sh
pm2 status
pm2 logs backend  # Check for any errors
```

**Important:** After you reboot your EC2 instance, the backend will automatically start via PM2. You can verify this with:

```sh
pm2 status  # Should show your backend process as online
```

---

### Step 3: Setup Frontend

1. **Navigate to frontend folder and setup .env:**

```sh
cd /var/www/lostfound/frontend
cp .env.example .env
nano .env
```

2. **Edit with ONLY these two values:**

```env
# This MUST point to the namespaced API on the SAME domain you were given
VITE_API_BASE_URL=https://campusconnect.thapar.edu/api/lostnfound

# Production environment
VITE_NODE_ENV=production
```

**⚠️ IMPORTANT:**

- `VITE_API_BASE_URL` must be: `https://campusconnect.thapar.edu/api/lostnfound`
- DO NOT use `https://campusconnect.thapar.edu/api` (that's for other services)
- DO NOT use localhost
- DO NOT use a different domain
- This tells your React app where to send API requests
- When user logs in or submits a report, it will call this namespaced URL

3. **Install dependencies:**

```sh
npm install
```

4. **Build the frontend:**

```sh
npm run build
```

5. **Copy build to Nginx directory:**

```sh
sudo mkdir -p /var/www/lostfound/frontend/dist
sudo cp -r dist/* /var/www/lostfound/frontend/dist/

# Verify files are there
ls -la /var/www/lostfound/frontend/dist/ | head -20
```

---

### Step 4: Verify Everything Works

1. **Check backend status:**

```sh
pm2 status
pm2 logs backend  # Check for errors
```

2. **Verify frontend files exist:**

```sh
ls -la /var/www/lostfound/frontend/dist/
```

3. **Test in your browser:**
   - Visit: `https://campusconnect.thapar.edu/lostnfound/`
   - Try logging in
   - Submit a report
   - Upload images

4. **Check network requests:**
   - Open browser dev tools > Network tab
   - Confirm all API requests go to `/api/lostnfound/` (not `/api/` alone)
   - URL examples you should see:
     - `https://campusconnect.thapar.edu/api/lostnfound/user/items`
     - `https://campusconnect.thapar.edu/api/lostnfound/reports`
     - `https://campusconnect.thapar.edu/api/lostnfound/auth/google/callback`
   - Should NOT see: localhost, `/api/venue/`, or external URLs

---

### Step 5: Set Up Vercel Redirect (Optional but Recommended)

After your EC2 deployment is COMPLETE and you've verified everything works at `https://campusconnect.thapar.edu/lostnfound/`, set up a redirect so old bookmarks don't break.

**⚠️ ONLY DO THIS AFTER STEP 4 IS FULLY VERIFIED**

#### Steps to Enable the Redirect:

1. **Find the redirect configuration:**
   - Open `VERCEL_REDIRECT_READY.txt` in your repo root
   - Copy the entire configuration code (the JSON block)

2. **Update `frontend/vercel.json`:**

```sh
# Edit frontend/vercel.json
nano frontend/vercel.json
```

3. **Replace the entire file content with the code from VERCEL_REDIRECT_READY.txt**
   - The new config redirects Vercel traffic to your EC2 domain
   - Keep the routes section (it's still needed for local Vercel previews)

4. **Commit and push:**

```sh
git add frontend/vercel.json
git commit -m "Enable redirect from Vercel to campusconnect domain"
git push
```

5. **Vercel deploys automatically:**
   - After ~1-2 minutes, anyone visiting `https://lost-and-found-portal-six.vercel.app/` will redirect to `https://campusconnect.thapar.edu/lostnfound/`
   - All old bookmarks/links work automatically
   - Search engines will update over time

**⚠️ IMPORTANT: Keep the Vercel App Running**

- **DO NOT delete the old Vercel app** (`lost-and-found-portal-six.vercel.app`)
- The Vercel app is what SERVES the redirect to users
- If you delete it, the redirect stops working (404 error for old links)
- You can disable billing or scale down resources, but keep the app deployed
- The app doesn't need to serve your actual app anymore - it just redirects

**What You CAN Do:**

- ✅ Disable or pause your EC2 instance (your actual app runs there now)
- ✅ Stop paying for compute on EC2 if you want (but it won't be accessible)
- ✅ Keep Vercel app running (it's cheap and needed for the redirect)

**What You SHOULD NOT Do:**

- ❌ Delete the Vercel app (breaks all old links)
- ❌ Disable the Vercel deployment (breaks all old links)

**Summary:**

| Component      | Status            | Cost                       | Need for Redirect?       |
| -------------- | ----------------- | -------------------------- | ------------------------ |
| Old Vercel App | **KEEP DEPLOYED** | ~$0 (free tier or minimal) | ✅ YES - serves redirect |
| EC2 Instance   | Can pause/close   | Save money                 | No - main app is there   |

---

### Step 6: Update the Site (Future Deployments)

When you need to deploy updates:

```sh
cd /var/www/lostfound

# Get latest code
git pull

# Update backend
cd backend
npm install --omit=dev
pm2 restart backend
pm2 save

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/lostfound/frontend/dist/

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Final Checklist

- [ ] **DNS verified:** `ping campusconnect.thapar.edu` resolves to your EC2's public IP
- [ ] Cloned repository to `/var/www/lostfound/` (Step 0)
- [ ] Nginx config created and reloaded (Step 1)
- [ ] Backend running (`pm2 status` shows "online") (Step 2)
- [ ] Backend `.env` filled with all values (Step 2)
- [ ] Frontend built and copied to `/var/www/lostfound/frontend/dist/` (Step 3)
- [ ] Frontend `.env` filled with correct API URL (Step 3)
- [ ] Can visit: https://campusconnect.thapar.edu/lostnfound/ (Step 4)
- [ ] API calls work (check Network tab in dev tools) (Step 4)
- [ ] API requests go to `/api/lostnfound/` path (Step 4)
- [ ] Login works (Google OAuth) (Step 4)
- [ ] Reports and images upload (Step 4)
- [ ] Emails send (test with a claim) (Step 4)
- [ ] MongoDB connected (check logs) (Step 4)
- [ ] Vercel redirect configured and deployed (Step 5 - AFTER step 4 is verified)

---

## How to Verify You're Using the Right Domain

In your browser, do this:

1. **Visit the frontend:**
   - Go to: https://campusconnect.thapar.edu/lostnfound/
   - Check the URL bar - should show: `https://campusconnect.thapar.edu/lostnfound/`

2. **Check API calls:**
   - Open Dev Tools (F12)
   - Go to Network tab
   - Login or submit a report
   - Look at the network requests
   - API calls should go to: `https://campusconnect.thapar.edu/api/lostnfound/...`
   - Should NOT show: localhost, 127.0.0.1, Vercel, or any other domain

3. **Test from different devices:**
   - Try accessing from your phone
   - Should work since DNS points to public IP

---

## Troubleshooting

| Issue                                    | Solution                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **404 on frontend**                      | Verify `/var/www/lostfound/frontend/dist/index.html` exists with `ls -la`                       |
| **API 404**                              | Check Nginx config proxies `/api/lostnfound/` to `127.0.0.1:3000` - run `sudo nginx -t`         |
| **CORS errors**                          | Verify `FRONTEND_URL` in backend `.env` and `VITE_API_BASE_URL` in frontend `.env` match domain |
| **Images not uploading**                 | Check ImageKit credentials in backend `.env` are correct                                        |
| **Emails not sending**                   | Verify Gmail App Password (not regular password) in backend `.env`                              |
| **MongoDB connection fails**             | Verify `MONGO_URI` is correct and MongoDB is running `sudo systemctl status mongod`             |
| **PM2 not starting**                     | Check logs: `pm2 logs backend` - see actual error message                                       |
| **Nginx won't reload**                   | Check syntax: `sudo nginx -t` - fix any errors shown                                            |
| **Git clone slow**                       | This is normal - be patient, large projects take time                                           |
| **PM2 not auto-restarting after reboot** | Run `pm2 startup` again and copy/paste the full sudo command output, then `pm2 save`            |
| **PM2 auto-start broken after update**   | Run `pm2 unstartup` then `pm2 startup` to regenerate startup script                             |

---

## Quick Commands Reference

```sh
# Check backend status
pm2 status

# View backend logs
pm2 logs backend

# Restart backend
pm2 restart backend

# Save process list (important for auto-start)
pm2 save

# Check if PM2 startup is enabled
pm2 startup

# Remove PM2 startup (if needed)
pm2 unstartup

# Restart backend and save
pm2 restart backend && pm2 save

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Check if port 3000 is listening
netstat -tulpn | grep 3000

# View system reboot logs (to verify PM2 auto-start works)
sudo dmesg | tail -20
```

---

**Done! Your Lost & Found portal is live at https://campusconnect.thapar.edu/lostnfound/**

---

## Summary: Domain Architecture

You were given ONE shared domain: `https://campusconnect.thapar.edu/`

This domain is shared with other microservices (e.g., `/api/venue/enquiry/...`). Your Lost & Found API is namespaced at `/api/lostnfound/` to avoid conflicts.

You use it for BOTH frontend and backend:

| Component            | URL                                                                  | Served By                 |
| -------------------- | -------------------------------------------------------------------- | ------------------------- |
| Frontend (React App) | https://campusconnect.thapar.edu/lostnfound/                         | Nginx (static files)      |
| Backend API          | https://campusconnect.thapar.edu/api/lostnfound/                     | Node.js (via Nginx proxy) |
| Login Callback       | https://campusconnect.thapar.edu/api/lostnfound/auth/google/callback | Node.js                   |
| Check Items API      | https://campusconnect.thapar.edu/api/lostnfound/user/items           | Node.js                   |
| Submit Report API    | https://campusconnect.thapar.edu/api/lostnfound/reports              | Node.js                   |

**Namespaced API Benefits:**

- `campusconnect.thapar.edu` runs multiple services
- Lost & Found API is `/api/lostnfound/`
- Other services use different paths: `/api/venue/`, `/api/enquiry/`, etc.
- No conflicts between different apps
- Clean, organized API structure

When users visit your site, they only need to know ONE URL: `https://campusconnect.thapar.edu/lostnfound/`

---

## Post-Deployment: Managing Vercel and EC2

**After everything is live and the redirect is deployed, here's what to do:**

### Platform Responsibilities After Migration

| Platform                                            | Purpose                        | Keep Running?       | Cost             |
| --------------------------------------------------- | ------------------------------ | ------------------- | ---------------- |
| **Vercel** (`lost-and-found-portal-six.vercel.app`) | Serves redirect to EC2         | ✅ **YES - ALWAYS** | $0-20/month      |
| **EC2** (`campusconnect.thapar.edu`)                | Runs actual frontend + backend | ✅ As needed        | Depends on usage |

### What You Can Do:

**✅ Safe to do:**

- Stop/pause the EC2 instance if you don't need it running 24/7 (saves money)
- Scale down EC2 resources if traffic is low
- Delete unnecessary files from EC2
- Update code and redeploy to EC2
- Monitor Vercel for redirect traffic

**❌ DO NOT do:**

- **Delete the Vercel app** - it serves the redirect, without it old links break
- **Disable Vercel deployment** - redirect won't work
- **Delete `frontend/vercel.json`** - redirect configuration is there
- **Remove the redirect** unless you're 100% sure no one uses the old URL

### Checking the Redirect Works:

```bash
# Test from command line (should show 301 redirect)
curl -I https://lost-and-found-portal-six.vercel.app/
# Should show: HTTP/1.1 308 Permanent Redirect
# Location: https://campusconnect.thapar.edu/lostnfound/

# Or visit in Vercel dashboard
# Settings > Redirects > Should show your redirect rule
```

### If You Ever Need to Change the Redirect:

```sh
# Edit frontend/vercel.json
nano frontend/vercel.json

# Change the "destination" URL to wherever you want
# Then push to git
git add frontend/vercel.json
git commit -m "Update redirect destination"
git push

# Vercel redeploys automatically
```

---

**🎉 Your Lost & Found portal is now professionally deployed!**
