# Kitayar Dashboard - Production Server Guide

این فایل مستندات کامل Deploy و اجرای پروژه Kitayar Dashboard روی Production Server است.

---

# 1. اطلاعات سرور

Production server:

/root

Project directory:

/root/apps/kitayar-dashboard

Deployment directory:

/root/kitayar-deploy

Database backups:

/root/kitayar-deploy/backups

Frontend production directory:

/var/www/kitayar-dashboard

---

# 2. GitHub Repository

Repository:

https://github.com/mohammadtaheri30132/kitayar-dashboard

Production branch:

master

Production server باید همیشه آخرین commit از:

origin/master

را اجرا کند.

GitHub source of truth است.

هیچ تغییر دستی روی سورس Production نباید انجام شود.

تغییرات باید ابتدا در Local انجام شوند و سپس:

git add .
git commit
git push origin master

---

# 3. Project Structure

Project:

/root/apps/kitayar-dashboard

Frontend:

/root/apps/kitayar-dashboard

Backend:

/root/apps/kitayar-dashboard/backend

Frontend build:

/root/apps/kitayar-dashboard/dist

Backend build:

/root/apps/kitayar-dashboard/backend/dist

---

# 4. Frontend

Technology:

React + Vite + TypeScript

Frontend build command:

cd /root/apps/kitayar-dashboard
yarn install
yarn build

Build output:

/root/apps/kitayar-dashboard/dist

Nginx serves the production frontend from:

/var/www/kitayar-dashboard

After build:

