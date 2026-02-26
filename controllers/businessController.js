/**
 * Business Controller
 * Handles business configuration and management
 */

const Business = require('../models/Business');
const ServiceDefinition = require('../models/ServiceDefinition');
const FAQ = require('../models/FAQ');
const TrainingData = require('../models/TrainingData');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class BusinessController {
  /**
   * Register new business
   */
  async register(req, res) {
    try {
      const { name, email, password, phone, businessType } = req.body;

      // Check if business exists
      const existingBusiness = await Business.findOne({ email });
      if (existingBusiness) {
        return res.status(400).json({
          success: false,
          message: 'Business with this email already exists'
        });
      }

      // Create business
      const business = await Business.create({
        name,
        email,
        password,
        phone,
        businessType: businessType || 'other',
        twilioPhoneNumber: phone // Default, can be updated later
      });

      // Generate JWT token
      const token = jwt.sign(
        { businessId: business._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        business: {
          id: business._id,
          name: business.name,
          email: business.email,
          businessType: business.businessType
        }
      });
    } catch (error) {
      logger.error('Business registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register business'
      });
    }
  }

  /**
   * Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const business = await Business.findOne({ email }).select('+password');
      if (!business) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isMatch = await business.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { businessId: business._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        token,
        business: {
          id: business._id,
          name: business.name,
          email: business.email,
          businessType: business.businessType
        }
      });
    } catch (error) {
      logger.error('Business login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }

  /**
   * Get business profile
   */
  async getProfile(req, res) {
    try {
      const business = await Business.findById(req.businessId).select('-password');
      res.json({
        success: true,
        business
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  /**
   * Update business profile
   */
  async updateProfile(req, res) {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password update here
      delete updates.email; // Don't allow email update here

      const business = await Business.findByIdAndUpdate(
        req.businessId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        business
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Create service definition
   */
  async createService(req, res) {
    try {
      const service = await ServiceDefinition.create({
        businessId: req.businessId,
        ...req.body
      });

      res.status(201).json({
        success: true,
        service
      });
    } catch (error) {
      logger.error('Create service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create service'
      });
    }
  }

  /**
   * Get all services
   */
  async getServices(req, res) {
    try {
      const services = await ServiceDefinition.find({
        businessId: req.businessId,
        isActive: req.query.includeInactive !== 'true'
      }).sort({ order: 1, createdAt: -1 });

      res.json({
        success: true,
        services
      });
    } catch (error) {
      logger.error('Get services error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get services'
      });
    }
  }

  /**
   * Update service
   */
  async updateService(req, res) {
    try {
      const service = await ServiceDefinition.findOneAndUpdate(
        { _id: req.params.serviceId, businessId: req.businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        service
      });
    } catch (error) {
      logger.error('Update service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service'
      });
    }
  }

  /**
   * Delete service
   */
  async deleteService(req, res) {
    try {
      const service = await ServiceDefinition.findOneAndUpdate(
        { _id: req.params.serviceId, businessId: req.businessId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        message: 'Service deleted'
      });
    } catch (error) {
      logger.error('Delete service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete service'
      });
    }
  }

  /**
   * Create FAQ
   */
  async createFAQ(req, res) {
    try {
      const faq = await FAQ.create({
        businessId: req.businessId,
        ...req.body
      });

      res.status(201).json({
        success: true,
        faq
      });
    } catch (error) {
      logger.error('Create FAQ error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create FAQ'
      });
    }
  }

  /**
   * Get all FAQs
   */
  async getFAQs(req, res) {
    try {
      const faqs = await FAQ.find({
        businessId: req.businessId,
        isActive: req.query.includeInactive !== 'true'
      }).sort({ priority: -1, createdAt: -1 });

      res.json({
        success: true,
        faqs
      });
    } catch (error) {
      logger.error('Get FAQs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get FAQs'
      });
    }
  }

  /**
   * Update FAQ
   */
  async updateFAQ(req, res) {
    try {
      const faq = await FAQ.findOneAndUpdate(
        { _id: req.params.faqId, businessId: req.businessId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      res.json({
        success: true,
        faq
      });
    } catch (error) {
      logger.error('Update FAQ error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update FAQ'
      });
    }
  }

  /**
   * Delete FAQ
   */
  async deleteFAQ(req, res) {
    try {
      const faq = await FAQ.findOneAndUpdate(
        { _id: req.params.faqId, businessId: req.businessId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      res.json({
        success: true,
        message: 'FAQ deleted'
      });
    } catch (error) {
      logger.error('Delete FAQ error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete FAQ'
      });
    }
  }

  /**
   * Upload bulk training data
   */
  async uploadTrainingData(req, res) {
    try {
      const { trainingData } = req.body; // Array of training data objects

      if (!Array.isArray(trainingData) || trainingData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'trainingData must be a non-empty array'
        });
      }

      const hasUrdu = trainingData.some(item => (item.language || '').toLowerCase() === 'ur');
      if (hasUrdu && req.business) {
        const supported = req.business.aiSettings?.supportedLanguages || ['en'];
        if (!supported.includes('ur')) {
          await Business.findByIdAndUpdate(req.businessId, {
            $addToSet: { 'aiSettings.supportedLanguages': 'ur' }
          });
        }
      }

      const created = [];
      const errors = [];

      for (const item of trainingData) {
        try {
          const payload = { businessId: req.businessId, ...item };
          if (payload.language && typeof payload.language === 'string') {
            payload.language = payload.language.trim().toLowerCase();
            if (payload.language === 'ur' || payload.language === 'en') {
              // Explicitly allow Urdu and English
            }
          }
          const trainingItem = await TrainingData.create(payload);
          created.push(trainingItem);
        } catch (error) {
          errors.push({
            item,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        created: created.length,
        errors: errors.length,
        trainingData: created,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      logger.error('Upload training data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload training data'
      });
    }
  }

  /**
   * Get all training data
   */
  async getTrainingData(req, res) {
    try {
      const query = {
        businessId: req.businessId,
        isActive: req.query.includeInactive !== 'true'
      };

      if (req.query.type) {
        query.type = req.query.type;
      }

      if (req.query.category) {
        query.category = req.query.category;
      }

      const trainingData = await TrainingData.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .limit(parseInt(req.query.limit) || 100);

      res.json({
        success: true,
        count: trainingData.length,
        trainingData
      });
    } catch (error) {
      logger.error('Get training data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get training data'
      });
    }
  }

  /**
   * Delete training data
   */
  async deleteTrainingData(req, res) {
    try {
      const trainingData = await TrainingData.findOneAndUpdate(
        { _id: req.params.trainingDataId, businessId: req.businessId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!trainingData) {
        return res.status(404).json({
          success: false,
          message: 'Training data not found'
        });
      }

      res.json({
        success: true,
        message: 'Training data deleted'
      });
    } catch (error) {
      logger.error('Delete training data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete training data'
      });
    }
  }
}

module.exports = new BusinessController();

