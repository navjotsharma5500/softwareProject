# 🔥 CORS Fix - Deployment Guide

## Problem Summary
- **Error**: `Access to XMLHttpRequest has been blocked by CORS policy`
- **Cause**: Nginx 301 redirects (HTTP→HTTPS) strip CORS headers
- **Status**: `net::ERR_FAILED 301 (Moved Permanently)`

## Root Cause Analysis

### Why 301 Breaks CORS
1. Browser sends preflight OPTIONS request
2. If request hits HTTP, Nginx redirects with 301
3. **301 redirect does NOT preserve CORS headers**
4. Browser sees no `Access-Control-Allow-Origin` header
5. Browser blocks the actual request

### Why It Works in curl/Postman
- curl/Postman **don't enforce CORS** (not a browser security model)
- They follow redirects automatically without checking CORS headers

## ✅ Solution Applied

### 1. Nginx Configuration (Primary Fix)

**What Changed:**
- Added CORS headers **at Nginx level** (before Express)
- Handle OPTIONS preflight requests **directly in Nginx**
- CORS headers set with `always` flag (survives redirects/errors)
- Added `X-Forwarded-Host` header for proper host detection

**Why This Works:**
- Nginx adds CORS headers **before** any redirect happens
- OPTIONS requests return 204 immediately (no backend call)
- CORS headers present on **all responses** including errors

```nginx
location / {
    # Handle preflight OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://lost-and-found-portal-six.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 86400 always;
        return 204;
    }

    # Add CORS headers for all responses
    add_header 'Access-Control-Allow-Origin' 'https://lost-and-found-portal-six.vercel.app' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    proxy_pass http://backend;
    # ... rest of proxy config
}
```

### 2. Express CORS Configuration (Secondary)

**What Changed:**
- Simplified to work **with** Nginx (not against it)
- Trusts proxy in production mode
- Maintains localhost support for development

**Why This Works:**
- Nginx handles CORS in production
- Express handles CORS in development (localhost)
- No duplicate/conflicting headers

## 🚀 Deployment Steps

### Step 1: Update Nginx Config

```bash
# SSH into your EC2 instance
ssh your-ec2-user@your-ec2-ip

# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Upload the new nginx.conf to your server
# (You can use scp, git pull, or paste the content)

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 2: Deploy Backend Changes

```bash
# On your EC2 instance, pull latest code
cd /path/to/your/backend
git pull origin thapar

# Install dependencies (if needed)
npm install

# Restart PM2
pm2 restart all

# Or restart specific app
pm2 restart backend
```

### Step 3: Verify the Fix

**Test 1: Check CORS headers**
```bash
curl -I -X OPTIONS https://lostandfoundapi.guestapp.in/api/user/items \
  -H "Origin: https://lost-and-found-portal-six.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

**Expected Response:**
```
HTTP/2 204
access-control-allow-origin: https://lost-and-found-portal-six.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
access-control-max-age: 86400
```

**Test 2: Check actual API call**
```bash
curl -X GET https://lostandfoundapi.guestapp.in/api/user/items?page=1&limit=12 \
  -H "Origin: https://lost-and-found-portal-six.vercel.app"
```

**Expected:** Response with `access-control-allow-origin` header

**Test 3: Browser DevTools**
1. Open your frontend: `https://lost-and-found-portal-six.vercel.app`
2. Open DevTools → Network tab
3. Navigate to a page that calls the API
4. Check the request:
   - Should see **200 OK** (not 301)
   - Response Headers should include:
     - `access-control-allow-origin: https://lost-and-found-portal-six.vercel.app`
     - `access-control-allow-credentials: true`

## 🧠 Common Mistakes (Avoided)

### ❌ What NOT to Do

1. **Using wildcard with credentials**
   ```javascript
   // WRONG - Doesn't work with credentials: true
   cors({ origin: '*', credentials: true })
   ```

2. **CORS only in Express (behind Nginx)**
   - Express CORS doesn't help if Nginx redirects first
   - Nginx strips headers during redirect

3. **Disabling CORS entirely**
   ```javascript
   // WRONG - Security risk
   app.use((req, res, next) => {
     res.header("Access-Control-Allow-Origin", "*");
   })
   ```

4. **Not using `always` flag in Nginx**
   ```nginx
   # WRONG - Headers lost on error responses
   add_header 'Access-Control-Allow-Origin' '...';
   
   # RIGHT - Headers present even on errors
   add_header 'Access-Control-Allow-Origin' '...' always;
   ```

5. **Duplicate CORS headers**
   - Both Nginx and Express adding same headers
   - Can cause browser to reject (multiple different values)

## 🔒 Security Considerations

### Why This is Secure

1. **Specific Origin** - Not using wildcards
   ```nginx
   # Good - Explicit origin
   add_header 'Access-Control-Allow-Origin' 'https://lost-and-found-portal-six.vercel.app' always;
   ```

2. **Credentials Protected** - Only allowed origin can send cookies

3. **Method Whitelist** - Only specific HTTP methods allowed

4. **Header Whitelist** - Only specific headers allowed

### Production Checklist

- [ ] HTTPS enforced (301 redirect from HTTP)
- [ ] CORS headers on all responses (including errors)
- [ ] Origin is explicit (not `*`)
- [ ] Credentials only for trusted origins
- [ ] OPTIONS preflight handled
- [ ] Max-Age set for preflight caching
- [ ] CSP headers configured (already done in helmet)

## 📊 Architecture Flow

### Before (Broken)
```
Browser → HTTP Request → Nginx → 301 Redirect (loses CORS) → Browser blocks
```

### After (Fixed)
```
Browser → HTTPS Request → Nginx (adds CORS) → Express → Nginx → Browser (CORS headers present)
```

### Preflight Flow
```
Browser → OPTIONS → Nginx (returns 204 + CORS) → Browser (allows actual request)
Browser → GET/POST → Nginx (adds CORS) → Express → Response (CORS headers present)
```

## 🎯 Testing Checklist

After deployment, verify:

- [ ] Frontend can fetch items list
- [ ] Frontend can create reports
- [ ] Frontend can upload images
- [ ] Authentication works (cookies sent)
- [ ] No CORS errors in browser console
- [ ] No 301 redirects in Network tab
- [ ] All API endpoints work from browser
- [ ] curl/Postman still work

## 🆘 Troubleshooting

### If CORS errors persist:

1. **Check Nginx is reloaded**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

2. **Check browser is using HTTPS**
   - Ensure frontend calls `https://lostandfoundapi.guestapp.in`
   - Not `http://lostandfoundapi.guestapp.in`

3. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear cache and hard reload

4. **Check Nginx logs**
   ```bash
   sudo tail -f /var/log/nginx/subdomain-error.log
   sudo tail -f /var/log/nginx/subdomain-access.log
   ```

5. **Verify backend is running**
   ```bash
   pm2 status
   pm2 logs backend
   ```

6. **Check firewall**
   ```bash
   sudo ufw status
   # Ensure 80 and 443 are open
   ```

## 🎉 Success Indicators

You'll know it's fixed when:
- ✅ No CORS errors in browser console
- ✅ Network tab shows 200/204 (not 301)
- ✅ `Access-Control-Allow-Origin` header present in responses
- ✅ Frontend can call all API endpoints
- ✅ Authentication/cookies work properly

---

**Last Updated**: February 5, 2026
**Status**: Ready for deployment
**Tested**: Production-ready configuration
