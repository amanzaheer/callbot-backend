# Quick Twilio Setup - Make Calls Successfully

## 🎯 The Problem

Your call is failing because **Twilio credentials need to be saved in your Business profile**, not just in `.env` file.

## ✅ Quick Fix (3 Steps)

### Step 1: Get Twilio Credentials

1. Go to: https://console.twilio.com/
2. Copy:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click "View" to reveal)
   - **Phone Number** (from Phone Numbers section)

### Step 2: Update .env File

Add these to your `.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/calls/webhook
```

### Step 3: Update Business Profile

**Option A: Use Setup Script (Easiest)**

```bash
# Make sure MongoDB is running and server is stopped
node scripts/setup-twilio-credentials.js your-email@example.com
```

**Option B: Use API (Postman/cURL)**

1. **Login first:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. **Copy the token from response, then update profile:**
```bash
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "twilioAuthToken": "your_auth_token_here",
    "twilioPhoneNumber": "+1234567890"
  }'
```

**Option C: Use Postman**

1. Open **Business Management → Update Profile**
2. Add to body:
```json
{
  "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "twilioAuthToken": "your_auth_token_here",
  "twilioPhoneNumber": "+1234567890"
}
```
3. Click Send

## 📱 Setup ngrok (For Local Testing)

Since your server is local, Twilio needs a public URL:

1. **Download ngrok:** https://ngrok.com/download
2. **Start your server:**
   ```bash
   npm start
   ```
3. **Start ngrok in new terminal:**
   ```bash
   ngrok http 3000
   ```
4. **Copy HTTPS URL** (e.g., `https://abc123.ngrok.io`)
5. **Update .env:**
   ```bash
   TWILIO_WEBHOOK_URL=https://abc123.ngrok.io/api/calls/webhook
   ```
6. **Restart server**

## 🧪 Test the Call

### Your Phone Number Format

For Pakistan number `923219296932`, use:
```json
{
  "to": "+923219296932"
}
```

**Important:** Must include `+` and country code!

### Make Call via Postman

1. **Calls → Make Outgoing Call**
2. Body:
```json
{
  "to": "+923219296932",
  "serviceId": "6993765a831527aade72caf9"
}
```
3. Click **Send**

### Expected Response

**Success:**
```json
{
  "success": true,
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

**If still failing**, check server logs for specific error!

## 🔍 Verify Setup

Check if credentials are saved:

```bash
# Get profile
curl -X GET http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should show:
```json
{
  "success": true,
  "business": {
    "twilioAccountSid": "AC...",
    "twilioPhoneNumber": "+1234567890",
    ...
  }
}
```

## ⚠️ Common Issues

### "Twilio credentials not configured"
- Business profile doesn't have credentials
- Run setup script or update profile via API

### "Invalid credentials"
- Check Account SID starts with `AC`
- Verify Auth Token is correct (no spaces)
- Restart server after updating .env

### "The number is not valid"
- Must be E.164 format: `+[country][number]`
- Pakistan: `+92` + 10 digits = `+923219296932`
- Remove spaces, dashes, parentheses

### "Webhook URL not accessible"
- Make sure ngrok is running
- Update TWILIO_WEBHOOK_URL in .env
- Restart server

## 📋 Complete Checklist

Before making a call:

- [ ] Twilio account created
- [ ] Phone number purchased
- [ ] Credentials in `.env` file
- [ ] Business profile updated with credentials (via script or API)
- [ ] ngrok running (for local testing)
- [ ] TWILIO_WEBHOOK_URL in .env
- [ ] Server restarted
- [ ] Phone number format correct (`+923219296932`)
- [ ] Valid JWT token

## 🚀 Quick Command Summary

```bash
# 1. Setup credentials (one-time)
node scripts/setup-twilio-credentials.js your-email@example.com

# 2. Start server
npm start

# 3. Start ngrok (in new terminal)
ngrok http 3000

# 4. Update .env with ngrok URL, restart server

# 5. Make call via Postman or API
```

---

**That's it!** Your call should work now! 🎉