rm -rf /var/www/kitayar-dashboard/*
cp -a /root/apps/kitayar-dashboard/dist/. /var/www/kitayar-dashboard/

Public URL:

https://www.vasehkhoneh.ir/kitayar-dashboard/

---

# 5. Backend

Backend directory:

/root/apps/kitayar-dashboard/backend

Backend technology:

Node.js + TypeScript

Install dependencies:

cd /root/apps/kitayar-dashboard/backend
yarn install

Build:

yarn build

Build output:

/root/apps/kitayar-dashboard/backend/dist

Start command:

node dist/app.js

Production process is managed by PM2.

PM2 application name:

kitayar-api

Restart:

pm2 restart kitayar-api

Check:

pm2 status

Logs:

pm2 logs kitayar-api

---

# 6. Database

Database:

MongoDB

Database name:

question-cms

MongoDB address:

mongodb://localhost:27017/question-cms

MongoDB is running locally on the production server.

MongoDB backup tool:

mongodump

Check:

mongodump --version

---

# 7. Database Backup

Before every deployment, a MongoDB backup MUST be created.

Backup directory:

/root/kitayar-deploy/backups

Each deployment creates a timestamped directory.

Example:

/root/kitayar-deploy/backups/2026-08-13_18-49-59/

Backup file:

mongodb.archive.gz

Example:

/root/kitayar-deploy/backups/2026-08-13_18-49-59/mongodb.archive.gz

Manual backup command:

mongodump \
  --uri="mongodb://localhost:27017/question-cms" \
  --archive="/root/kitayar-deploy/backups/manual-question-cms.archive.gz" \
  --gzip

---

# 8. Restore MongoDB Backup

IMPORTANT:

Restoring a backup can overwrite current database data.

Before restoring, create another backup of the current database.

Example restore:

mongorestore \
  --uri="mongodb://localhost:27017/question-cms" \
  --archive="/root/kitayar-deploy/backups/2026-08-13_18-49-59/mongodb.archive.gz" \
  --gzip

For a complete replacement restore, use:

mongorestore \
  --uri="mongodb://localhost:27017/question-cms" \
  --archive="/root/kitayar-deploy/backups/2026-08-13_18-49-59/mongodb.archive.gz" \
  --gzip \
  --drop

Use --drop carefully because it replaces existing collections.

---

# 9. Nginx

Nginx configuration:

/etc/nginx/sites-enabled/vasehkhoneh

Main configuration:

/etc/nginx/nginx.conf

Current production routing:

Frontend:

https://www.vasehkhoneh.ir/kitayar-dashboard/

Backend:

https://www.vasehkhoneh.ir/kitayar-api/

Main application:

https://www.vasehkhoneh.ir/

---

# 10. Nginx Configuration

Current server configuration:

server {
    listen 443 ssl http2;
    server_name vasehkhoneh.ir www.vasehkhoneh.ir;

    location /kitayar-dashboard/ {
        alias /var/www/kitayar-dashboard/;
        try_files $uri $uri/ /kitayar-dashboard/index.html;
    }

    location /kitayar-api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

Test Nginx:

nginx -t

Reload:

systemctl reload nginx

Check:

systemctl status nginx

---

# 11. PM2

Current PM2 applications:

kitayar-api
vasehkhoneh

Check:

pm2 status

Backend:

pm2 restart kitayar-api

Existing application:

pm2 restart vasehkhoneh

Logs:

pm2 logs kitayar-api

pm2 logs vasehkhoneh

Save PM2 configuration:

pm2 save

---

# 12. Complete Manual Deployment

If the deployment script is unavailable, follow these steps.

## Step 1 - Go to project

cd /root/apps/kitayar-dashboard

---

## Step 2 - Create database backup

mkdir -p /root/kitayar-deploy/backups

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p "/root/kitayar-deploy/backups/$TIMESTAMP"

mongodump \
  --uri="mongodb://localhost:27017/question-cms" \
  --archive="/root/kitayar-deploy/backups/$TIMESTAMP/mongodb.archive.gz" \
  --gzip

If backup fails:

STOP DEPLOYMENT.

Do not continue.

---

## Step 3 - Get latest GitHub version

cd /root/apps/kitayar-dashboard

git fetch origin

git reset --hard origin/master

IMPORTANT:

This makes the Production source exactly match GitHub master.

---

## Step 4 - Install Backend dependencies

cd /root/apps/kitayar-dashboard/backend

yarn install

---

## Step 5 - Build Backend

yarn build

If build fails:

STOP DEPLOYMENT.

Do not restart PM2.

---

## Step 6 - Install Frontend dependencies

cd /root/apps/kitayar-dashboard

yarn install

---

## Step 7 - Build Frontend

yarn build

If build fails:

STOP DEPLOYMENT.

Do not replace the current production frontend.

---

## Step 8 - Deploy Frontend

rm -rf /var/www/kitayar-dashboard/*

cp -a /root/apps/kitayar-dashboard/dist/. /var/www/kitayar-dashboard/

---

## Step 9 - Restart Backend

pm2 restart kitayar-api

---

## Step 10 - Check Backend

pm2 status

Expected:

kitayar-api online

---

## Step 11 - Check Nginx

nginx -t

If successful:

systemctl reload nginx

---

## Step 12 - Final check

Open:

https://www.vasehkhoneh.ir/

Dashboard:

https://www.vasehkhoneh.ir/kitayar-dashboard/

API:

https://www.vasehkhoneh.ir/kitayar-api/

---

# 13. Automated Deployment

Main deployment script:

/root/kitayar-deploy/deploy.sh

Run:

cd /root/kitayar-deploy

./deploy.sh

The script should perform:

1. Check project
2. Backup MongoDB
3. Fetch GitHub
4. Update project to origin/master
5. Install Backend dependencies
6. Build Backend
7. Install Frontend dependencies
8. Build Frontend
9. Deploy Frontend
10. Restart PM2 backend
11. Test PM2
12. Test Nginx
13. Show final result

---

# 14. Important Deployment Rule

Never deploy new code before database backup.

Correct order:

Backup
↓
GitHub update
↓
Backend install
↓
Backend build
↓
Frontend install
↓
Frontend build
↓
Frontend deployment
↓
Backend restart
↓
Nginx check
↓
Success

If Backup fails:

STOP.

If Backend build fails:

STOP.

If Frontend build fails:

STOP.

Never restart the backend after a failed build.

---

# 15. Git Production Rule

Production source is controlled by GitHub.

Correct workflow:

LOCAL COMPUTER

Edit code
↓
Test
↓
yarn build
↓
git add .
↓
git commit
↓
git push origin master
↓
PRODUCTION SERVER
↓
./deploy.sh

Do not modify source files directly on Production.

---

# 16. Yarn

The local and production environments should use the same Yarn version.

Before deployment check:

yarn --version

If the project specifies a packageManager field in package.json, use that version.

Do not randomly upgrade Yarn on Production.

If Yarn changes version unexpectedly, STOP deployment and fix the project configuration first.

---

# 17. Useful Commands

Check project:

cd /root/apps/kitayar-dashboard
git status
git log -1 --oneline

Check latest GitHub commit:

git fetch origin
git log origin/master -1 --oneline

Check PM2:

pm2 status

Backend logs:

pm2 logs kitayar-api --lines 100

Nginx test:

nginx -t

Nginx status:

systemctl status nginx

Nginx logs:

tail -100 /var/log/nginx/error.log

Check frontend:

ls -lah /var/www/kitayar-dashboard

Check MongoDB:

systemctl status mongod

Check MongoDB databases:

mongosh

---

# 18. Current URLs

Website:

https://www.vasehkhoneh.ir/

Dashboard:

https://www.vasehkhoneh.ir/kitayar-dashboard/

Backend API:

https://www.vasehkhoneh.ir/kitayar-api/

---

# 19. Production Architecture

Internet
   |
   v
Nginx :443
   |
   +--> /kitayar-dashboard/
   |       |
   |       v
   |   /var/www/kitayar-dashboard/
   |
   +--> /kitayar-api/
   |       |
   |       v
   |   PM2: kitayar-api
   |   127.0.0.1:5001
   |
   +--> /
           |
           v
       PM2: vasehkhoneh
       127.0.0.1:3000


MongoDB:

127.0.0.1:27017
        |
        v
   question-cms


Project:

GitHub
   |
   v
/root/apps/kitayar-dashboard
   |
   +--> Frontend
   |
   +--> Backend


Backups:

MongoDB
   |
   v
/root/kitayar-deploy/backups/