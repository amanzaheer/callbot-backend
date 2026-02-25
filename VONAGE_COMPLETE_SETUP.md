# Complete Vonage Setup Guide for Inbound & Outbound Calls

**Comprehensive guide to set up Vonage for both inbound (user calls bot) and outbound (bot calls user) phone calls on real mobile phones.**

## 🎯 Why Vonage?

- ✅ **Free Tier:** $2.00/month credit (perfect for testing)
- ✅ **Free Phone Number:** Available in many countries
- ✅ **Affordable:** Only $2/month, very cheap for production
- ✅ **Reliable:** Used by many businesses worldwide
- ✅ **Easy Integration:** Simple API with good documentation
- ✅ **Both Inbound & Outbound:** Supports both call directions

---

## 📋 Prerequisites

1. **Vonage Account** (free signup)
2. **Phone Number** (can be free in many countries)
3. **Public Webhook URL** (use ngrok for local testing or deploy to server)
4. **Node.js Backend** (this project)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Vonage Account

1. **Sign up for Vonage:**
   - Go to: https://dashboard.nexmo.com/sign-up
   - Create a free account
   - Verify your email address
   - Complete profile setup

2. **Get API Credentials:**
   - Login to: https://dashboard.nexmo.com/
   - Go to **Settings** → **API Keys**
   - You'll see:
     - **API Key** (e.g., `12345678`)
     - **API Secret** (click "Show" to reveal, e.g., `abcdefghijklmnop`)
   - **Save these credentials** - you'll need them!

