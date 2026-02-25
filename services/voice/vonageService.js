/**
 * Vonage (Nexmo) Service
 * Handles Vonage API interactions for calls
 * Free tier: $2.00/month credit
 */

const Vonage = require('@vonage/server-sdk');
const logger = require('../../utils/logger');

class VonageService {
    constructor() {
        this.client = null;
        this.initializeClient();
    }

    initializeClient() {
        if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
            this.client = new Vonage({
                apiKey: process.env.VONAGE_API_KEY,
                apiSecret: process.env.VONAGE_API_SECRET
            });
        }
    }

    /**
     * Initialize client with business-specific credentials
     */
    initializeBusinessClient(apiKey, apiSecret) {
        return new Vonage({
            apiKey: apiKey,
            apiSecret: apiSecret
        });
    }

    /**
     * Make an outgoing call
     */
    async makeCall(businessPhone, to, webhookUrl, recordingEnabled = true) {
        try {
            if (!this.client) {
                throw new Error('Vonage client not initialized');
            }

            // Vonage uses NCCO (Nexmo Call Control Object) for call flow
            const ncco = [
                {
                    action: 'talk',
                    text: 'Hello! Connecting you to our AI assistant.',
                    voiceName: 'Amy'
                },
                {
                    action: 'connect',
                    endpoint: [
                        {
                            type: 'webhook',
                            uri: webhookUrl,
                            contentType: 'audio/l16;rate=16000'
                        }
                    ]
                }
            ];

            const call = await this.client.voice.createOutboundCall({
                to: [{
                    type: 'phone',
                    number: to
                }],
                from: {
                    type: 'phone',
                    number: businessPhone
                },
                answer_url: [`${webhookUrl}/answer`],
                event_url: [`${webhookUrl}/event`],
                ncco: ncco
            });

            return call;
        } catch (error) {
            logger.error('Vonage make call error:', error);
            throw new Error(`Failed to make call: ${error.message}`);
        }
    }

    /**
     * Generate NCCO (Nexmo Call Control Object) for call handling
     */
    generateNCCO(instructions) {
        const ncco = [];

        if (instructions.say) {
            ncco.push({
                action: 'talk',
                text: instructions.say,
                voiceName: instructions.voice || 'Amy',
                language: instructions.language || 'en-US'
            });
        }

        if (instructions.input) {
            ncco.push({
                action: 'input',
                type: ['speech'],
                speech: {
                    language: instructions.language || 'en-US',
                    uuid: instructions.sessionId || '',
                    endOnSilence: 1,
                    timeout: 10
                },
                eventUrl: [instructions.inputCallback || '']
            });
        }

        if (instructions.record) {
            ncco.push({
                action: 'record',
                format: 'mp3',
                eventUrl: [instructions.recordCallback || '']
            });
        }

        if (instructions.hangup) {
            ncco.push({
                action: 'hangup'
            });
        }

        return ncco;
    }

    /**
     * Get call details
     */
    async getCallDetails(callUuid, apiKey, apiSecret) {
        try {
            const client = this.initializeBusinessClient(apiKey, apiSecret);
            const call = await client.voice.getCall(callUuid);
            return call;
        } catch (error) {
            logger.error('Vonage get call details error:', error);
            throw error;
        }
    }

    /**
     * Get recording details
     */
    async getRecordingDetails(recordingUrl, apiKey, apiSecret) {
        try {
            const client = this.initializeBusinessClient(apiKey, apiSecret);
            // Vonage recordings are accessed via URL with auth
            const response = await fetch(recordingUrl, {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download recording');
            }

            return response;
        } catch (error) {
            logger.error('Vonage download recording error:', error);
            throw error;
        }
    }

    /**
     * Transfer call to human agent
     */
    generateTransferNCCO(agentPhone) {
        return [
            {
                action: 'talk',
                text: 'Please hold while we transfer you to an agent.'
            },
            {
                action: 'connect',
                endpoint: [
                    {
                        type: 'phone',
                        number: agentPhone
                    }
                ]
            }
        ];
    }
}

module.exports = new VonageService();

