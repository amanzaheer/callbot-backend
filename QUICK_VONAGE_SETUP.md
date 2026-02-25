# Quick Vonage Setup - 5 Minutes!

Fast setup guide to get Vonage working for real phone calls.

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Vonage Account

1. Go to: https://dashboard.nexmo.com/sign-up
2. Sign up (free)
3. Verify email

### Step 2: Get Credentials

1. Login: https://dashboard.nexmo.com/
2. Go to **Settings** → **API Keys**
3. Copy:
   - **API Key** (e.g., `12345678`)
   - **API Secret** (click "Show")

### Step 3: Get Phone Number

1. Go to **Numbers** → **Buy Numbers**
2. Select country → Search → Buy (usually free)
3. Note the number (e.g., `+1234567890`)

### Step 4: Update .env

```bash
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_PHONE_NUMBER=+1234567890
VONAGE_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/calls/webhook
```

### Step 5: Update Business Profile

**Easiest - Use Script:**
```bash
node scripts/setup-vonage-credentials.js your-email@example.com
```

**Or via API:**
```bash
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceProvider": "vonage",
    "vonageApiKey": "12345678",
    "vonageApiSecret": "your_secret",
    "vonagePhoneNumber": "+1234567890"
  }'
```

## ✅ Test Call

```bash
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "+923219296932"}'
```

**Success Response:**
```json
{
  "success": true,
  "provider": "vonage",
  "callUuid": "abc123-def456",
  "status": "ringing"
}
```

## 📋 Checklist

- [ ] Vonage account created
- [ ] API Key and Secret obtained
- [ ] Phone number purchased
- [ ] Package installed (`npm install @vonage/server-sdk`)
- [ ] Credentials in .env
- [ ] Business profile updated
- [ ] `voiceProvider` set to `"vonage"`
- [ ] ngrok running (for local testing)
- [ ] Server restarted

## 🎯 That's It!

You're ready to make real calls with Vonage!

**See `VONAGE_SETUP_GUIDE.md` for detailed instructions.**