3. **Add Payment Method (Optional):**
   - Free tier gives $2.00/month credit
   - Go to **Billing** → **Payment Methods**
   - Add credit card (won't be charged unless you exceed free tier)
   - This is required for some features

---

### Step 2: Get a Phone Number

1. **Go to Numbers:**
   - In dashboard: **Numbers** → **Buy Numbers**
   - Or direct link: https://dashboard.nexmo.com/numbers

2. **Search for Number:**
   - Select **Country** (e.g., United States, United Kingdom, Pakistan)
   - Select **Features:** Voice (required)
   - Click **Search**

3. **Buy Number:**
   - Choose a number from the list
   - Click **Buy** (usually free or very cheap, like $0.50/month)
   - **Note the number** (format: `+1234567890`)
   - This is your **business phone number** that users will call

**Important:** Make sure the number supports **Voice** feature!

---

### Step 3: Create Vonage Application

1. **Go to Applications:**
   - Dashboard → **Applications** → **Create new application**
   - Or: https://dashboard.nexmo.com/applications

2. **Create Application:**
   - **Name:** `CallBot Application` (or any name)
   - **Capabilities:** Check **Voice**
   - Click **Create Application**
   - **Save the Application ID** (you'll need it later)

3. **Note:** We'll configure webhooks in the next step after setting up your server.

---

### Step 4: Install Dependencies

Make sure you have the Vonage package installed:

```bash
npm install @vonage/server-sdk
```

---

### Step 5: Setup ngrok (For Local Testing)

**Why ngrok?** Vonage needs to send webhooks to your server. For local development, you need a public URL.

1. **Download ngrok:**
   - Go to: https://ngrok.com/download
   - Download for your OS (Windows/Mac/Linux)
   - Extract the executable

2. **Start your server:**
   ```bash
   npm start
   ```
   Your server should be running on port 3000 (or your configured port)

3. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy HTTPS URL:**
   - You'll see something like: `https://abc123.ngrok.io`
   - **Copy this URL** - this is your public webhook URL
   - **Keep ngrok running** while testing

5. **For Production:**
   - Deploy your server to a hosting service (Heroku, AWS, DigitalOcean, etc.)
   - Use your production domain instead of ngrok

---

### Step 6: Configure Environment Variables

Add these to your `.env` file:

```bash
# Vonage Configuration
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_WEBHOOK_URL=https://your-ngrok-url.ngrok.io
```

**Example:**
```bash
VONAGE_API_KEY=12345678
VONAGE_API_SECRET=abcdefghijklmnop
VONAGE_WEBHOOK_URL=https://abc123.ngrok.io
```

**Important:** 
- Use **HTTPS** URL (not HTTP)
- No trailing slash
- Update this when ngrok URL changes (ngrok free tier gives new URL each restart)

---

### Step 7: Configure Webhooks in Vonage Application

1. **Go back to Applications:**
   - Dashboard → **Applications** → Click on your application

2. **Edit Webhooks:**
   - **Answer URL:** `https://your-ngrok-url.ngrok.io/api/calls/answer`
   - **Event URL:** `https://your-ngrok-url.ngrok.io/api/calls/event`
   - **Inbound URL:** `https://your-ngrok-url.ngrok.io/api/calls/inbound` (for inbound calls)
   - Click **Save**

3. **Link Number to Application:**
   - Go to **Numbers** → **Your Numbers**
   - Click on your phone number
   - Under **Voice Application**, select your application
   - Click **Update**

**This links your phone number to your application, so calls to that number will trigger your webhooks!**

---

### Step 8: Update Business Profile with Vonage Credentials

**Option A: Use API (Recommended)**

1. **Login first:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. **Copy the token** from response

3. **Update profile with Vonage credentials:**
```bash
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceProvider": "vonage",
    "vonageApiKey": "12345678",
    "vonageApiSecret": "your_api_secret",
    "vonagePhoneNumber": "+1234567890"
  }'
```

**Option B: Use Setup Script**

```bash
node scripts/setup-vonage-credentials.js your-email@example.com
```

**Option C: Use Postman**

1. Import the Postman collection from `postman/` folder
2. Login first to get token
3. Use **Update Profile** endpoint with Vonage credentials

---

## 📞 Testing Calls

### Test Outbound Call (Bot Calls User)

**Via API:**
```bash
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+923219296932",
    "serviceId": "optional-service-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "provider": "vonage",
  "callUuid": "abc123-def456-ghi789",
  "status": "ringing"
}
```

**What happens:**
1. Bot calls the user's phone number
2. User answers
3. Bot greets user
4. Conversation starts

---

### Test Inbound Call (User Calls Bot)

**Simply call your Vonage phone number from your mobile phone!**

1. **Dial your Vonage number** (e.g., `+1234567890`)
2. **Bot will answer** automatically
3. **Bot will greet you** with the configured greeting
4. **Start talking** - bot will respond

**What happens:**
1. User calls business number
2. Vonage receives call
3. Vonage sends webhook to `/api/calls/inbound`
4. Bot answers and greets user
5. Conversation starts

---

## 🔧 Webhook Endpoints

Your server needs these endpoints for Vonage:

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/api/calls/answer` | Called when call is answered (both inbound/outbound) | POST |
| `/api/calls/inbound` | Called specifically for inbound calls | POST |
| `/api/calls/vonage-speech/:callSessionId` | Receives speech input from user | POST |
| `/api/calls/event` | Receives call status updates | POST |

**All endpoints are automatically configured in the code!**

---

## 📱 Phone Number Format

**Important:** Always use E.164 format:

- ✅ **Correct:** `+923219296932` (Pakistan)
- ✅ **Correct:** `+1234567890` (US)
- ✅ **Correct:** `+441234567890` (UK)
- ❌ **Wrong:** `923219296932` (missing +)
- ❌ **Wrong:** `00923219296932`
- ❌ **Wrong:** `(923) 219-2969`

**Format:** `+[country code][number]` (no spaces, no dashes)

---

## 🎯 How It Works

### Outbound Call Flow (Bot → User)

1. **You make API call** to `/api/calls/outgoing`
2. **Server creates Vonage call** using `vonageClient.voice.createOutboundCall()`
3. **Vonage calls user's phone**
4. **User answers**
5. **Vonage sends webhook** to `/api/calls/answer`
6. **Server generates NCCO** (greeting + speech input)
7. **User speaks**
8. **Vonage sends speech** to `/api/calls/vonage-speech/:callSessionId`
9. **Bot processes and responds**
10. **Conversation continues**

### Inbound Call Flow (User → Bot)

1. **User calls your Vonage number** from mobile
2. **Vonage receives call**
3. **Vonage sends webhook** to `/api/calls/inbound` (or `/api/calls/answer`)
4. **Server finds business** by phone number
5. **Server creates call session**
6. **Server generates NCCO** (greeting + speech input)
7. **User speaks**
8. **Vonage sends speech** to `/api/calls/vonage-speech/:callSessionId`
9. **Bot processes and responds**
10. **Conversation continues**

---

## 🔍 Troubleshooting

### Error: "Vonage credentials not configured"

**Solution:**
- Make sure you updated business profile with `vonageApiKey`, `vonageApiSecret`, and `vonagePhoneNumber`
- Verify `voiceProvider` is set to `"vonage"`
- Check credentials in database

### Error: "Invalid credentials"

**Solution:**
- Double-check API Key and API Secret from Vonage dashboard
- Make sure no extra spaces in .env file
- Restart server after updating .env

### Error: "Number not found"

**Solution:**
- Verify phone number format: `+[country][number]`
- Make sure number is linked to your application in Vonage dashboard
- Check number supports Voice feature

### Call connects but no audio

**Solution:**
- Check webhook URLs are correct in Vonage dashboard
- Verify application is linked to number
- Check server logs for errors
- Make sure ngrok is running (for local testing)

### Webhook not receiving events

**Solution:**
- Make sure ngrok is running
- Verify webhook URLs in Vonage dashboard (must be HTTPS)
- Check ngrok shows requests in dashboard (http://localhost:4040)
- Verify server is running and accessible

### Inbound calls not working

**Solution:**
- Verify number is linked to application in Vonage dashboard
- Check webhook URLs are configured correctly
- Make sure `/api/calls/inbound` endpoint exists
- Check server logs when call comes in

### Outbound calls not working

**Solution:**
- Verify Vonage credentials in business profile
- Check phone number format (E.164)
- Verify you have credit in Vonage account
- Check Vonage dashboard for call logs and errors

---

## 📊 Monitoring Calls

### Vonage Dashboard

1. **Go to:** https://dashboard.nexmo.com/voice/logs
2. **View all calls** (inbound and outbound)
3. **See call status, duration, cost**
4. **Check for errors**

### Your Server Logs

Check your server console for:
- Call session creation
- Webhook received
- Speech processing
- Errors

### API Endpoints

Use admin API to view calls:
```bash
GET /api/admin/calls
GET /api/admin/calls/:callSessionId
```

---

## 💰 Pricing

**Vonage Pricing (as of 2024):**

- **Free Tier:** $2.00/month credit
- **Phone Number:** Free or $0.50-$2/month (varies by country)
- **Outbound Calls:** ~$0.01-$0.05 per minute (varies by country)
- **Inbound Calls:** Usually free or very cheap

**Example:**
- Free tier: $2 credit
- Outbound call to US: ~$0.01/minute
- You can make ~200 minutes of calls per month for free!

---

## ✅ Verification Checklist

Before making calls, verify:

- [ ] Vonage account created and verified
- [ ] API Key and Secret obtained
- [ ] Phone number purchased and supports Voice
- [ ] Vonage package installed (`npm install @vonage/server-sdk`)
- [ ] Credentials in `.env` file
- [ ] Business profile updated with Vonage credentials
- [ ] `voiceProvider` set to `"vonage"`
- [ ] Application created in Vonage dashboard
- [ ] Webhook URLs configured in application
- [ ] Number linked to application
- [ ] ngrok running (for local testing) or server deployed
- [ ] Server restarted after .env changes
- [ ] Phone number format correct (E.164)

---

## 🚀 Quick Start Commands

```bash
# 1. Install package
npm install @vonage/server-sdk

# 2. Update .env with credentials
# VONAGE_API_KEY=...
# VONAGE_API_SECRET=...
# VONAGE_WEBHOOK_URL=https://...

# 3. Start server
npm start

# 4. Start ngrok (in new terminal)
ngrok http 3000

# 5. Update webhook URLs in Vonage dashboard with ngrok URL

# 6. Update business profile with Vonage credentials
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceProvider": "vonage",
    "vonageApiKey": "YOUR_API_KEY",
    "vonageApiSecret": "YOUR_API_SECRET",
    "vonagePhoneNumber": "+YOUR_NUMBER"
  }'

# 7. Test outbound call
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "+USER_PHONE_NUMBER"}'

