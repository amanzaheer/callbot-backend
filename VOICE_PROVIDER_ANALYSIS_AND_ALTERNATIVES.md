# Call Bot Backend: Vonage Analysis & Alternatives (Pakistan-Friendly)

## 1. Your current backend – quick analysis

Your backend already supports **inbound** and **outbound** voice with a **provider-agnostic** design.

### Inbound (user calls bot)

| Step | What happens |
|------|-------------------------------|
| 1 | User dials your Vonage number. |
| 2 | Vonage sends **POST** to `/api/calls/inbound` (or `/api/calls/answer`). |
| 3 | You find the business by `vonagePhoneNumber`, create a `CallSession`, return **NCCO** (greeting + speech input). |
| 4 | User speaks → Vonage POSTs to `/api/calls/vonage-speech/:callSessionId`. |
| 5 | `conversationOrchestrator.processUserInput()` runs; you return NCCO (say + optional input/hangup). |
| 6 | Repeat until call ends; status updates go to `/api/calls/event`. |

**Relevant code:** `callController.handleVonageInbound`, `handleVonageAnswer`, `handleVonageSpeech`, `handleVonageEvent`.

### Outbound (bot calls user)

| Step | What happens |
|------|-------------------------------|
| 1 | You call **POST** `/api/calls/outgoing` with `{ to: "+92..." }`. |
| 2 | Controller reads `business.voiceProvider`; if `"vonage"` → `makeVonageCall()`. |
| 3 | `vonageService.initializeBusinessClient(apiKey, apiSecret)` and `vonageClient.voice.createOutboundCall()` with `answer_url` and `event_url`. |
| 4 | Vonage rings the user; when answered, Vonage hits **answer_url** → same flow as inbound (NCCO, speech, events). |

**Relevant code:** `callController.makeOutgoingCall` → `makeVonageCall`, `services/voice/vonageService.js`.

### Data flow summary

- **Routes:** `routes/calls.js` (Vonage: `/answer`, `/inbound`, `/vonage-speech/:id`, `/event`; outgoing: `/outgoing`).
- **Provider choice:** `Business.voiceProvider` (`'twilio' | 'vonage' | 'test'`).
- **Credentials:** Stored per business: `vonageApiKey`, `vonageApiSecret`, `vonagePhoneNumber`.
- **Call ID:** Stored in `CallSession.twilioCallSid` (same field for both Twilio and Vonage UUID).

So: **inbound and outbound are both implemented for Vonage**; the only blocker for you is **Vonage account verification in Pakistan**, not your backend logic.

---

## 2. Why you can’t receive Vonage verification in Pakistan

- Vonage often **does not deliver SMS or voice verification codes to Pakistani mobile numbers** (carrier/region restrictions).
- So you cannot complete signup/2FA from a Pakistan number. This is a **Vonage/carrier limitation**, not something you can fix in code.

---

## 3. Alternatives with similar low cost that work in Pakistan

You want: **low cost (~$2 or pay-as-you-go)** + **ability to sign up and verify from Pakistan** + **inbound + outbound voice**.

### Option A: **Plivo** (best fit for “Vonage-like” cheap usage)

| Item | Detail |
|------|--------|
| **Pricing** | Pay-as-you-go, **no monthly minimum**. Pakistan voice ~ **$0.0055/min** (inbound & outbound). |
| **Free tier** | No upfront fee; pay only for usage (within plan limits, e.g. $2,500/mo on Professional). |
| **Pakistan** | Voice pricing and support for Pakistan are explicitly listed; no need for a US number to sign up. |
| **APIs** | REST Voice API, webhooks for answer, hangup, etc. (similar idea to Vonage). |
| **Signup** | plivo.com – email + payment method; verification is usually email-based, so **Pakistan mobile not required**. |

**Rough cost:** If you use ~\$2/month like with Vonage credit, you get **~360 minutes** in Pakistan at $0.0055/min. So **same ballpark as Vonage**, often **cheaper** and **usable from Pakistan**.

**Integration:** You’d add a `plivo` provider next to `vonage` and `twilio`: new `plivoService.js`, new webhook routes, and set `voiceProvider: 'plivo'` for the business. Same inbound/outbound flow (answer URL → say/input → speech webhook → event).

---

### Option B: **Telnyx**

| Item | Detail |
|------|--------|
| **Pricing** | Very low per-minute (e.g. **~$0.002/min** and up depending on destination). Pay-as-you-go. |
| **Pakistan** | They have Pakistan SMS guidelines and support; worth confirming voice and signup from Pakistan. |
| **Signup** | telnyx.com – may include KYC or phone verification; **check if they accept Pakistan numbers** or email-only. |

**Integration:** Same idea as Plivo: Telnyx Voice API + webhooks; add `telnyxService.js` and route by `voiceProvider: 'telnyx'`.

---

### Option C: **Keep Vonage but verify from another country**

- Use a **friend’s number** (e.g. US/UK) or a **virtual number** (e.g. from a VoIP app that can receive SMS) **only for Vonage account verification**.
- Once the account is verified, you can still **use Vonage to call Pakistani numbers** (outbound) and receive calls on your Vonage number (inbound). The problem is only **receiving the code in Pakistan**, not placing/receiving calls there.
- Cost stays as today (~\$2 credit, etc.).

---

## 4. Recommendation

- **If you want to move away from Vonage because of verification:**  
  Use **Plivo** first: similar “cheap voice API” model, Pakistan supported, pay-as-you-go, and you can implement it in your backend the same way you did Vonage (new provider + webhooks).

- **If you want to keep Vonage and minimal change:**  
  Use **Option C** (verify with a non-Pakistan number once), then keep using Vonage for both inbound and outbound in Pakistan.

---

## 5. Quick comparison

| Provider   | Typical cost      | Pakistan signup/verify     | Inbound | Outbound |
|-----------|--------------------|----------------------------|---------|----------|
| **Vonage** | ~\$2/mo credit     | ❌ Often no SMS/voice to PK | ✅      | ✅       |
| **Plivo** | Pay per use, ~\$0.0055/min in PK | ✅ Email signup          | ✅      | ✅       |
| **Telnyx**| Pay per use, ~\$0.002/min+ | ⚠️ Confirm PK verification | ✅      | ✅       |

---

## 6. Next steps (if you choose Plivo)

1. Sign up at [Plivo](https://www.plivo.com/), verify (usually email).
2. Buy a Plivo voice number and get API credentials (Auth ID, Auth Token).
3. In this repo:
   - Add `services/voice/plivoService.js` (init client, generate Plivo XML for answer/speech, similar to `vonageService.js` and `twilioService.js`).
   - In `callController.js`: add `makePlivoCall()`, `handlePlivoAnswer()`, `handlePlivoSpeech()`, `handlePlivoStatus()` (or equivalent), and in `makeOutgoingCall()` route `provider === 'plivo'` to `makePlivoCall()`.
   - In `routes/calls.js`: add POST routes for Plivo webhooks (answer, speech, status).
   - In `Business` model: add `plivoAuthId`, `plivoAuthToken`, `plivoPhoneNumber` and `voiceProvider: 'plivo'`.
   - In business profile API: allow updating Plivo credentials and `voiceProvider`.
4. Configure Plivo app/webhook URLs to point to your server (e.g. `https://your-domain/api/calls/plivo-answer`, etc.).
5. Set the business to `voiceProvider: 'plivo'` and test inbound + outbound.

If you tell me your preferred provider (Plivo vs Telnyx vs stay on Vonage with Option C), I can outline the exact controller/service changes and webhook URLs step by step or as a patch.
