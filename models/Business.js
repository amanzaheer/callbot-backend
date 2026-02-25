/**
 * Business Model
 * Multi-tenant business configuration
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phone: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    required: true,
    // Examples: restaurant, clinic, real_estate, ecommerce, logistics, bank, salon, hotel, education, saas, support
    enum: [
      'restaurant',
      'clinic',
      'hospital',
      'real_estate',
      'ecommerce',
      'logistics',
      'courier',
      'bank',
      'fintech',
      'salon',
      'spa',
      'hotel',
      'travel',
      'education',
      'training',
      'saas',
      'support',
      'other'
    ],
    default: 'other'
  },

  // Business Details
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Voice Provider Selection
  voiceProvider: {
    type: String,
    enum: ['twilio', 'vonage', 'telnyx', 'test'],
    default: 'twilio'
  },

  // Twilio Configuration
  twilioPhoneNumber: String,
  twilioAccountSid: String,
  twilioAuthToken: String, // Encrypted in production

  // Vonage Configuration
  vonagePhoneNumber: String,
  vonageApiKey: String,
  vonageApiSecret: String,

  // Telnyx Configuration (Voice API - Call Control)
  telnyxPhoneNumber: String,
  telnyxApiKey: String,
  telnyxConnectionId: String,    // Voice API Application (Call Control) ID

  // AI Configuration
  aiSettings: {
    model: {
      type: String,
      default: 'gpt-4-turbo-preview'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 500
    },
    language: {
      type: String,
      default: 'en'
    },
    supportedLanguages: {
      type: [String],
      default: ['en']
    },
    voice: {
      type: String,
      default: 'alloy'
    }
  },

  // Conversation Settings
  conversationSettings: {
    greeting: String,
    closing: String,
    maxSilenceSeconds: {
      type: Number,
      default: 5
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    enableHumanTransfer: {
      type: Boolean,
      default: false
    },
    humanTransferPhone: String
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
businessSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
businessSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
businessSchema.index({ email: 1 });
businessSchema.index({ phone: 1 });
businessSchema.index({ businessType: 1 });
businessSchema.index({ isActive: 1 });

module.exports = mongoose.model('Business', businessSchema);

