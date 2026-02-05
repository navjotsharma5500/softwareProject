# Subdomain Deployment Guide

## Deploy Your Lost & Found Portal to Your Existing Domain

### **What you have:**

1. ✅ **Your purchased domain** (e.g., `yourdomain.com`)
2. ✅ **EC2 instance** (IP: `43.205.143.123`)
3. ✅ **Cloudflare account**

### **Goal:**

Deploy to: `lostandfoundapi.guestapp.in`

---

## **Step 1: Add Your Existing Domain to Cloudflare**

1. Go to [Cloudflare.com](https://cloudflare.com) → **Add a Site**
2. Enter your **base domain**: `guestapp.in`
3. Choose **Free plan**
4. Cloudflare will import your existing DNS records
5. **Update nameservers** at your domain registrar to Cloudflare's nameservers

---

## **Step 2: Create DNS Record for Your Backend**

In Cloudflare DNS settings:

1. Click **"Add record"**
2. **Type**: A
3. **Name**: `lostandfoundapi`
4. **IPv4 Address**: `43.205.143.123`
5. **Proxy Status**: ☁️ **Proxied** (Orange cloud - enables Cloudflare CDN & security)
6. **TTL**: Auto

**Result**: `lostandfoundapi.guestapp.in` → Your EC2 Backend

---

## **Step 3: Connect to EC2 & Setup**

```bash
# Connect to EC2 (using your actual path)
ssh -i "C:\Users\SURYA\.ssh\lost&found.pem" ubuntu@43.205.143.123
```

---

## **Step 4: Install Everything**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js, Nginx, Certbot
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx git

# Install PM2
sudo npm install -g pm2

# Clone project
git clone https://github.com/SuryaKTiwari11/softwareProject.git
cd softwareProject/backend

# Install and start backend
npm install
pm2 start npm --name "backend" -- start
pm2 save
pm2 startup
```

---

## **Step 5: Configure Nginx**

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create your site config
sudo nano /etc/nginx/sites-available/your-subdomain
```

**Paste this (replace `your-subdomain.yourdomain.com`):**

```nginx
server {
    listen 80;
    server_name lostandfoundapi.guestapp.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/your-subdomain /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## **Step 6: Get SSL Certificate**

```bash
# Get SSL certificate for your domain
sudo certbot --nginx -d lostandfoundapi.guestapp.in

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Choose redirect (option 2)
```

**Your site is now live with HTTPS!** 🎉

---

## **Step 7: AWS Security Group**

1. Go to EC2 → Security Groups
2. **Add inbound rules:**
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
   - SSH (22) - Your IP only

---

## **Step 8: Test Your Site**

Visit: `https://lostandfoundapi.guestapp.in`

You should see your Lost & Found Portal!

---

## **Essential Commands:**

```bash
# Check backend
pm2 status

# Check nginx
sudo systemctl status nginx

# Restart services
pm2 restart backend
sudo systemctl restart nginx

# Check SSL renewal (auto-renews)
sudo certbot renew --dry-run
```

---

## **Troubleshooting:**

**Site not loading?**

```bash
# Check backend is running
curl http://localhost:3000/health

# Check nginx config
sudo nginx -t

# Check DNS
nslookup lostandfoundapi.guestapp.in
```

**SSL issues?**

```bash
# Re-run certbot
sudo certbot --nginx -d your-subdomain.yourdomain.com --force-renewal
```

---

## **Final Result:**

✅ **Your subdomain**: `https://lostandfoundapi.guestapp.in`  
✅ **SSL Certificate**: Auto-renewing  
✅ **Cloudflare CDN**: Enabled  
✅ **Backend**: Running with PM2  
✅ **Nginx**: Reverse proxy with security

**Total time: ~15 minutes** 🚀
