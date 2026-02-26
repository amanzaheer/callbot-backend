/**
 * OpenAI Service
 * Handles LLM, STT (Whisper), and TTS interactions
 */

const OpenAI = require('openai');
const TrainingData = require('../../models/TrainingData');
const logger = require('../../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Speech-to-Text using Whisper
   */
  async transcribeAudio(audioBuffer, language = 'en') {
    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: language,
        response_format: 'json'
      });

      return transcription.text;
    } catch (error) {
      logger.error('OpenAI transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Text-to-Speech
   */
  async synthesizeSpeech(text, voice = 'alloy', model = 'tts-1') {
    try {
      const mp3 = await this.client.audio.speech.create({
        model: model,
        voice: voice,
        input: text,
        response_format: 'mp3'
      });

      return mp3;
    } catch (error) {
      logger.error('OpenAI TTS error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Generate AI response for conversation
   */
  async generateResponse(messages, systemPrompt, options = {}) {
    try {
      const {
        model = 'gpt-4.1-mini',
        temperature = 0.7,
        maxTokens = 500,
        jsonMode = false
      } = options;

      const requestOptions = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: temperature,
        max_tokens: maxTokens
      };

      // Only use JSON mode if explicitly requested
      if (jsonMode) {
        requestOptions.response_format = { type: 'json_object' };
      }

      const response = await this.client.chat.completions.create(requestOptions);

      const content = response.choices[0].message.content;
      
      if (jsonMode) {
        try {
          return JSON.parse(content);
        } catch (e) {
          logger.warn('Failed to parse JSON response:', e);
          return { text: content };
        }
      }
      
      return { text: content };
    } catch (error) {
      logger.error('OpenAI chat completion error:', error);
      // Keep status/code so call controller can show quota message
      const status = error.status ?? error.response?.status;
      const code = error.code ?? error.response?.data?.error?.code;
      const msg = error.message || 'Failed to generate AI response';
      const e = new Error(msg);
      e.status = status;
      e.code = code;
      e.cause = error;
      throw e;
    }
  }

  /**
   * Analyze user input for intent and entities
   */
  async analyzeInput(userInput, businessContext, serviceDefinitions, faqs, businessId = null, detectedLanguage = 'en', trainingData = []) {
    try {
      const systemPrompt = this.buildAnalysisPrompt(businessContext, serviceDefinitions, faqs, trainingData, detectedLanguage);
      
      const messages = [
        {
          role: 'user',
          content: `Analyze this user input: "${userInput}"`
        }
      ];

      const response = await this.generateResponse(messages, systemPrompt, {
        model: 'gpt-4.1-mini',
        temperature: 0.3,
        maxTokens: 300,
        jsonMode: true
      });

      return response;
    } catch (error) {
      logger.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for intent/entity analysis
   */
  buildAnalysisPrompt(businessContext, serviceDefinitions, faqs, trainingData = [], detectedLanguage = 'en') {
    const languageInstructions = detectedLanguage === 'ur' 
      ? '\n\nIMPORTANT: The user is speaking in Urdu. You must respond in Urdu (Urdu script). All your responses should be in Urdu.'
      : detectedLanguage !== 'en'
      ? `\n\nIMPORTANT: The user is speaking in ${detectedLanguage}. You must respond in ${detectedLanguage}.`
      : '';

    let prompt = `You are an AI assistant analyzing customer phone call input for a ${businessContext.businessType} business called "${businessContext.name}".${languageInstructions}

Your task is to analyze the user's input and return a JSON object with:
{
  "intent": "order|booking|inquiry|lead|complaint|support|faq|other",
  "confidence": 0.0-1.0,
  "entities": {
    "serviceName": "...",
    "quantity": number,
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "name": "...",
    "phone": "...",
    "email": "...",
    "address": "...",
    ...any other relevant fields
  },
  "detectedFields": {
    "fieldName": "extractedValue",
    ...
  },
  "missingFields": ["field1", "field2", ...],
  "suggestedResponse": "natural language response to continue conversation"
}

Available Services:
${JSON.stringify(serviceDefinitions, null, 2)}

FAQs:
${JSON.stringify(faqs, null, 2)}`;

    // Add training data if available
    if (trainingData && trainingData.length > 0) {
      prompt += `\n\nTraining Data & Examples:\n`;
      
      const conversations = trainingData.filter(t => t.type === 'conversation');
      const qas = trainingData.filter(t => t.type === 'qa');
      const examples = trainingData.filter(t => t.type === 'example');
      const contexts = trainingData.filter(t => t.type === 'context');
      const instructions = trainingData.filter(t => t.type === 'instruction');

      if (conversations.length > 0) {
        prompt += `\nConversation Examples:\n`;
        conversations.forEach(c => {
          if (c.conversation) {
            prompt += `User: ${c.conversation.user}\nAssistant: ${c.conversation.assistant}\n\n`;
          }
        });
      }

      if (qas.length > 0) {
        prompt += `\nQ&A Examples:\n`;
        qas.forEach(qa => {
          prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
        });
      }

      if (examples.length > 0) {
        prompt += `\nExample Scenarios:\n`;
        examples.forEach(ex => {
          if (ex.example) {
            prompt += `Scenario: ${ex.example.scenario}\nInput: ${ex.example.input}\nOutput: ${ex.example.output}\n\n`;
          }
        });
      }

      if (contexts.length > 0) {
        prompt += `\nBusiness Context:\n`;
        contexts.forEach(ctx => {
          if (ctx.context) {
            prompt += `${ctx.context.title}: ${ctx.context.content}\n`;
          }
        });
        prompt += `\n`;
      }

      if (instructions.length > 0) {
        prompt += `\nSpecial Instructions:\n`;
        instructions.forEach(inst => {
          if (inst.instruction) {
            prompt += `${inst.instruction.title}: ${inst.instruction.content}\n`;
          }
        });
        prompt += `\n`;
      }
    }

    prompt += `\nReturn ONLY valid JSON, no additional text.`;

    return prompt;
  }

  /**
   * Generate conversation response
   */
  async generateConversationResponse(conversationHistory, callState, businessContext, serviceDefinition, collectedData, missingFields, businessId = null, detectedLanguage = 'en', trainingData = []) {
    try {
      const systemPrompt = this.buildConversationPrompt(businessContext, serviceDefinition, callState, collectedData, missingFields, trainingData, detectedLanguage);
      
      const messages = conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await this.generateResponse(messages, systemPrompt, {
        model: businessContext.aiSettings?.model || 'gpt-4-turbo-preview',
        temperature: businessContext.aiSettings?.temperature || 0.7,
        maxTokens: businessContext.aiSettings?.maxTokens || 500,
        jsonMode: true
      });

      return response;
    } catch (error) {
      logger.error('OpenAI conversation generation error:', error);
      throw error;
    }
  }

  /**
   * Build conversation system prompt
   */
  buildConversationPrompt(businessContext, serviceDefinition, callState, collectedData, missingFields, trainingData = [], detectedLanguage = 'en') {
    const languageInstructions = detectedLanguage === 'ur'
      ? '\n\nCRITICAL: The user is speaking in Urdu. You MUST respond in Urdu (Urdu script: اردو). All your responses, questions, and confirmations must be in Urdu.'
      : detectedLanguage !== 'en'
      ? `\n\nCRITICAL: The user is speaking in ${detectedLanguage}. You MUST respond in ${detectedLanguage}. All your responses must be in ${detectedLanguage}.`
      : '';

    let prompt = `You are a friendly, professional AI voice assistant for ${businessContext.name}, a ${businessContext.businessType} business.${languageInstructions}

Current conversation state: ${callState}
${businessContext.conversationSettings?.greeting ? `Greeting: ${businessContext.conversationSettings.greeting}` : ''}

${serviceDefinition ? `
Current Service: ${serviceDefinition.name}
Description: ${serviceDefinition.description}
Workflow Type: ${serviceDefinition.workflowType}
Required Fields: ${JSON.stringify(serviceDefinition.fields.filter(f => f.required).map(f => f.name))}
` : ''}

Collected Data So Far:
${JSON.stringify(collectedData, null, 2)}

${missingFields.length > 0 ? `
Missing Required Fields: ${JSON.stringify(missingFields)}
Your next response should ask for these missing fields in a natural, conversational way.
` : ''}

${callState === 'confirming' ? `
You are now confirming the order/booking. Summarize all collected information clearly and ask for confirmation.
` : ''}`;

    // Add training data if available
    if (trainingData && trainingData.length > 0) {
      prompt += `\n\nTraining Data & Examples:\n`;
      
      const conversations = trainingData.filter(t => t.type === 'conversation');
      const qas = trainingData.filter(t => t.type === 'qa');
      const examples = trainingData.filter(t => t.type === 'example');
      const contexts = trainingData.filter(t => t.type === 'context');
      const instructions = trainingData.filter(t => t.type === 'instruction');

      if (conversations.length > 0) {
        prompt += `\nConversation Examples (follow similar style):\n`;
        conversations.slice(0, 5).forEach(c => {
          if (c.conversation) {
            prompt += `User: ${c.conversation.user}\nAssistant: ${c.conversation.assistant}\n\n`;
          }
        });
      }

      if (qas.length > 0) {
        prompt += `\nQ&A Reference:\n`;
        qas.slice(0, 5).forEach(qa => {
          prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
        });
      }

      if (examples.length > 0) {
        prompt += `\nExample Scenarios:\n`;
        examples.slice(0, 3).forEach(ex => {
          if (ex.example) {
            prompt += `Scenario: ${ex.example.scenario}\nExpected Response: ${ex.example.output}\n\n`;
          }
        });
      }

      if (contexts.length > 0) {
        prompt += `\nBusiness Context:\n`;
        contexts.forEach(ctx => {
          if (ctx.context) {
            prompt += `${ctx.context.title}: ${ctx.context.content}\n`;
          }
        });
        prompt += `\n`;
      }

      if (instructions.length > 0) {
        prompt += `\nSpecial Instructions:\n`;
        instructions.forEach(inst => {
          if (inst.instruction) {
            prompt += `${inst.instruction.title}: ${inst.instruction.content}\n`;
          }
        });
        prompt += `\n`;
      }
    }

    prompt += `\nGuidelines:
- Be concise (phone conversations should be brief)
- Speak naturally, as if talking to a friend
- Ask one question at a time
- If the user's input is unclear, politely ask for clarification
- ${businessContext.conversationSettings?.closing ? `End with: ${businessContext.conversationSettings.closing}` : ''}

Return a JSON object:
{
  "text": "your natural language response",
  "intent": "detected intent",
  "entities": {...},
  "nextState": "greeting|collecting-intent|collecting-data|confirming|completed"
}`;

    return prompt;
  }
}

module.exports = new OpenAIService();

