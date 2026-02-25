// const telnyxService = require("../services/telnyx.service");

const telnyxService = require("../services/voice/telnyxService");

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

exports.telnyxWebhook = async (req, res) => {
    try {
        console.log("📞 Telnyx Webhook:", JSON.stringify(req.body, null, 2));

        const { event_type, payload } = req.body;

        // Inbound call event
        if (event_type === "call.initiated") {
            const callControlId = payload.call_control_id;

            // 1️⃣ Answer call
            await telnyxService.answerCall(callControlId, TELNYX_API_KEY);

            // 2️⃣ Speak message
            await telnyxService.speak(
                callControlId,
                "Hello, your call is connected. Please say something.",
                TELNYX_API_KEY,
                { voice: "female", language: "en-US" }
            );

            // 3️⃣ Start transcription (listen user)
            await telnyxService.transcriptionStart(callControlId, TELNYX_API_KEY, {
                language: "en",
            });
        }

        res.status(200).json({ status: "ok" });
    } catch (err) {
        console.error("❌ Webhook error:", err.message);
        res.status(200).json({ status: "error" });
        // Telnyx ko hamesha 200 dena hota hai
    }
};