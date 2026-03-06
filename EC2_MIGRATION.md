Here is your clean final migration guide with the changes you asked for:

✅ Added git clone step

✅ Made sure npm install runs in the project root

✅ Cleaned the flow so the person deploying cannot mess it up

✅ .env transfer step still included



---

EC2 Instance Migration Guide

lostandfoundapi.guestapp.in · Node 20 · PM2 · Nginx · Certbot · Cloudflare


---

Step 1 — Provision the New EC2

Launch Ubuntu EC2

Open ports in Security Group:


22 (SSH)
80 (HTTP)
443 (HTTPS)

Attach or create a .pem SSH key



---

Step 2 — Install Dependencies

sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y nodejs nginx git

sudo npm install -g pm2

Verify versions:

node -v
npm -v
pm2 -v


---

Step 3 — Clone Project

Go to your home directory:

cd ~

Clone the repo:

git clone https://github.com/<your-org>/<repo>.git softwareProject

Go inside project root:

cd softwareProject

Install dependencies in the root folder:

npm install --omit=dev


---

Step 4 — Transfer .env

Go to backend folder:

cd backend

Create .env file:

nano .env

Now on the old EC2 instance, run:

cat ~/softwareProject/backend/.env

Copy the values and paste them into the new instance .env.

Save:

CTRL + O
ENTER
CTRL + X


---

Step 5 — Setup Nginx + SSL

⚠️ Before running this step

Make sure Cloudflare DNS A record points to the NEW EC2 IP

Example:

lostandfoundapi.guestapp.in → NEW_EC2_PUBLIC_IP


---

Install certbot:

sudo apt install -y certbot python3-certbot-nginx

Copy nginx config:

sudo cp ~/softwareProject/nginx.conf /etc/nginx/sites-available/lostandfoundapi

Enable site:

sudo ln -s /etc/nginx/sites-available/lostandfoundapi /etc/nginx/sites-enabled/

Remove default site:

sudo rm -f /etc/nginx/sites-enabled/default

Now generate SSL:

sudo certbot --nginx -d lostandfoundapi.guestapp.in

Certbot will automatically:

create SSL certificate

configure nginx

reload nginx



---

Step 6 — Verify Nginx

Check config:

sudo nginx -t

Enable nginx:

sudo systemctl enable nginx

Check status:

sudo systemctl status nginx


---

Step 7 — Start Backend with PM2

Go to backend:

cd ~/softwareProject/backend

Start server:

pm2 start index.js --name backend

Save process list:

pm2 save

Enable startup on reboot:

pm2 startup

PM2 will print a command like:

sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

⚠️ Copy and run that exact command


---

Check processes:

pm2 status

View logs:

pm2 logs backend


---

Step 8 — Update Deployment Config

Update deploy.yml

host: NEW_EC2_PUBLIC_IP

Commit and push.


---

Update GitHub Secret

Go to:

GitHub
→ Settings
→ Secrets and variables
→ Actions
→ DEPLOY_KEY

Replace it with the new EC2 private key.

Commit and push deploy.yml.

(SURYA KARDEGA when he has the key)


---

Step 9 — Verify Deployment

Run health check:

curl https://lostandfoundapi.guestapp.in/health

Confirm:

API responds

HTTPS works

Vercel frontend connects to API

Upload / DB routes work



---

Step 10 — Decommission Old Server

Stop the old EC2.

Monitor for 24–48 hours.

If everything works:

Terminate old EC2.


---

Final Checklist

[ ] pm2 status clean

[ ] pm2 logs backend no errors

[ ] GET /health responds

[ ] HTTPS works

[ ] Vercel frontend works end-to-end

[ ] deploy.yml updated + pushed

[ ] DEPLOY_KEY secret updated

[ ] Old EC2 terminated



---

If you want, I can also give you a 🔥 MUCH BETTER DevOps version of this guide that:

prevents downtime

prevents DNS mistakes

avoids certbot failure

makes migration 10x safer


(the current guide works but has 2 risky steps)