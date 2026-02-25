/**
 * Workflow Engine
 * Handles dynamic service workflows and data collection
 */

const ServiceDefinition = require('../../models/ServiceDefinition');
const InteractionRecord = require('../../models/InteractionRecord');
const logger = require('../../utils/logger');

class WorkflowEngine {
  /**
   * Get service definition by ID
   */
  async getServiceDefinition(serviceId) {
    try {
      const service = await ServiceDefinition.findById(serviceId);
      return service;
    } catch (error) {
      logger.error('Get service definition error:', error);
      throw error;
    }
  }

  /**
   * Validate collected data against service fields
   */
  validateCollectedData(serviceDefinition, collectedData) {
    const missingFields = [];
    const validationErrors = [];

    if (!serviceDefinition || !serviceDefinition.fields) {
      return { valid: true, missingFields: [], errors: [] };
    }

    for (const field of serviceDefinition.fields) {
      if (field.required) {
        const value = collectedData[field.name];
        
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(field.name);
          continue;
        }

        // Validate field type
        const validation = this.validateField(field, value);
        if (!validation.valid) {
          validationErrors.push({
            field: field.name,
            message: validation.message
          });
        }
      }
    }

    return {
      valid: missingFields.length === 0 && validationErrors.length === 0,
      missingFields,
      errors: validationErrors
    };
  }

  /**
   * Validate a single field
   */
  validateField(field, value) {
    if (!field.validation) {
      return { valid: true };
    }

    const validation = field.validation;

    // Type validation
    switch (field.type) {
      case 'number':
        if (isNaN(value)) {
          return { valid: false, message: `${field.label} must be a number` };
        }
        const numValue = parseFloat(value);
        if (validation.min !== undefined && numValue < validation.min) {
          return { valid: false, message: `${field.label} must be at least ${validation.min}` };
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return { valid: false, message: `${field.label} must be at most ${validation.max}` };
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, message: `${field.label} must be a valid email` };
        }
        break;

      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          return { valid: false, message: `${field.label} must be a valid phone number` };
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { valid: false, message: `${field.label} must be a valid date` };
        }
        break;

      case 'select':
      case 'multiselect':
        if (validation.options && !validation.options.includes(value)) {
          return { valid: false, message: `${field.label} must be one of: ${validation.options.join(', ')}` };
        }
        break;
    }

    // Pattern validation
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { valid: false, message: `${field.label} format is invalid` };
      }
    }

    // Length validation
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return { valid: false, message: `${field.label} must be at least ${validation.minLength} characters` };
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return { valid: false, message: `${field.label} must be at most ${validation.maxLength} characters` };
      }
    }

    return { valid: true };
  }

  /**
   * Calculate pricing (if applicable)
   */
  calculatePricing(serviceDefinition, collectedData) {
    if (!serviceDefinition.pricing) {
      return null;
    }

    let subtotal = serviceDefinition.pricing.basePrice || 0;
    const currency = serviceDefinition.pricing.currency || 'USD';

    // Apply variable pricing rules if defined
    if (serviceDefinition.pricing.variablePricing && serviceDefinition.pricing.pricingRules) {
      // This is a simplified example - in production, you'd have more complex pricing logic
      const rules = serviceDefinition.pricing.pricingRules;
      
      // Example: quantity-based pricing
      if (rules.quantityMultiplier && collectedData.quantity) {
        subtotal = subtotal * collectedData.quantity;
      }

      // Example: field-based pricing
      if (rules.fieldBasedPricing) {
        for (const [fieldName, price] of Object.entries(rules.fieldBasedPricing)) {
          if (collectedData[fieldName]) {
            subtotal += price;
          }
        }
      }
    }

    // Calculate tax (simplified - in production, use proper tax calculation)
    const taxRate = 0.1; // 10% example
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      discount: 0,
      total,
      currency
    };
  }

  /**
   * Create interaction record
   */
  async createInteractionRecord(callSessionId, serviceDefinition, collectedData, pricing, status = 'pending') {
    try {
      const callSession = await require('../../models/CallSession').findById(callSessionId);
      if (!callSession) {
        throw new Error('Call session not found');
      }

      const interactionRecord = await InteractionRecord.create({
        businessId: callSession.businessId,
        callSessionId,
        serviceId: serviceDefinition?._id,
        customerId: callSession.customerId,
        recordType: serviceDefinition?.workflowType || 'inquiry',
        status,
        data: collectedData,
        pricing,
        confirmedAt: status === 'confirmed' ? new Date() : null,
        confirmedBy: status === 'confirmed' ? 'customer' : null
      });

      // Link to call session
      await require('../../models/CallSession').findByIdAndUpdate(callSessionId, {
        interactionRecordId: interactionRecord._id
      });

      return interactionRecord;
    } catch (error) {
      logger.error('Create interaction record error:', error);
      throw error;
    }
  }

  /**
   * Get next missing field to ask for
   */
  getNextFieldToCollect(serviceDefinition, collectedData, missingFields) {
    if (!serviceDefinition || !serviceDefinition.fields || missingFields.length === 0) {
      return null;
    }

    // Get the first missing field ordered by field.order
    const missingFieldNames = new Set(missingFields);
    const orderedFields = serviceDefinition.fields
      .filter(f => missingFieldNames.has(f.name))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return orderedFields.length > 0 ? orderedFields[0] : null;
  }

  /**
   * Format collected data summary for confirmation
   */
  formatDataSummary(serviceDefinition, collectedData) {
    if (!serviceDefinition || !serviceDefinition.fields) {
      return JSON.stringify(collectedData, null, 2);
    }

    const summary = [];
    for (const field of serviceDefinition.fields) {
      if (collectedData[field.name]) {
        summary.push(`${field.label}: ${collectedData[field.name]}`);
      }
    }

    return summary.join('\n');
  }
}

module.exports = new WorkflowEngine();

