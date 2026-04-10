module.exports = {
  apps: [
    {
      name: "backend",
      script: "index.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
  deploy: {
    production: {
      user: "ubuntu",
      host: "43.205.143.123",
      ref: "origin/main",
      repo: "git@github.com:navjotsharma5500/softwareProject.git",
      path: "/home/ubuntu/softwareProject",
      "post-deploy":
        "cd ~/softwareProject && git pull && cd backend && npm install --omit=dev && pm2 restart backend && pm2 save",
      ssh_options:
        "StrictHostKeyChecking=no -i C:/Users/SURYA/.ssh/lost&found.pem",
        //add your path ig
    },
  },
};
