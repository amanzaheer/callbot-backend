# Telnyx Setup Guide – Inbound Calls Only

**Set up Telnyx so users can call your bot (inbound only). When someone calls your Telnyx number, the backend answers, plays the greeting, and runs the voice bot. Telnyx works in Pakistan and uses pay-as-you-go pricing.**

---

## Why Telnyx?

- **Pay-as-you-go:** No monthly minimum; pay only for usage (~$0.002–0.01/min depending on destination)
- **Pakistan supported:** Signup and calling work from Pakistan (unlike some providers that block verification)
- **Voice API:** REST + webhooks (answer, speak, transcription, hangup) for full control
- **Inbound:** User calls your number → bot answers and talks via speech-to-text
- **Reliable:** Global network; used by many developers

---

## Prerequisites

1. **Telnyx account** – [Sign up](https://telnyx.com/sign-up)
2. **Public webhook URL** – ngrok for local testing, or your deployed server URL
3. **Node.js backend** – this project (uses `axios`; no extra npm packages)

---

## Step 1: Create Telnyx Account

1. Go to **https://telnyx.com/sign-up**
2. Sign up with email (and optional phone)
3. Verify email and complete profile
4. Add a **payment method** under **Billing** (needed to buy a phone number and for inbound usage)

**Get your API key:**

1. Open **Mission Control**: https://portal.telnyx.com/
2. Go to **API Keys** (or **Developers** → **API Keys**)
3. Create an API key and **copy it** (you won’t see it again)

---

## Step 2: Create a Voice API Application

1. In Mission Control go to **Voice** → **Call Control** → **Applications** (or **Developers** → **Applications**)
2. Click **Add Application** (or **Create Application**)
3. Set:
   - **Name:** e.g. `CallBot`
   - **Webhook URL:**  
     `https://YOUR_PUBLIC_URL/api/calls/telnyx-webhook`  
     (Replace with your ngrok URL or production base, e.g. `https://abc123.ngrok.io`)
   - **HTTP method:** POST
4. Save and **copy the Application ID** (this is your **Connection ID**)

You will use this **Connection ID** as `telnyxConnectionId` in the business profile.

---

## Step 3: Get a Phone Number

1. In Mission Control go to **Numbers** → **Search & Buy**
2. Choose **Country** (e.g. United States or a country where you can receive SMS for verification)
3. For **Number type** choose **Voice** (or Voice + SMS if needed)
4. Search and **buy** a number
5. **Assign the number to your Voice Application:**
   - Go to **Numbers** → **My Numbers**
   - Click the number → set **Connection** to the Call Control application you created
   - Save

Note the number in **E.164** format (e.g. `+1234567890`). This is your **Telnyx phone number** that users will call.

---

## Step 4: ngrok for Local Testing

1. Start your backend:
   ```bash
   npm start
   ```
2. In another terminal:
   ```bash
   ngrok http 3000
   ```
3. Copy the **HTTPS** URL (e.g. `https://abc123.ngrok.io`)
4. Set your Voice Application **Webhook URL** to:
   `https://abc123.ngrok.io/api/calls/telnyx-webhook`

Keep ngrok running while testing.

---

## Step 5: Environment Variables

You don’t need Telnyx-specific env vars for the app to run; credentials are stored **per business** in the database. Optionally:

```bash
# Optional – used if you need a canonical base URL (e.g. for webhooks in docs)
TELNYX_WEBHOOK_URL=https://your-ngrok-or-production-url
```

---

## Step 6: Update Business Profile with Telnyx

Send your Telnyx credentials to the backend so the bot uses Telnyx for inbound calls.

1. **Login** to get a JWT:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email@example.com", "password": "your-password"}'
   ```
2. Copy the **token** from the response.
3. **Update profile** with Telnyx and set provider to `telnyx`:
   ```bash
   curl -X PUT http://localhost:3000/api/businesses/profile \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "voiceProvider": "telnyx",
       "telnyxApiKey": "YOUR_TELNYX_API_KEY",
       "telnyxConnectionId": "YOUR_CONNECTION_ID",
       "telnyxPhoneNumber": "+1234567890"
     }'
   ```

Replace:

- `YOUR_TELNYX_API_KEY` – from Mission Control → API Keys  
- `YOUR_CONNECTION_ID` – Voice API Application ID (Connection ID)  
- `+1234567890` – your Telnyx number in E.164  

---

## Step 7: Start the Server and Test Inbound

1. **Start server**
   ```bash
   npm start
   ```
2. **(Local)** Start ngrok and set the Voice Application webhook URL to  
   `https://YOUR_NGROK_URL/api/calls/telnyx-webhook`

**Test inbound:**  
Call your Telnyx number from any phone. The backend will answer, play the greeting, and use speech-to-text so the user can talk to the bot.

