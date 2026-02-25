# Complete Twilio Setup Guide for Making Calls

Step-by-step guide to set up Twilio and make successful test calls.

## 🔍 Current Issue

Your call is failing with "Failed to make call". This usually means:
1. Twilio credentials are missing or incorrect
2. Business doesn't have Twilio credentials saved
3. Webhook URL is not configured

## 📋 Step-by-Step Setup

### Step 1: Get Twilio Account Credentials

1. **Sign up for Twilio** (if you don't have account):
   - Go to: https://www.twilio.com/try-twilio
   - Create free account (includes $15.50 credit)

2. **Get Account SID and Auth Token:**
   - Login to: https://console.twilio.com/
   - On dashboard, you'll see:
     - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - **Auth Token**: Click "View" to reveal (starts with letters/numbers)

3. **Get a Phone Number:**
   - Go to: Phone Numbers → Manage → Buy a number
   - Choose a number with **Voice** capability
   - Click "Buy" (free for trial accounts)
   - Note the number (format: +1234567890)

### Step 2: Update .env File

Add these to your `.env` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Webhook URL - IMPORTANT!
# For local testing with ngrok:
TWILIO_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/calls/webhook

# For production:
# TWILIO_WEBHOOK_URL=https://yourdomain.com/api/calls/webhook
```

**Example:**
```bash
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr678
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WEBHOOK_URL=https://abc123.ngrok.io/api/calls/webhook
```

### Step 3: Set Up ngrok (For Local Testing)

Since your server is running locally, you need ngrok to expose it to Twilio:

1. **Download ngrok:**
   - Go to: https://ngrok.com/download
   - Download for Windows
   - Extract to a folder (e.g., `C:\ngrok\`)

2. **Start your server:**
   ```bash
   npm start
   ```

3. **Start ngrok in a new terminal:**
   ```bash
   # Navigate to ngrok folder
   cd C:\ngrok
   
   # Start ngrok tunnel
   ngrok http 3000
   ```

4. **Copy the HTTPS URL:**
   - You'll see something like: `https://abc123.ngrok.io`
   - Copy this URL

5. **Update .env:**
   ```bash
   TWILIO_WEBHOOK_URL=https://abc123.ngrok.io/api/calls/webhook
   ```

6. **Restart your server** after updating .env

### Step 4: Configure Business Profile with Twilio Credentials

**IMPORTANT:** Your business profile needs to have Twilio credentials saved. You can either:

#### Option A: Update Business Profile via API

```bash
# First, login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Use the token from response, then update profile:
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "twilioPhoneNumber": "+1234567890",
    "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "twilioAuthToken": "your_auth_token_here"
  }'
```

#### Option B: Update via Postman

1. Open **Business Management → Update Profile**
2. Add to request body:
```json
{
  "twilioPhoneNumber": "+1234567890",
  "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "twilioAuthToken": "your_auth_token_here"
}
```

### Step 5: Configure Twilio Webhook

1. **Go to Twilio Console:**
   - Phone Numbers → Manage → Active Numbers
   - Click on your phone number

2. **Configure Voice & Fax:**
   - **A CALL COMES IN**: 
     - Webhook: `https://your-ngrok-url.ngrok.io/api/calls/webhook`
     - HTTP: `POST`
   - **CALL STATUS CHANGES**:
     - Status Callback URL: `https://your-ngrok-url.ngrok.io/api/calls/status`
     - HTTP: `POST`
   - **RECORDING STATUS**:
     - Recording Status Callback: `https://your-ngrok-url.ngrok.io/api/calls/recording-status`
     - HTTP: `POST`

3. **Save Configuration**

### Step 6: Verify Phone Number Format

Your phone number must be in **E.164 format**:
- ✅ Correct: `+923219296932` (Pakistan)
- ✅ Correct: `+1234567890` (US)
- ❌ Wrong: `923219296932` (missing +)
- ❌ Wrong: `00923219296932`

### Step 7: Test the Call

#### Via Postman:

1. **Make sure you're logged in** (token is set)
2. Open **Calls → Make Outgoing Call**
3. Update request body:
```json
{
  "to": "+923219296932",
  "serviceId": "your-service-id-optional"
}
```
4. Click **Send**

#### Via cURL:

```bash
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+923219296932",
    "serviceId": "6993765a831527aade72caf9"
  }'
```

## 🔧 Troubleshooting

### Error: "Failed to make call"

**Check these:**

1. **Business has Twilio credentials?**
   ```bash
   # Get profile and check
   curl -X GET http://localhost:3000/api/businesses/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Should show `twilioAccountSid` and `twilioPhoneNumber`

2. **Twilio credentials are correct?**
   - Verify Account SID starts with `AC`
   - Verify Auth Token is correct (no spaces)
   - Test in Twilio Console → Test Credentials

3. **Phone number format?**
   - Must start with `+`
   - Must include country code
   - Example: `+923219296932` (Pakistan)

4. **Check server logs:**
   ```bash
   # Look for error messages
   # Should show specific Twilio error
   ```

### Error: "Invalid credentials"

- Double-check Account SID and Auth Token
- Make sure no extra spaces in .env file
- Restart server after updating .env

### Error: "The number +923219296932 is not a valid phone number"

- Verify number format: `+[country code][number]`
- For Pakistan: `+92` + 10 digits
- Remove any spaces, dashes, or parentheses

### Error: "Webhook URL not accessible"

- Make sure ngrok is running
- Verify ngrok URL is correct
- Check ngrok shows requests in dashboard
- Update webhook URL in Twilio console

### Call connects but no audio

- Check webhook is configured correctly
- Verify `/api/calls/webhook` endpoint is accessible
- Check server logs for errors

## 📱 Testing with Your Phone Numbers

### For Phone Calls:

```json
{
  "to": "+923219296932"
}
```

### For WhatsApp (if configured):

Twilio supports WhatsApp, but requires:
1. WhatsApp Business Account approval
2. Different setup process
3. Different API endpoints

For now, focus on regular phone calls first.

## ✅ Success Checklist

Before making a call, verify:

- [ ] Twilio account created
- [ ] Account SID and Auth Token in .env
- [ ] Phone number purchased in Twilio
- [ ] Business profile updated with Twilio credentials
- [ ] ngrok running and URL copied
- [ ] TWILIO_WEBHOOK_URL in .env matches ngrok URL
- [ ] Server restarted after .env changes
- [ ] Twilio webhook configured in console
- [ ] Phone number format is correct (+country code)
- [ ] You have a valid JWT token

## 🎯 Quick Test Script

```bash
# 1. Check server health
curl http://localhost:3000/health

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}' \
  | jq -r '.token')

# 3. Update business with Twilio credentials
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "twilioPhoneNumber": "+1234567890",
    "twilioAccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "twilioAuthToken": "your_auth_token"
  }'

# 4. Make test call
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+923219296932"
  }'
```

## 📞 Expected Response

**Success:**
```json
{
  "success": true,
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

**Failure (check error message):**
```json
{
  "success": false,
  "message": "Failed to make call"
}
```

Check server logs for detailed error!

---

**Need help?** Check server logs for specific Twilio error messages!

