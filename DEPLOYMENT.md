# Deployment Guide

## Production Deployment Checklist

### 1. Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/calls/webhook
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. MongoDB Setup

**Production MongoDB Configuration:**
- Use MongoDB Atlas or self-hosted replica set
- Enable authentication
- Configure IP whitelist
- Set up automated backups
- Enable monitoring

**Connection String Format:**
```
mongodb://username:password@host:port/database?authSource=admin
```

### 3. Twilio Configuration

1. **Get Twilio Phone Number:**
   - Purchase a phone number in Twilio Console
   - Note the phone number (format: +1234567890)

2. **Configure Webhooks:**
   - Go to Phone Numbers → Manage → Active Numbers
   - Click on your number
   - Set Voice & Fax webhook URL: `https://yourdomain.com/api/calls/webhook`
   - Set HTTP method: POST
   - Save

3. **Enable Call Recording:**
   - In webhook configuration, enable "Record calls"
   - Set recording status callback: `https://yourdomain.com/api/calls/recording-status`

### 4. Server Deployment

#### Option A: Traditional VPS (Ubuntu/Debian)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup
git clone <your-repo>
cd callbot-backend
npm install --production

# Create .env file
nano .env
# Add all environment variables

# Start with PM2
pm2 start server.js --name callbot-backend
pm2 save
pm2 startup
```

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t callbot-backend .
docker run -d \
  --name callbot \
  -p 3000:3000 \
  --env-file .env \
  callbot-backend
```

#### Option C: Cloud Platforms

**Heroku:**
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=...
# Add all other env vars
git push heroku main
```

**AWS Elastic Beanstalk:**
- Upload application
- Configure environment variables in console
- Set up load balancer for HTTPS

**Google Cloud Run:**
```bash
gcloud run deploy callbot-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 5. Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/callbot
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
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

### 6. SSL Certificate

**Using Let's Encrypt (Certbot):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 7. Monitoring & Logging

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs
```

**Winston Logs:**
- Logs stored in `error.log` and `combined.log`
- Set up log rotation
- Consider cloud logging (Datadog, Loggly, etc.)

**Health Check:**
```bash
curl https://yourdomain.com/health
```

### 8. Database Backups

**MongoDB Backup Script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/callbot_$DATE
# Upload to S3 or other storage
```

**Schedule with Cron:**
```bash
0 2 * * * /path/to/backup.sh
```

### 9. Security Hardening

1. **Firewall:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Rate Limiting:**
   - Already configured in code
   - Adjust in `.env` if needed

3. **API Keys:**
   - Never commit `.env` to git
   - Rotate keys regularly
   - Use secrets management (AWS Secrets Manager, etc.)

4. **CORS:**
   - Set specific origins in production
   - Don't use `*` in production

### 10. Scaling

**Horizontal Scaling:**
- Use load balancer (Nginx, AWS ALB)
- Multiple Node.js instances
- Shared MongoDB instance
- Redis for session storage (if needed)

**Vertical Scaling:**
- Increase server resources
- Optimize MongoDB indexes
- Enable MongoDB sharding for large datasets

### 11. Testing Production Setup

1. **Test Webhook:**
```bash
# Use Twilio's test webhook tool or ngrok for local testing
ngrok http 3000
# Update Twilio webhook to ngrok URL temporarily
```

2. **Test Call Flow:**
   - Make test call to Twilio number
   - Verify call session creation
   - Check conversation flow
   - Verify recording storage

3. **Test APIs:**
```bash
# Register business
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","phone":"+1234567890"}'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 12. Maintenance

**Regular Tasks:**
- Monitor error logs
- Check MongoDB performance
- Review call analytics
- Update dependencies
- Backup database
- Review security

**Updates:**
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart callbot-backend
# or
docker-compose restart
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving calls:**
   - Check Twilio webhook URL is correct
   - Verify HTTPS certificate is valid
   - Check server logs for errors

2. **MongoDB connection issues:**
   - Verify connection string
   - Check IP whitelist
   - Verify credentials

3. **AI responses not working:**
   - Check OpenAI API key
   - Verify API quota
   - Check error logs

4. **Call recordings not saving:**
   - Verify Twilio recording enabled
   - Check recording status callback URL
   - Verify storage permissions

## Support

For issues or questions:
1. Check logs: `pm2 logs` or `docker logs`
2. Review error messages
3. Check Twilio/OpenAI dashboards
4. Review MongoDB logs

---

**Production Ready!** 🚀