---

## Webhook Endpoint (Reference)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/calls/telnyx-webhook` | Single URL for all Telnyx Voice events |

For **inbound** calls the backend handles:

- `call.initiated` – create call session (inbound)
- `call.answered` – answer the call, then greet + start transcription
- `call.speak.ended` – start transcription again or hangup if conversation is done
- `call.transcription` – user speech text → AI reply → speak
- `call.hangup` – update session as completed

---

## Troubleshooting

**"Telnyx credentials not configured"**  
- Ensure the business profile has `voiceProvider: "telnyx"`, `telnyxApiKey`, `telnyxConnectionId`, and `telnyxPhoneNumber` set (e.g. via the PUT profile request above).

**Inbound: no answer or no greeting**  
- Confirm the Telnyx number is assigned to the **same** Voice API Application (Connection) whose webhook is `.../api/calls/telnyx-webhook`.  
- Check server logs for errors when the call hits the webhook.

**Webhook not called**  
- Use HTTPS.  
- For local dev, use ngrok and set the webhook to the ngrok HTTPS URL.  
- Ensure the server is running and the route is `POST /api/calls/telnyx-webhook`.

---

## Pricing (Approximate)

- **Inbound:** ~\$0.002–0.01/min (check [Telnyx pricing](https://telnyx.com/pricing))  
- **Phone number:** monthly fee depending on country  
- **Transcription:** may have a small per-minute cost depending on engine  

No monthly minimum; you pay for usage. Good for testing and for Pakistan.

---

## Quick Start Checklist (Inbound Only)

- [ ] Telnyx account created  
- [ ] API key created and copied  
- [ ] Voice API Application created; webhook = `https://YOUR_URL/api/calls/telnyx-webhook`  
- [ ] Number bought and assigned to that application  
- [ ] Backend running; ngrok running (if local) and webhook URL updated  
- [ ] Business profile updated with `voiceProvider`, `telnyxApiKey`, `telnyxConnectionId`, `telnyxPhoneNumber`  
- [ ] Test inbound: call your Telnyx number from a phone  

---

## Full conversation, Urdu, and restaurant (fast food) bot

After the bot answers and says the greeting, it must **respond to what the user says** (questions, orders). The backend uses the **full Telnyx webhook flow** in `callController.handleTelnyxWebhook`: it handles `call.transcription` and runs the conversation orchestrator, then speaks the reply. Make sure your **Telnyx webhook URL** points to **this app** only (e.g. `https://callbot-backend.onrender.com/api/calls/telnyx-webhook`). Do **not** use a separate simple webhook that only answers and never handles transcription.

### 1. Urdu language

- **Business profile** (PUT `/api/businesses/profile`): set  
  `aiSettings.supportedLanguages = ["ur"]` (or `["ur", "en"]`) and optionally `aiSettings.language = "ur"`.
- **Greeting in Urdu:** set `conversationSettings.greeting` to your Urdu text, e.g.  
  `"السلام علیکم! [Your Restaurant] پر کال کرنے کا شکریہ۔ آپ کیا آرڈر کرنا چاہیں گے؟"`
- The app uses `languageDetector` and Telnyx transcription language `ur` so the bot can listen and reply in Urdu when the business is configured for Urdu.

### 2. Fast food restaurant: orders and details

- **Services:** Create **Service definitions** for your business (e.g. “Burger order”, “Pizza order”) with workflow type `order` and fields like item, quantity, name, phone, address. Use the **Admin API** or your admin UI to create these (e.g. POST to your service-definitions endpoint or seed via MongoDB).
- **Business type:** Set `businessType` on the business (e.g. `"restaurant"` or `"fast_food"`) so the AI can answer questions about the menu and take orders.
- **Training data (optional):** Add **training data** entries for the business (menu items, FAQs in Urdu/English) so the AI can answer “What do you have?” and “Give me 2 burgers” correctly and in Urdu.

### 3. Checklist

- [ ] Webhook URL is `.../api/calls/telnyx-webhook` (full flow, not a simple answer-only webhook).
- [ ] Business profile has `telnyxPhoneNumber`, `telnyxApiKey`, `telnyxConnectionId` and, for Urdu, `supportedLanguages` and Urdu greeting.
- [ ] At least one **service definition** (e.g. order type) exists for the business.
- [ ] Call the number: bot should answer, then reply to your speech and support ordering/details in Urdu if configured.

---

## Links

- [Telnyx Mission Control](https://portal.telnyx.com/)
- [Telnyx Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/get-started)
- [Telnyx Webhooks](https://developers.telnyx.com/docs/voice/programmable-voice/receiving-webhooks)
- [Telnyx Pricing](https://telnyx.com/pricing)
