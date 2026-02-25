# Setup Guide - Step by Step

Complete guide to set up the Universal AI Call Bot Backend.

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 18+ installed
- ✅ MongoDB installed and running (or MongoDB Atlas account)
- ✅ Twilio account with a phone number
- ✅ OpenAI API account with credits

## Step 1: Install Dependencies

```bash
# Navigate to project directory
cd callbot-backend

# Install all dependencies
npm install
```

## Step 2: Set Up Environment Variables

1. **Copy the .env file:**
   ```bash
   # The .env file is already created, just edit it
   # Or copy from .env.example if needed
   cp .env.example .env
   ```

2. **Edit `.env` file with your credentials:**

### MongoDB Setup

**Option A: Local MongoDB**
```bash
# If MongoDB is running locally
MONGODB_URI=mongodb://localhost:27017/callbot
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or 0.0.0.0/0 for development)
5. Get connection string:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/callbot?retryWrites=true&w=majority
```

### Twilio Setup

1. **Sign up for Twilio:** https://www.twilio.com/try-twilio
2. **Get Account SID and Auth Token:**
   - Go to https://console.twilio.com/
   - Find "Account SID" and "Auth Token" on dashboard
   - Add to `.env`:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   ```

3. **Get a Phone Number:**
   - In Twilio Console → Phone Numbers → Buy a number
   - Choose a number with voice capabilities
   - Add to `.env`:
   ```bash
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Configure Webhook (for local development):**
   - Install ngrok: https://ngrok.com/download
   - Start your server: `npm start`
   - In another terminal: `ngrok http 3000`
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
   - In Twilio Console → Phone Numbers → Manage → Active Numbers
   - Click your number → Voice & Fax
   - Set webhook URL: `https://abc123.ngrok.io/api/calls/webhook`
   - Set HTTP method: POST
   - Save

   For production:
   ```bash
   TWILIO_WEBHOOK_URL=https://yourdomain.com/api/calls/webhook
   ```

### OpenAI Setup

1. **Sign up for OpenAI:** https://platform.openai.com/
2. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Copy and add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Add Credits:**
   - Go to https://platform.openai.com/account/billing
   - Add payment method and credits
   - GPT-4 requires paid account

### JWT Secret

Generate a strong random secret:
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use online generator
# Add to .env:
JWT_SECRET=your-generated-secret-here-min-32-characters
```

## Step 3: Start MongoDB

**Local MongoDB:**
```bash
# On Windows
mongod

# On Linux/Mac
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data
```

**MongoDB Atlas:**
- No local setup needed, it's cloud-based

## Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
Server running on port 3000
Connected to MongoDB
Environment: development
```

## Step 5: Test the Setup

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
```

### 2. Register a Business
```bash
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

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "business": {...}
}
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### 4. Setup Demo Business (Optional)
```bash
node scripts/setup-example-business.js
```

This creates a demo business with:
- Email: `demo@example.com`
- Password: `demo123`
- Sample services and FAQs

## Step 6: Configure Your Business

### Update Business Profile
```bash
# Use the token from registration/login
TOKEN="your-jwt-token-here"

curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationSettings": {
      "greeting": "Hello! Welcome to My Business. How can I help you?",
      "closing": "Thank you for calling! Have a great day!"
    },
    "aiSettings": {
      "voice": "alloy",
      "language": "en"
    }
  }'
```

### Create a Service
```bash
curl -X POST http://localhost:3000/api/businesses/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Order",
    "description": "Order a pizza",
    "workflowType": "order",
    "fields": [
      {
        "name": "quantity",
        "label": "How many pizzas?",
        "type": "number",
        "required": true,
        "validation": {"min": 1, "max": 10}
      },
      {
        "name": "size",
        "label": "What size?",
        "type": "select",
        "required": true,
        "validation": {
          "options": ["small", "medium", "large"]
        }
      }
    ],
    "pricing": {
      "basePrice": 15.99,
      "currency": "USD"
    }
  }'
```

### Add FAQs
```bash
curl -X POST http://localhost:3000/api/businesses/faqs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are your hours?",
    "answer": "We are open 9 AM to 9 PM daily.",
    "keywords": ["hours", "open", "time"]
  }'
```

## Step 7: Test a Call

### Option A: Use Twilio Test Console
1. Go to Twilio Console → Phone Numbers
2. Click your number
3. Click "Test" tab
4. Make a test call

### Option B: Call from Your Phone
1. Make sure ngrok is running (for local dev)
2. Call your Twilio number
3. The AI should answer and start conversation

### Option C: Make Outgoing Call via API
```bash
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1987654321"
  }'
```

## Step 8: View Call Data

### View All Calls
```bash
curl -X GET http://localhost:3000/api/admin/calls \
  -H "Authorization: Bearer $TOKEN"
```

### View Call Details with Transcript
```bash
curl -X GET http://localhost:3000/api/admin/calls/CALL_SESSION_ID \
  -H "Authorization: Bearer $TOKEN"
```

### View Analytics
```bash
curl -X GET http://localhost:3000/api/admin/analytics \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongosh
# If not, start it
mongod
```

### Twilio Webhook Not Working
**Solution:**
- Make sure ngrok is running (for local dev)
- Check webhook URL in Twilio console
- Verify URL is accessible (test in browser)
- Check server logs for errors

### OpenAI API Error
```
Error: Invalid API key
```
**Solution:**
- Verify API key in `.env`
- Check if you have credits in OpenAI account
- Make sure API key has proper permissions

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
- Change PORT in `.env`
- Or kill process using port 3000:
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 PID
```

### JWT Token Invalid
**Solution:**
- Make sure JWT_SECRET is set
- Token might be expired (default: 7 days)
- Login again to get new token

## Next Steps

1. ✅ Setup complete!
2. Create your business services
3. Add FAQs
4. Configure Twilio webhook
5. Start receiving calls
6. Monitor via admin APIs

## Production Deployment

When ready for production:
1. See `DEPLOYMENT.md` for detailed guide
2. Set `NODE_ENV=production`
3. Use strong `JWT_SECRET`
4. Configure HTTPS
5. Set up monitoring
6. Configure backups

---

**You're all set! Start building your AI call bot! 🚀**

