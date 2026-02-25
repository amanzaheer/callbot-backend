/**
 * Language Detection Utility
 * Detects language from user input and manages multi-language support
 */

const logger = require('./logger');

class LanguageDetector {
    /**
     * Detect language from text input
     * Uses simple heuristics and can be enhanced with ML models
     */
    static detectLanguage(text) {
        if (!text || typeof text !== 'string') {
            return 'en';
        }

        const lowerText = text.toLowerCase().trim();

        // Urdu detection (Urdu script and common words)
        const urduPatterns = [
            /[\u0600-\u06FF]/g, // Urdu/Arabic script range
            /\b(میں|آپ|ہے|کیا|کے|سے|کو|پر|ہو|ہیں|کر|گا|گی|تھا|تھی|تھے|ہوں|ہوگا|ہوگی|ہوگے)\b/gi,
            /\b(سلام|شکریہ|براہ|کرم|جی|ہاں|نہیں|مہربانی|مدد|چاہیے|چاہتا|چاہتی)\b/gi
        ];

        // Check for Urdu
        for (const pattern of urduPatterns) {
            if (pattern.test(text)) {
                return 'ur';
            }
        }

        // English detection (default)
        // If text contains mostly English characters, assume English
        const englishPattern = /^[a-zA-Z0-9\s\.,!?'"\-:;()]+$/;
        if (englishPattern.test(text)) {
            return 'en';
        }

        // Default to English if uncertain
        return 'en';
    }

    /**
     * Get language code for Vonage (converts 'ur' to 'ur-PK', 'en' to 'en-US')
     */
    static getVonageLanguageCode(language) {
        const languageMap = {
            'en': 'en-US',
            'ur': 'ur-PK',
            'ar': 'ar-SA',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'hi': 'hi-IN',
            'zh': 'zh-CN'
        };

        return languageMap[language] || 'en-US';
    }

    /**
     * Get language code for OpenAI Whisper
     */
    static getOpenAILanguageCode(language) {
        const languageMap = {
            'en': 'en',
            'ur': 'ur',
            'ar': 'ar',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'hi': 'hi',
            'zh': 'zh'
        };

        return languageMap[language] || 'en';
    }

    /**
     * Get appropriate voice for language
     */
    static getVoiceForLanguage(language, provider = 'vonage') {
        if (provider === 'vonage') {
            const voiceMap = {
                'en': 'Amy',
                'ur': 'Amy', // Vonage may not have Urdu-specific voice, use default
                'ar': 'Laila',
                'es': 'Enrique',
                'fr': 'Mathieu',
                'de': 'Hans',
                'hi': 'Aditi',
                'zh': 'Zhiyu'
            };
            return voiceMap[language] || 'Amy';
        }

        // Twilio voices
        const twilioVoiceMap = {
            'en': 'alice',
            'ur': 'alice',
            'ar': 'alice',
            'es': 'alice',
            'fr': 'alice',
            'de': 'alice',
            'hi': 'alice',
            'zh': 'alice'
        };
        return twilioVoiceMap[language] || 'alice';
    }

    /**
     * Check if language is supported
     */
    static isLanguageSupported(language, supportedLanguages = ['en']) {
        return supportedLanguages.includes(language) || supportedLanguages.includes('*');
    }

    /**
     * Get greeting in specific language
     */
    static getGreeting(language, businessName = '') {
        const greetings = {
            'en': `Hello! Thank you for calling ${businessName}. How can I help you today?`,
            'ur': `السلام علیکم! ${businessName} پر کال کرنے کا شکریہ۔ میں آپ کی کس طرح مدد کر سکتا ہوں؟`,
            'ar': `مرحبا! شكرا لاتصالك بـ ${businessName}. كيف يمكنني مساعدتك اليوم؟`,
            'es': `¡Hola! Gracias por llamar a ${businessName}. ¿Cómo puedo ayudarte hoy?`,
            'fr': `Bonjour! Merci d'avoir appelé ${businessName}. Comment puis-je vous aider aujourd'hui?`
        };

        return greetings[language] || greetings['en'];
    }

    /**
     * Get "I didn't catch that" message in specific language
     */
    static getRepeatMessage(language) {
        const messages = {
            'en': "I didn't catch that. Could you please repeat?",
            'ur': 'میں نے یہ نہیں سنا۔ براہ کرم دوبارہ کہیں؟',
            'ar': 'لم أفهم ذلك. هل يمكنك التكرار من فضلك؟',
            'es': 'No entendí eso. ¿Podrías repetir por favor?',
            'fr': "Je n'ai pas compris. Pourriez-vous répéter s'il vous plaît?"
        };

        return messages[language] || messages['en'];
    }
}

module.exports = LanguageDetector;

