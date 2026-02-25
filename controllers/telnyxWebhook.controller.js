// const telnyxService = require("../services/telnyx.service");

const telnyxService = require("../services/voice/telnyxService");

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

exports.telnyxWebhook = async (req, res) => {
    try {
        console.log('📞 Telnyx Webhook:', JSON.stringify(req.body, null, 2));

        // Telnyx can send either { event_type, payload } or { data: { event_type, payload } }
        const wrapper = req.body?.data || req.body;
        const event_type = wrapper?.event_type;
        const payload = wrapper?.payload ?? wrapper;

        // Only handle call.initiated; other events (e.g. call.transcription) are handled by full flow
        if (event_type === 'call.initiated' && payload?.call_control_id) {
            const callControlId = payload.call_control_id;

            // 1️⃣ Answer call
            await telnyxService.answerCall(callControlId, TELNYX_API_KEY);

            // 2️⃣ Speak message
            await telnyxService.speak(
                callControlId,
                'Hello, your call is connected. Please say something.',
                TELNYX_API_KEY,
                { voice: 'female', language: 'en-US' }
            );

            // 3️⃣ Start transcription (listen user)
            await telnyxService.transcriptionStart(callControlId, TELNYX_API_KEY, {
                language: 'en',
            });
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('❌ Webhook error:', err.message);
        // Always 200 so Telnyx doesn't retry forever
        res.status(200).json({ status: 'error' });
    }
};