/**
 * Conversation Orchestrator
 * Main engine that coordinates AI, workflow, and call handling
 */

const openaiService = require('../ai/openaiService');
const workflowEngine = require('../workflow/workflowEngine');
const callSessionService = require('../call/callSessionService');
const Business = require('../../models/Business');
const ServiceDefinition = require('../../models/ServiceDefinition');
const FAQ = require('../../models/FAQ');
const TrainingData = require('../../models/TrainingData');
const LanguageDetector = require('../../utils/languageDetector');
const logger = require('../../utils/logger');

class ConversationOrchestrator {
  /**
   * Process incoming user input and generate response
   */
  async processUserInput(callSessionId, userInput) {
    try {
      // Get call session with all related data
      const callSession = await callSessionService.getCallSession(callSessionId);
      if (!callSession) {
        throw new Error('Call session not found');
      }

      // Get business configuration
      const business = await Business.findById(callSession.businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Detect language from user input
      let detectedLanguage = LanguageDetector.detectLanguage(userInput);
      
      // Check if language is supported
      const supportedLanguages = business.aiSettings?.supportedLanguages || ['en'];
      if (!LanguageDetector.isLanguageSupported(detectedLanguage, supportedLanguages)) {
        detectedLanguage = supportedLanguages[0] || 'en';
      }

      // Update call session with detected language (if not already set or changed)
      if (!callSession.detectedLanguage || callSession.detectedLanguage !== detectedLanguage) {
        await callSessionService.updateCallStatus(callSessionId, callSession.status, {
          detectedLanguage: detectedLanguage
        });
        callSession.detectedLanguage = detectedLanguage;
      }

      // Add user message to conversation
      await callSessionService.addMessage(callSessionId, 'user', userInput);

      // Get service definition if selected
      let serviceDefinition = null;
      if (callSession.serviceId) {
        serviceDefinition = await workflowEngine.getServiceDefinition(callSession.serviceId);
      }

      // Get FAQs for context (filter by language if available)
      const faqQuery = {
        businessId: business._id,
        isActive: true
      };
      // Note: FAQ model doesn't have language field yet, but we can add it later
      const faqs = await FAQ.find(faqQuery).limit(10).lean();

      // Get conversation history
      const conversationHistory = await callSessionService.getConversationHistory(callSessionId);

      // Determine next action based on call state
      let response;
      let nextState = callSession.callState;

      switch (callSession.callState) {
        case 'greeting':
          response = await this.handleGreeting(business, conversationHistory);
          nextState = 'collecting-intent';
          break;

        case 'collecting-intent':
          response = await this.handleIntentCollection(
            userInput,
            business,
            serviceDefinition,
            faqs,
            conversationHistory,
            callSession
          );
          
          // If intent detected and service selected, move to data collection
          if (response.intent && response.serviceId) {
            nextState = 'collecting-data';
            await callSessionService.updateCallState(callSessionId, nextState, {
              detectedIntent: response.intent,
              serviceId: response.serviceId
            });
          }
          break;

        case 'collecting-data':
          response = await this.handleDataCollection(
            userInput,
            callSession,
            business,
            serviceDefinition,
            conversationHistory
          );
          
          // Check if all required fields collected
          const validation = workflowEngine.validateCollectedData(
            serviceDefinition,
            callSession.collectedData
          );
          
          if (validation.valid) {
            nextState = 'confirming';
            await callSessionService.updateCallState(callSessionId, nextState);
          } else {
            await callSessionService.updateMissingFields(callSessionId, validation.missingFields);
          }
          break;

        case 'confirming':
          response = await this.handleConfirmation(
            userInput,
            callSession,
            business,
            serviceDefinition,
            conversationHistory
          );
          
          if (response.confirmed) {
            nextState = 'completed';
            await this.finalizeInteraction(callSessionId, serviceDefinition);
          } else if (response.rejected) {
            nextState = 'collecting-data';
            await callSessionService.updateCallState(callSessionId, nextState);
          }
          break;

        default:
          response = { text: "I'm sorry, I didn't understand. Could you please repeat?" };
      }

      // Update call state if changed
      if (nextState !== callSession.callState) {
        await callSessionService.updateCallState(callSessionId, nextState);
      }

      // Add assistant response to conversation
      await callSessionService.addMessage(
        callSessionId,
        'assistant',
        response.text,
        response.aiAnalysis
      );

      return {
        text: response.text,
        nextState,
        callState: nextState,
        missingFields: callSession.missingFields || []
      };
    } catch (error) {
      logger.error('Process user input error:', error);
      await callSessionService.recordError(callSessionId, error.message);
      throw error;
    }
  }

  /**
   * Handle greeting phase
   */
  async handleGreeting(business, conversationHistory) {
    const greeting = business.conversationSettings?.greeting || 
      `Hello! Thank you for calling ${business.name}. How can I help you today?`;

    return {
      text: greeting,
      aiAnalysis: { intent: null }
    };
  }

  /**
   * Handle intent collection phase
   */
  async handleIntentCollection(userInput, business, currentService, faqs, conversationHistory, callSession = null) {
    const detectedLanguage = callSession?.detectedLanguage || business.aiSettings?.language || 'en';
    // Get all active services for this business
    const services = await ServiceDefinition.find({
      businessId: business._id,
      isActive: true
    }).lean();

      // Get training data filtered by detected language
      let trainingData = [];
      if (business._id) {
        const trainingQuery = {
          businessId: business._id,
          isActive: true,
          $or: [
            { language: detectedLanguage },
            { language: 'en' }, // Always include English as fallback
            { language: { $exists: false } } // Include old data without language
          ]
        };
        trainingData = await TrainingData.find(trainingQuery)
          .sort({ priority: -1 })
          .limit(20)
          .lean();
      }

      // Analyze user input
      const analysis = await openaiService.analyzeInput(
        userInput,
        {
          name: business.name,
          businessType: business.businessType
        },
        services,
        faqs,
        business._id,
        detectedLanguage,
        trainingData
      );

    // Determine if FAQ match
    if (analysis.intent === 'faq') {
      const matchedFAQ = faqs.find(faq => 
        faq.question.toLowerCase().includes(userInput.toLowerCase()) ||
        userInput.toLowerCase().includes(faq.question.toLowerCase())
      );

      if (matchedFAQ) {
        return {
          text: matchedFAQ.answer,
          intent: 'faq',
          aiAnalysis: analysis
        };
      }
    }

    // Match service if intent detected
    let serviceId = null;
    if (analysis.entities?.serviceName) {
      const matchedService = services.find(s => 
        s.name.toLowerCase().includes(analysis.entities.serviceName.toLowerCase()) ||
        analysis.entities.serviceName.toLowerCase().includes(s.name.toLowerCase())
      );
      
      if (matchedService) {
        serviceId = matchedService._id;
      }
    }

      // Generate response with language context
      const response = await openaiService.generateConversationResponse(
        conversationHistory,
        'collecting-intent',
        business,
        currentService,
        {},
        [],
        business._id,
        detectedLanguage,
        trainingData
      );

    return {
      text: response.text || analysis.suggestedResponse || "I understand. Let me help you with that.",
      intent: analysis.intent,
      serviceId,
      aiAnalysis: analysis
    };
  }

  /**
   * Handle data collection phase
   */
  async handleDataCollection(userInput, callSession, business, serviceDefinition, conversationHistory) {
    if (!serviceDefinition) {
      return {
        text: "I'm sorry, I need more information. What service are you interested in?",
        aiAnalysis: {}
      };
    }

    // Get training data for detected language
    const detectedLanguage = callSession.detectedLanguage || 'en';
    let trainingData = [];
    if (business._id) {
      const trainingQuery = {
        businessId: business._id,
        isActive: true,
        $or: [
          { language: detectedLanguage },
          { language: 'en' },
          { language: { $exists: false } }
        ]
      };
      trainingData = await TrainingData.find(trainingQuery)
        .sort({ priority: -1 })
        .limit(20)
        .lean();
    }

    // Analyze user input for field extraction
    const analysis = await openaiService.analyzeInput(
      userInput,
      {
        name: business.name,
        businessType: business.businessType
      },
      [serviceDefinition],
      [],
      business._id,
      detectedLanguage,
      trainingData
    );

    // Extract detected fields
    const detectedFields = analysis.detectedFields || {};
    const entities = analysis.entities || {};

    // Update collected data
    const updatedData = {
      ...callSession.collectedData,
      ...detectedFields
    };

    // Map common entities to fields
    if (entities.name && !updatedData.name) updatedData.name = entities.name;
    if (entities.phone && !updatedData.phone) updatedData.phone = entities.phone;
    if (entities.email && !updatedData.email) updatedData.email = entities.email;
    if (entities.date && !updatedData.date) updatedData.date = entities.date;
    if (entities.time && !updatedData.time) updatedData.time = entities.time;
    if (entities.quantity && !updatedData.quantity) updatedData.quantity = entities.quantity;
    if (entities.address && !updatedData.address) updatedData.address = entities.address;

    await callSessionService.updateCollectedData(callSession._id, updatedData);

    // Validate and get missing fields
    const validation = workflowEngine.validateCollectedData(serviceDefinition, updatedData);
    const missingFields = validation.missingFields;

    // Get next field to ask for
    const nextField = workflowEngine.getNextFieldToCollect(serviceDefinition, updatedData, missingFields);

    // Generate response with language context (reuse detectedLanguage and trainingData from above)
    const response = await openaiService.generateConversationResponse(
      conversationHistory,
      'collecting-data',
      business,
      serviceDefinition,
      updatedData,
      missingFields,
      business._id,
      detectedLanguage,
      trainingData
    );

    return {
      text: response.text,
      aiAnalysis: analysis,
      missingFields
    };
  }

  /**
   * Handle confirmation phase
   */
  async handleConfirmation(userInput, callSession, business, serviceDefinition, conversationHistory) {
    // Check if user confirmed or rejected
    const lowerInput = userInput.toLowerCase();
    const confirmed = lowerInput.includes('yes') || 
                     lowerInput.includes('correct') || 
                     lowerInput.includes('confirm') ||
                     lowerInput.includes('that\'s right');
    
    const rejected = lowerInput.includes('no') || 
                    lowerInput.includes('wrong') || 
                    lowerInput.includes('change') ||
                    lowerInput.includes('modify');

    if (confirmed) {
      return {
        text: business.conversationSettings?.closing || 
          "Perfect! Your request has been confirmed. Is there anything else I can help you with?",
        confirmed: true,
        aiAnalysis: {}
      };
    } else if (rejected) {
      return {
        text: "No problem! Let me help you make changes. What would you like to update?",
        rejected: true,
        aiAnalysis: {}
      };
    } else {
      // Generate confirmation summary
      const summary = workflowEngine.formatDataSummary(serviceDefinition, callSession.collectedData);
      const pricing = workflowEngine.calculatePricing(serviceDefinition, callSession.collectedData);

      let confirmationText = `Let me confirm the details:\n\n${summary}`;
      if (pricing) {
        confirmationText += `\n\nTotal: ${pricing.currency} ${pricing.total.toFixed(2)}`;
      }
      confirmationText += "\n\nIs this correct?";

      return {
        text: confirmationText,
        confirmed: false,
        rejected: false,
        aiAnalysis: {}
      };
    }
  }

  /**
   * Finalize interaction - create record
   */
  async finalizeInteraction(callSessionId, serviceDefinition) {
    try {
      const callSession = await callSessionService.getCallSession(callSessionId);
      
      if (!callSession) {
        throw new Error('Call session not found');
      }

      // Calculate pricing
      const pricing = serviceDefinition ? 
        workflowEngine.calculatePricing(serviceDefinition, callSession.collectedData) : 
        null;

      // Create interaction record
      const interactionRecord = await workflowEngine.createInteractionRecord(
        callSessionId,
        serviceDefinition,
        callSession.collectedData,
        pricing,
        'confirmed'
      );

      // Update call session
      await callSessionService.updateCallState(callSessionId, 'completed', {
        interactionRecordId: interactionRecord._id,
        confirmationStatus: 'confirmed'
      });

      // Update customer stats
      if (callSession.customerId) {
        await require('../../models/Customer').findByIdAndUpdate(callSession.customerId, {
          $inc: { totalInteractions: 1 }
        });
      }

      return interactionRecord;
    } catch (error) {
      logger.error('Finalize interaction error:', error);
      throw error;
    }
  }
}

module.exports = new ConversationOrchestrator();

