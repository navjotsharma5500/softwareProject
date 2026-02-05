# GitHub Actions - Continuous Deployment

## Setup Instructions

### 1. Generate SSH Key (if you don't have one)

On your EC2 instance:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

# Add the public key to authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Display the private key (you'll need this for GitHub Secrets)
cat ~/.ssh/github_actions_key
```

### 2. Add GitHub Secrets

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these:

| Secret Name | Value | Example |
|------------|-------|---------|
| `EC2_HOST` | Your EC2 public IP or domain | `ec2-xx-xx-xx-xx.compute.amazonaws.com` or `lostandfoundapi.guestapp.in` |
| `EC2_USERNAME` | Your EC2 username | `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Private key content | Copy entire content from `~/.ssh/github_actions_key` |

### 3. Prepare EC2 Instance

On your EC2 instance:

```bash
# Ensure git is configured
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Clone the repository (if not already done)
cd ~
git clone https://github.com/SuryaKTiwari11/softwareProject.git
cd softwareProject

# Checkout main branch
git checkout main

# Install dependencies
cd backend
npm install --production

# Ensure PM2 is installed globally
npm install -g pm2

# Start backend with PM2
pm2 start index.js --name backend
pm2 save
pm2 startup # Follow instructions to enable PM2 on boot

# Setup Nginx config symlink
sudo ln -sf ~/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi.guestapp.in
sudo ln -sf /etc/nginx/sites-available/lostandfoundapi.guestapp.in /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Grant Sudo Permissions (for Nginx reload)

Allow your user to reload Nginx without password:

```bash
sudo visudo
```

Add this line (replace `ubuntu` with your username):
```
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/bin/systemctl reload nginx, /usr/bin/systemctl status nginx, /bin/cp /home/ubuntu/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi.guestapp.in
```

Save and exit (Ctrl+X, Y, Enter).

### 5. Test the Workflow

**Option A: Push to main**
```bash
git checkout main
git merge thapar
git push origin main
```

**Option B: Manual trigger**
1. Go to GitHub → **Actions** tab
2. Select **Deploy to EC2** workflow
3. Click **Run workflow** → Select `main` branch → **Run workflow**

### 6. Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the deployment logs in real-time

## Workflow Triggers

- **Automatic**: Triggers on every push to `main` branch
- **Manual**: Can be triggered manually from Actions tab

## What Happens During Deployment

1. ✅ Checks out code
2. 📥 SSH into EC2
3. 🔄 Pull latest code from main
4. 📦 Install backend dependencies
5. ♻️  Restart backend with PM2
6. 🌐 Update Nginx configuration
7. ✅ Test Nginx config
8. 🔄 Reload Nginx (only if test passes)
9. 📊 Display PM2 status
10. 🎉 Done!

## Security Notes

- SSH key is stored securely in GitHub Secrets (encrypted)
- Never commit SSH keys or secrets to the repository
- Use least-privilege sudo permissions
- Regularly rotate SSH keys

## Troubleshooting

### Deployment fails at "git pull"
```bash
# On EC2, ensure no uncommitted changes
cd ~/softwareProject
git stash
git pull origin main
```

### Deployment fails at "pm2 restart"
```bash
# Check PM2 logs
pm2 logs backend

# Manually restart
pm2 restart backend
```

### Deployment fails at "nginx -t"
```bash
# Check Nginx config syntax
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Can't reload Nginx (permission denied)
- Verify sudo permissions in visudo
- Test manually: `sudo systemctl reload nginx`

## Alternative: Using GitHub Deploy Keys

If you prefer not to use password-based SSH:

1. **On EC2**: Generate deploy key
   ```bash
   ssh-keygen -t ed25519 -C "deploy@lostandfound"
   cat ~/.ssh/id_ed25519.pub
   ```

2. **On GitHub**: Add deploy key
   - Repo → **Settings** → **Deploy keys** → **Add deploy key**
   - Paste public key, name it "EC2 Deploy Key"
   - ✅ Check "Allow write access"

3. **Update workflow**: Use deploy key instead of username/password

## Files Changed by CD

- `backend/index.js` and all backend files
- `backend/package.json` dependencies
- `nginx.conf` → `/etc/nginx/sites-available/lostandfoundapi.guestapp.in`
- PM2 process restart

## Rollback Strategy

If deployment breaks production:

```bash
# On EC2
cd ~/softwareProject
git log --oneline  # Find last working commit
git checkout <commit-hash>
pm2 restart backend
sudo systemctl reload nginx
```

Then fix the issue and push again.

---

**Status**: Ready to use
**Last Updated**: February 5, 2026
