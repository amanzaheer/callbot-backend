/**
 * Call Controller
 * Handles Twilio webhooks and call management
 */

const twilioService = require('../services/voice/twilioService');
const vonageService = require('../services/voice/vonageService');
const telnyxService = require('../services/voice/telnyxService');
const callSessionService = require('../services/call/callSessionService');
const conversationOrchestrator = require('../services/conversation/conversationOrchestrator');
const openaiService = require('../services/ai/openaiService');
const Business = require('../models/Business');
const CallSession = require('../models/CallSession');
const CallRecording = require('../models/CallRecording');
const logger = require('../utils/logger');

class CallController {
  /**
   * Handle incoming call webhook
   */
  async handleIncomingCall(req, res) {
    try {
      const twilioData = req.body;

      // Find business by phone number
      const business = await Business.findOne({
        twilioPhoneNumber: twilioData.To
      });

      if (!business) {
        logger.error(`Business not found for phone: ${twilioData.To}`);
        return res.status(404).send('Business not found');
      }

      // Create call session
      const callSession = await callSessionService.createCallSession(
        business._id,
        twilioData
      );

      // Generate greeting TwiML
      const greeting = business.conversationSettings?.greeting ||
        `Hello! Thank you for calling ${business.name}. How can I help you today?`;

      const twiml = twilioService.generateTwiML({
        say: greeting,
        voice: business.aiSettings?.voice || 'alice',
        language: business.aiSettings?.language || 'en-US',
        gather: true,
        gatherInput: 'speech',
        gatherAction: `/api/calls/process-speech/${callSession._id}`,
        gatherSay: '',
        speechTimeout: 'auto'
      });

      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      logger.error('Handle incoming call error:', error);
      res.status(500).send('Error handling call');
    }
  }

  /**
   * Process speech input from Twilio
   */
  async processSpeech(req, res) {
    try {
      const { callSessionId } = req.params;
      const speechResult = req.body.SpeechResult || req.body.Digits;

      if (!speechResult) {
        // No input received, ask again
        const callSession = await callSessionService.getCallSession(callSessionId);
        const business = await Business.findById(callSession.businessId);

        const twiml = twilioService.generateTwiML({
          say: "I didn't catch that. Could you please repeat?",
          voice: business.aiSettings?.voice || 'alice',
          gather: true,
          gatherInput: 'speech',
          gatherAction: `/api/calls/process-speech/${callSessionId}`,
          speechTimeout: 'auto'
        });

        res.type('text/xml');
        return res.send(twiml);
      }

      // Process user input
      const response = await conversationOrchestrator.processUserInput(
        callSessionId,
        speechResult
      );

      // Get call session and business for settings
      const callSession = await callSessionService.getCallSession(callSessionId);
      const business = await Business.findById(callSession.businessId);

      // Generate TwiML response
      let twimlInstructions = {
        say: response.text,
        voice: business.aiSettings?.voice || 'alice',
        language: business.aiSettings?.language || 'en-US'
      };

      // If not completed, continue gathering input
      if (response.callState !== 'completed') {
        twimlInstructions.gather = true;
        twimlInstructions.gatherInput = 'speech';
        twimlInstructions.gatherAction = `/api/calls/process-speech/${callSessionId}`;
        twimlInstructions.speechTimeout = 'auto';
      } else {
        // Call completed
        twimlInstructions.hangup = true;
      }

      const twiml = twilioService.generateTwiML(twimlInstructions);

      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      logger.error('Process speech error:', error);

      // Try to send error response
      try {
        const callSession = await callSessionService.getCallSession(req.params.callSessionId);
        const business = await Business.findById(callSession.businessId);

        const twiml = twilioService.generateTwiML({
          say: "I'm sorry, I encountered an error. Please try again later.",
          voice: business.aiSettings?.voice || 'alice',
          hangup: true
        });

        res.type('text/xml');
        res.send(twiml);
      } catch (e) {
        res.status(500).send('Error');
      }
    }
  }