# 8. Test inbound call - just call your Vonage number!
```

---

## 📝 Example: Complete Setup

```bash
# 1. Get credentials from Vonage dashboard
VONAGE_API_KEY=12345678
VONAGE_API_SECRET=abcdefghijklmnop
VONAGE_PHONE_NUMBER=+1234567890

# 2. Add to .env
echo "VONAGE_API_KEY=12345678" >> .env
echo "VONAGE_API_SECRET=abcdefghijklmnop" >> .env
echo "VONAGE_WEBHOOK_URL=https://abc123.ngrok.io" >> .env

# 3. Start server
npm start

# 4. Start ngrok (new terminal)
ngrok http 3000
# Copy HTTPS URL: https://abc123.ngrok.io

# 5. Update webhooks in Vonage dashboard:
# Answer URL: https://abc123.ngrok.io/api/calls/answer
# Event URL: https://abc123.ngrok.io/api/calls/event
# Inbound URL: https://abc123.ngrok.io/api/calls/inbound

# 6. Link number to application in Vonage dashboard

# 7. Update business profile
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceProvider": "vonage",
    "vonageApiKey": "12345678",
    "vonageApiSecret": "abcdefghijklmnop",
    "vonagePhoneNumber": "+1234567890"
  }'

# 8. Test outbound call
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "+923219296932"}'

# 9. Test inbound call - call +1234567890 from your phone!
```

---

## 🎉 Success!

Once set up, you can:

✅ **Make outbound calls** - Bot calls users  
✅ **Receive inbound calls** - Users call bot  
✅ **Both work on real mobile phones**  
✅ **Very cheap** - Only $2/month!  

**Next Steps:**
- Test with your phone number
- Monitor calls in Vonage dashboard
- Check call logs in admin API
- View analytics
- Train bot with bulk data (see Training Data section)

---

## 📚 Additional Resources

- **Vonage API Docs:** https://developer.vonage.com/
- **Vonage Dashboard:** https://dashboard.nexmo.com/
- **NCCO Reference:** https://developer.vonage.com/voice/voice-api/ncco-reference
- **Webhook Guide:** https://developer.vonage.com/voice/voice-api/webhook-reference

---

## 🆘 Need Help?

1. Check Vonage dashboard for call logs and errors
2. Check server logs for webhook errors
3. Verify all webhook URLs are correct
4. Make sure ngrok is running (for local testing)
5. Verify phone number format (E.164)
6. Check Vonage account has credit

---

**Happy Calling! 🎉**

