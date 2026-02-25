# MongoDB Setup Guide

## Current Status

Your server is running, but MongoDB connection is not established. Here's how to fix it:

## Option 1: Install and Run Local MongoDB (Recommended for Development)

### Windows Installation:

1. **Download MongoDB:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download and run installer

2. **Install MongoDB:**
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (GUI tool - optional but helpful)

3. **Verify Installation:**
   ```bash
   # Check if MongoDB service is running
   # Open Services (services.msc) and look for "MongoDB"
   
   # Or test connection
   mongosh
   # Should connect to: mongodb://localhost:27017
   ```

4. **Start MongoDB (if not running as service):**
   ```bash
   # Start MongoDB service
   net start MongoDB
   
   # Or manually
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
   ```

5. **Create Data Directory (if needed):**
   ```bash
   mkdir C:\data\db
   ```

6. **Update .env file:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/callbot
   ```

7. **Restart your server:**
   ```bash
   npm start
   ```

   You should now see:
   ```
   ✅ Connected to MongoDB
   ✅ Server running on port 3000
   ```

## Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

### Setup Steps:

1. **Create Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select cloud provider and region
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `callbotuser` (or your choice)
   - Password: Generate secure password
   - Database User Privileges: "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IPs
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `callbot`

   Example:
   ```
   mongodb+srv://callbotuser:yourpassword@cluster0.xxxxx.mongodb.net/callbot?retryWrites=true&w=majority
   ```

6. **Update .env file:**
   ```bash
   MONGODB_URI=mongodb+srv://callbotuser:yourpassword@cluster0.xxxxx.mongodb.net/callbot?retryWrites=true&w=majority
   ```

7. **Restart your server:**
   ```bash
   npm start
   ```

## Verify MongoDB Connection

### Test Connection:

```bash
# Test if MongoDB is accessible
curl http://localhost:3000/health
```

### Check Server Logs:

After restarting, you should see:
```
✅ Connected to MongoDB
✅ Server running on port 3000
Environment: development
MongoDB URI: mongodb://localhost:27017/callbot
```

### Test Database Operations:

```bash
# Register a test business
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "email": "test@example.com",
    "password": "test123456",
    "phone": "+1234567890",
    "businessType": "restaurant"
  }'
```

If this works, MongoDB is connected! ✅

## Troubleshooting

### Error: "MongoDB connection error"

**Possible causes:**
1. MongoDB not running
2. Wrong connection string
3. Firewall blocking connection
4. MongoDB service not started

**Solutions:**
```bash
# Windows: Check if MongoDB service is running
services.msc
# Look for "MongoDB" service, right-click → Start

# Or start manually
net start MongoDB

# Check MongoDB logs
# Usually in: C:\Program Files\MongoDB\Server\7.0\log\mongod.log
```

### Error: "Authentication failed"

**Solution:**
- Check username and password in connection string
- For MongoDB Atlas: Verify database user credentials
- Make sure IP is whitelisted

### Error: "Connection timeout"

**Solution:**
- Check if MongoDB is running: `tasklist | findstr mongod`
- Verify port 27017 is not blocked by firewall
- For MongoDB Atlas: Check network access settings

## Quick Commands

```bash
# Start MongoDB (Windows Service)
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Check if MongoDB is running
tasklist | findstr mongod

# Connect to MongoDB shell
mongosh
# or
mongo

# List databases
show dbs

# Use callbot database
use callbot

# Show collections
show collections
```

## Next Steps

Once MongoDB is connected:
1. ✅ Server will show "Connected to MongoDB"
2. ✅ You can register businesses
3. ✅ You can create services and FAQs
4. ✅ System is ready for calls!

---

**Need help?** Check the logs for specific error messages!