  /**
   * Handle call status updates
   */
  async handleCallStatus(req, res) {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;

      const callSession = await CallSession.findOne({ twilioCallSid: CallSid });
      if (!callSession) {
        return res.status(404).send('Call session not found');
      }

      // Map Twilio status to our status
      const statusMap = {
        'ringing': 'ringing',
        'in-progress': 'in-progress',
        'completed': 'completed',
        'busy': 'busy',
        'failed': 'failed',
        'no-answer': 'no-answer',
        'canceled': 'cancelled'
      };

      const updateData = {
        status: statusMap[CallStatus] || CallStatus,
        duration: CallDuration ? parseInt(CallDuration) : 0
      };

      if (CallStatus === 'completed') {
        updateData.endTime = new Date();
      }

      await callSessionService.updateCallStatus(callSession._id, updateData.status, updateData);

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Handle call status error:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle recording status
   */
  async handleRecordingStatus(req, res) {
    try {
      const { CallSid, RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration } = req.body;

      const callSession = await CallSession.findOne({ twilioCallSid: CallSid });
      if (!callSession) {
        return res.status(404).send('Call session not found');
      }

      // Update call session with recording info
      await CallSession.findByIdAndUpdate(callSession._id, {
        recordingUrl: RecordingUrl,
        recordingSid: RecordingSid
      });

      // Create or update recording record
      if (RecordingStatus === 'completed') {
        await CallRecording.findOneAndUpdate(
          { callSessionId: callSession._id },
          {
            businessId: callSession.businessId,
            callSessionId: callSession._id,
            twilioRecordingSid: RecordingSid,
            twilioAccountSid: callSession.twilioAccountSid,
            url: RecordingUrl,
            duration: parseInt(RecordingDuration),
            status: 'completed'
          },
          { upsert: true, new: true }
        );
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Handle recording status error:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Make outgoing call
   */
  async makeOutgoingCall(req, res) {
    try {
      const { businessId } = req;
      const { to, serviceId } = req.body;

      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      const provider = business.voiceProvider || 'twilio';
      const baseUrl = process.env.VONAGE_WEBHOOK_URL || process.env.TWILIO_WEBHOOK_URL ||
        `${req.protocol}://${req.get('host')}`;
      const webhookUrl = `${baseUrl}/api/calls/webhook`;

      // Route to appropriate provider
      if (provider === 'vonage') {
        return await this.makeVonageCall(business, to, serviceId, webhookUrl, res);
      } else if (provider === 'telnyx') {
        return await this.makeTelnyxCall(business, to, serviceId, res);
      } else if (provider === 'test') {
        return await this.makeTestCall(business, to, serviceId, res);
      } else {
        // Default to Twilio
        return await this.makeTwilioCall(business, to, serviceId, webhookUrl, res);
      }
    } catch (error) {
      logger.error('Make outgoing call error:', error);

      let errorMessage = 'Failed to make call';
      if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Make Twilio call
   */
  async makeTwilioCall(business, to, serviceId, webhookUrl, res) {
    if (!business.twilioAccountSid || !business.twilioAuthToken) {
      return res.status(400).json({
        success: false,
        message: 'Twilio credentials not configured. Please update your business profile.',
        hint: 'Use PUT /api/businesses/profile to add Twilio credentials'
      });
    }

    if (!business.twilioPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Twilio phone number not configured.'
      });
    }

    const twilioClient = twilioService.initializeBusinessClient(
      business.twilioAccountSid,
      business.twilioAuthToken
    );

    const call = await twilioClient.calls.create({
      to: to,
      from: business.twilioPhoneNumber,
      url: `${webhookUrl}?serviceId=${serviceId || ''}`,
      record: business.conversationSettings?.enableCallRecording !== false,
      recordingStatusCallback: `${webhookUrl}/recording-status`,
      statusCallback: `${webhookUrl}/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    return res.json({
      success: true,
      provider: 'twilio',
      callSid: call.sid,
      status: call.status
    });
  }

  /**
   * Make Vonage call
   */
  async makeVonageCall(business, to, serviceId, webhookUrl, res) {
    if (!business.vonageApiKey || !business.vonageApiSecret) {
      return res.status(400).json({
        success: false,
        message: 'Vonage credentials not configured. Please update your business profile.',
        hint: 'Use PUT /api/businesses/profile to add Vonage credentials'
      });
    }

    if (!business.vonagePhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vonage phone number not configured.'
      });
    }

    const vonageClient = vonageService.initializeBusinessClient(
      business.vonageApiKey,
      business.vonageApiSecret
    );

    const call = await vonageClient.voice.createOutboundCall({
      to: [{
        type: 'phone',
        number: to
      }],
      from: {
        type: 'phone',
        number: business.vonagePhoneNumber
      },
      answer_url: [`${webhookUrl}/answer?serviceId=${serviceId || ''}`],
      event_url: [`${webhookUrl}/event`]
    });

    return res.json({
      success: true,
      provider: 'vonage',
      callUuid: call.uuid,
      status: call.status || 'ringing'
    });
  }

  /**
   * Make Telnyx call (Voice API)
   */
  async makeTelnyxCall(business, to, serviceId, res) {
    if (!business.telnyxApiKey || !business.telnyxConnectionId) {
      return res.status(400).json({
        success: false,
        message: 'Telnyx credentials not configured. Please update your business profile.',
        hint: 'Use PUT /api/businesses/profile to add telnyxApiKey and telnyxConnectionId'
      });
    }
    if (!business.telnyxPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Telnyx phone number not configured.'
      });
    }
    try {
      const result = await telnyxService.createOutboundCall(
        business.telnyxPhoneNumber,
        to,
        business.telnyxConnectionId,
        business.telnyxApiKey
      );
      const callControlId = result.call_control_id;
      const callData = {
        CallSid: callControlId,
        AccountSid: 'TELNYX',
        From: business.telnyxPhoneNumber,
        To: to
      };
      const callSession = await callSessionService.createCallSession(business._id, callData);
      await callSessionService.updateCallStatus(callSession._id, 'ringing', {
        direction: 'outbound',
        ...(serviceId && { serviceId })
      });
      return res.json({
        success: true,
        provider: 'telnyx',
        callControlId,
        callSessionId: callSession._id.toString(),
        status: 'ringing'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to make call'
      });
    }
  }

  /**
   * Make test call
   */
  async makeTestCall(business, to, serviceId, res) {
    const testCallService = require('../services/voice/testCallService');
    const call = await testCallService.makeCall(business._id, to, serviceId);

    return res.json({
      success: true,
      provider: 'test',
      callSid: call.sid,
      callSessionId: call.callSessionId,
      status: call.status,
      note: 'This is a simulated call. Use /api/test-calls/input to send messages.'
    });
  }

  /**
   * Handle Vonage answer webhook (for both inbound and outbound calls)
   */
  async handleVonageAnswer(req, res) {
    try {
      const { uuid, conversation_uuid, to, from, direction } = req.body;

      // Determine if this is an inbound or outbound call
      const isInbound = direction === 'inbound' || !direction;

      // Find business by phone number
      // For inbound: user calls business number (to = business number)
      // For outbound: bot calls user (from = business number)
      const business = await Business.findOne({
        $or: [
          { vonagePhoneNumber: to },
          { vonagePhoneNumber: from }
        ]
      });

      if (!business) {
        logger.error(`Business not found for Vonage call: to=${to}, from=${from}`);
        return res.status(404).send('Business not found');
      }

      // Create call session
      const callData = {
        CallSid: uuid || conversation_uuid,
        AccountSid: 'VONAGE',
        From: isInbound ? from : business.vonagePhoneNumber, // User's number for inbound
        To: isInbound ? business.vonagePhoneNumber : from    // Business number for inbound
      };

      const callSession = await callSessionService.createCallSession(
        business._id,
        callData
      );

      // Store call direction
      await callSessionService.updateCallStatus(callSession._id, 'ringing', {
        direction: isInbound ? 'inbound' : 'outbound',
        vonageCallUuid: uuid || conversation_uuid
      });

      // Generate NCCO response
      const greeting = business.conversationSettings?.greeting ||
        `Hello! Thank you for calling ${business.name}. How can I help you today?`;

      const baseUrl = process.env.VONAGE_WEBHOOK_URL ||
        `${req.protocol}://${req.get('host')}`;

      const ncco = vonageService.generateNCCO({
        say: greeting,
        voice: business.aiSettings?.voice || 'Amy',
        language: business.aiSettings?.language || 'en-US',
        input: true,
        sessionId: callSession._id.toString(),
        inputCallback: `${baseUrl}/api/calls/vonage-speech/${callSession._id}`
      });

      res.json(ncco);
    } catch (error) {
      logger.error('Handle Vonage answer error:', error);
      res.status(500).send('Error handling call');
    }
  }

  /**
   * Handle Vonage inbound call webhook (when user calls business number)
   */
  async handleVonageInbound(req, res) {
    try {
      const { to, from, uuid, conversation_uuid } = req.body;

      // Find business by phone number (to = business number for inbound)
      const business = await Business.findOne({
        vonagePhoneNumber: to
      });

      if (!business) {
        logger.error(`Business not found for inbound Vonage call: ${to}`);
        return res.status(404).send('Business not found');
      }

      // Create call session for inbound call
      const callData = {
        CallSid: uuid || conversation_uuid,
        AccountSid: 'VONAGE',
        From: from, // User's phone number
        To: to      // Business phone number
      };

      const callSession = await callSessionService.createCallSession(
        business._id,
        callData
      );

      // Mark as inbound call
      await callSessionService.updateCallStatus(callSession._id, 'ringing', {
        direction: 'inbound',
        vonageCallUuid: uuid || conversation_uuid
      });

      // Generate greeting NCCO
      // Use default language or first supported language
      const defaultLanguage = business.aiSettings?.supportedLanguages?.[0] || business.aiSettings?.language || 'en';
      const LanguageDetector = require('../utils/languageDetector');
      const vonageLangCode = LanguageDetector.getVonageLanguageCode(defaultLanguage);
      const voice = LanguageDetector.getVoiceForLanguage(defaultLanguage, 'vonage');

      const greeting = business.conversationSettings?.greeting ||
        LanguageDetector.getGreeting(defaultLanguage, business.name);

      const baseUrl = process.env.VONAGE_WEBHOOK_URL ||
        `${req.protocol}://${req.get('host')}`;

      const ncco = vonageService.generateNCCO({
        say: greeting,
        voice: voice,
        language: vonageLangCode,
        input: true,
        sessionId: callSession._id.toString(),
        inputCallback: `${baseUrl}/api/calls/vonage-speech/${callSession._id}`
      });

      res.json(ncco);
    } catch (error) {
      logger.error('Handle Vonage inbound error:', error);
      res.status(500).send('Error handling inbound call');
    }
  }

  /**
   * Handle Vonage speech input
   */
  async handleVonageSpeech(req, res) {
    try {
      const { callSessionId } = req.params;
      const { speech } = req.body;

      if (!speech || !speech.results || speech.results.length === 0) {
        // No speech detected, ask again
        const callSession = await callSessionService.getCallSession(callSessionId);
        const business = await Business.findById(callSession.businessId);

        const baseUrl = process.env.VONAGE_WEBHOOK_URL ||
          `${req.protocol}://${req.get('host')}`;

        const LanguageDetector = require('../utils/languageDetector');
        const detectedLanguage = callSession.detectedLanguage || business.aiSettings?.supportedLanguages?.[0] || 'en';
        const vonageLangCode = LanguageDetector.getVonageLanguageCode(detectedLanguage);
        const voice = LanguageDetector.getVoiceForLanguage(detectedLanguage, 'vonage');
        const repeatMessage = LanguageDetector.getRepeatMessage(detectedLanguage);

        const ncco = vonageService.generateNCCO({
          say: repeatMessage,
          voice: voice,
          language: vonageLangCode,
          input: true,
          sessionId: callSession._id.toString(),
          inputCallback: `${baseUrl}/api/calls/vonage-speech/${callSessionId}`
        });

        return res.json(ncco);
      }

      // Get speech result
      const speechResult = speech.results[0].text;

      // Process user input
      const response = await conversationOrchestrator.processUserInput(
        callSessionId,
        speechResult
      );

      // Get call session and business for settings
      const callSession = await callSessionService.getCallSession(callSessionId);
      const business = await Business.findById(callSession.businessId);

      const baseUrl = process.env.VONAGE_WEBHOOK_URL ||
        `${req.protocol}://${req.get('host')}`;

      // Get language and voice settings
      const LanguageDetector = require('../utils/languageDetector');
      const detectedLanguage = callSession.detectedLanguage || business.aiSettings?.supportedLanguages?.[0] || 'en';
      const vonageLangCode = LanguageDetector.getVonageLanguageCode(detectedLanguage);
      const voice = LanguageDetector.getVoiceForLanguage(detectedLanguage, 'vonage');

      // Generate NCCO response
      let nccoInstructions = {
        say: response.text,
        voice: voice,
        language: vonageLangCode
      };

      // If not completed, continue gathering input
      if (response.callState !== 'completed') {
        nccoInstructions.input = true;
        nccoInstructions.sessionId = callSession._id.toString();
        nccoInstructions.inputCallback = `${baseUrl}/api/calls/vonage-speech/${callSessionId}`;
      } else {
        // Call completed
        nccoInstructions.hangup = true;
      }

      const ncco = vonageService.generateNCCO(nccoInstructions);

      res.json(ncco);
    } catch (error) {
      logger.error('Handle Vonage speech error:', error);

      // Try to send error response
      try {
        const callSession = await callSessionService.getCallSession(req.params.callSessionId);
        const business = await Business.findById(callSession.businessId);

        const baseUrl = process.env.VONAGE_WEBHOOK_URL ||
          `${req.protocol}://${req.get('host')}`;

        const LanguageDetector = require('../utils/languageDetector');
        const detectedLanguage = callSession?.detectedLanguage || business.aiSettings?.supportedLanguages?.[0] || 'en';
        const vonageLangCode = LanguageDetector.getVonageLanguageCode(detectedLanguage);
        const voice = LanguageDetector.getVoiceForLanguage(detectedLanguage, 'vonage');
        const errorMessage = detectedLanguage === 'ur'
          ? 'معذرت، میں نے ایک خرابی کا سامنا کیا۔ براہ کرم بعد میں دوبارہ کوشش کریں۔'
          : "I'm sorry, I encountered an error. Please try again later.";

        const ncco = vonageService.generateNCCO({
          say: errorMessage,
          voice: voice,
          language: vonageLangCode,
          hangup: true
        });

        res.json(ncco);
      } catch (e) {
        res.status(500).send('Error');
      }
    }
  }

  /**
   * Handle Vonage event webhook
   */
  async handleVonageEvent(req, res) {
    try {
      const { uuid, status, direction, from, to, duration } = req.body;

      // Find call session
      const callSession = await CallSession.findOne({
        twilioCallSid: uuid
      });

      if (!callSession) {
        return res.status(404).send('Call session not found');
      }

      // Map Vonage status to our status
      const statusMap = {
        'started': 'in-progress',
        'ringing': 'ringing',
        'answered': 'in-progress',
        'completed': 'completed',
        'busy': 'busy',
        'failed': 'failed',
        'rejected': 'failed',
        'timeout': 'no-answer',
        'cancelled': 'cancelled'
      };

      const updateData = {
        status: statusMap[status] || status,
        duration: duration ? parseInt(duration) : 0
      };

      if (status === 'completed') {
        updateData.endTime = new Date();
      }

      await callSessionService.updateCallStatus(callSession._id, updateData.status, updateData);

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Handle Vonage event error:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Telnyx Voice API webhooks (single endpoint for all events)
   */
  async handleTelnyxWebhook(req, res) {
    try {
      const body = req.body?.data || req.body;
      const eventType = body.event_type;
      const payload = body.payload || body;

      logger.info(`Telnyx webhook received: ${eventType}`, {
        eventType,
        rawBodyType: typeof req.body
      });

      if (!eventType) {
        logger.warn('Telnyx webhook missing event_type');
        return res.status(400).send('Bad Request');
      }

      const callControlId = payload?.call_control_id;
      const { from, to, direction } = payload || {};
      if (!callControlId && eventType !== 'call.hangup') {
        logger.warn('Telnyx webhook missing call_control_id', { eventType });
        return res.status(200).send('OK');
      }

      if (eventType === 'call.initiated') {
        logger.info('Telnyx call.initiated payload', { callControlId, from, to, direction });
        let callSession = await CallSession.findOne({ twilioCallSid: callControlId });
        if (callSession) return res.status(200).send('OK');
        const isInbound = (direction || '').toLowerCase() === 'incoming';
        const business = await Business.findOne(
          isInbound ? { telnyxPhoneNumber: to } : { telnyxPhoneNumber: from }
        );
        if (!business) {
          logger.error(`Business not found for Telnyx call: to=${to}, from=${from}`);
          return res.status(404).send('OK');
        }
        const callData = {
          CallSid: callControlId,
          AccountSid: 'TELNYX',
          From: isInbound ? from : business.telnyxPhoneNumber,
          To: isInbound ? business.telnyxPhoneNumber : from
        };
        callSession = await callSessionService.createCallSession(business._id, callData);
        await callSessionService.updateCallStatus(callSession._id, 'ringing', {
          direction: isInbound ? 'inbound' : 'outbound'
        });

        // For inbound calls, immediately answer and start the bot
        if (isInbound) {
          const LanguageDetector = require('../utils/languageDetector');
          const lang = business.aiSettings?.supportedLanguages?.[0] || business.aiSettings?.language || 'en';
          const greeting = business.conversationSettings?.greeting ||
            LanguageDetector.getGreeting(lang, business.name);
          const voice = telnyxService.constructor.getTelnyxVoice(
            LanguageDetector.getVoiceForLanguage(lang, 'vonage')
          );
          const transcribeLang = telnyxService.constructor.getTelnyxTranscriptionLanguage(lang);

          await telnyxService.answerCall(callControlId, business.telnyxApiKey);
          await telnyxService.speak(callControlId, greeting, business.telnyxApiKey, {
            voice,
            language: transcribeLang === 'en' ? 'en-US' : transcribeLang
          });
          await telnyxService.transcriptionStart(callControlId, business.telnyxApiKey, {
            language: transcribeLang
          });
          await callSessionService.updateCallStatus(callSession._id, 'in-progress');
        }

        return res.status(200).send('OK');
      }

      if (eventType === 'call.answered') {
        const callSession = await CallSession.findOne({ twilioCallSid: callControlId });
        if (!callSession) return res.status(200).send('OK');
        const business = await Business.findById(callSession.businessId);
        if (!business) return res.status(200).send('OK');

        const isInbound = callSession.direction === 'inbound';
        // Inbound calls are already answered and started in call.initiated
        if (isInbound) {
          return res.status(200).send('OK');
        }

        const LanguageDetector = require('../utils/languageDetector');
        const lang = business.aiSettings?.supportedLanguages?.[0] || business.aiSettings?.language || 'en';
        const greeting = business.conversationSettings?.greeting ||
          LanguageDetector.getGreeting(lang, business.name);
        const voice = telnyxService.constructor.getTelnyxVoice(
          LanguageDetector.getVoiceForLanguage(lang, 'vonage')
        );
        const transcribeLang = telnyxService.constructor.getTelnyxTranscriptionLanguage(lang);

        await telnyxService.speak(callControlId, greeting, business.telnyxApiKey, {
          voice,
          language: transcribeLang === 'en' ? 'en-US' : transcribeLang
        });
        await telnyxService.transcriptionStart(callControlId, business.telnyxApiKey, {
          language: transcribeLang
        });
        await callSessionService.updateCallStatus(callSession._id, 'in-progress');
        return res.status(200).send('OK');
      }

      if (eventType === 'call.speak.ended') {
        const callSession = await CallSession.findOne({ twilioCallSid: callControlId });
        if (!callSession) return res.status(200).send('OK');
        const business = await Business.findById(callSession.businessId);
        if (!business) return res.status(200).send('OK');

        if (callSession.callState === 'completed') {
          await telnyxService.hangup(callControlId, business.telnyxApiKey);
          await callSessionService.updateCallStatus(callSession._id, 'completed', { endTime: new Date() });
        } else {
          const lang = callSession.detectedLanguage || business.aiSettings?.supportedLanguages?.[0] || 'en';
          await telnyxService.transcriptionStart(callControlId, business.telnyxApiKey, {
            language: telnyxService.constructor.getTelnyxTranscriptionLanguage(lang)
          });
        }
        return res.status(200).send('OK');
      }

      if (eventType === 'call.transcription') {
        const transcript = payload.transcription_data?.transcript;
        const isFinal = payload.transcription_data?.is_final;
        if (!transcript || !isFinal) return res.status(200).send('OK');

        const callSession = await CallSession.findOne({ twilioCallSid: callControlId });
        if (!callSession) return res.status(200).send('OK');
        const business = await Business.findById(callSession.businessId);
        if (!business) return res.status(200).send('OK');

        const response = await conversationOrchestrator.processUserInput(
          callSession._id.toString(),
          transcript
        );

        const LanguageDetector = require('../utils/languageDetector');
        const lang = callSession.detectedLanguage || business.aiSettings?.supportedLanguages?.[0] || 'en';
        const voice = telnyxService.constructor.getTelnyxVoice(
          LanguageDetector.getVoiceForLanguage(lang, 'vonage')
        );
        const speakLang = telnyxService.constructor.getTelnyxTranscriptionLanguage(lang);

        await telnyxService.speak(callControlId, response.text, business.telnyxApiKey, {
          voice,
          language: speakLang === 'en' ? 'en-US' : speakLang
        });

        if (response.callState === 'completed') {
          await callSessionService.updateCallStatus(callSession._id, 'in-progress', {
            callState: 'completed'
          });
        }
        return res.status(200).send('OK');
      }

      if (eventType === 'call.hangup') {
        const callSession = await CallSession.findOne({ twilioCallSid: callControlId });
        if (callSession) {
          await callSessionService.updateCallStatus(callSession._id, 'completed', {
            endTime: new Date(),
            ...(payload.duration_secs && { duration: payload.duration_secs })
          });
        }
        return res.status(200).send('OK');
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Handle Telnyx webhook error:', error);
      res.status(500).send('Error');
    }
  }
}

module.exports = new CallController();

