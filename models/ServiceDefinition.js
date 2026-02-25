/**
 * ServiceDefinition Model
 * Dynamic service/product definitions for each business
 * Supports any business type through flexible schema
 */

const mongoose = require('mongoose');

// Field definition schema - supports any type of field
const fieldDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'time', 'datetime', 'email', 'phone', 'select', 'multiselect', 'boolean', 'address', 'textarea']
  },
  required: {
    type: Boolean,
    default: false
  },
  validation: {
    pattern: String, // Regex pattern
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    options: [String] // For select/multiselect
  },
  placeholder: String,
  helpText: String,
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const serviceDefinitionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  
  // Service Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: String, // e.g., "Appetizers", "Consultations", "Properties", "Products"
  
  // Workflow Type
  workflowType: {
    type: String,
    required: true,
    enum: ['order', 'booking', 'inquiry', 'lead', 'complaint', 'support', 'custom'],
    default: 'inquiry'
  },
  
  // Dynamic Fields - defines what data to collect
  fields: [fieldDefinitionSchema],
  
  // Pricing (optional)
  pricing: {
    basePrice: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    variablePricing: {
      type: Boolean,
      default: false
    },
    pricingRules: mongoose.Schema.Types.Mixed // Flexible pricing logic
  },
  
  // Availability
  availability: {
    enabled: {
      type: Boolean,
      default: true
    },
    schedule: mongoose.Schema.Types.Mixed, // Custom availability rules
    maxBookingsPerSlot: Number,
    advanceBookingDays: Number
  },
  
  // Business Rules
  rules: {
    requiresConfirmation: {
      type: Boolean,
      default: true
    },
    autoConfirm: {
      type: Boolean,
      default: false
    },
    allowModification: {
      type: Boolean,
      default: true
    },
    cancellationPolicy: String,
    customRules: mongoose.Schema.Types.Mixed
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
serviceDefinitionSchema.index({ businessId: 1, isActive: 1 });
serviceDefinitionSchema.index({ businessId: 1, workflowType: 1 });
serviceDefinitionSchema.index({ businessId: 1, category: 1 });

module.exports = mongoose.model('ServiceDefinition', serviceDefinitionSchema);

