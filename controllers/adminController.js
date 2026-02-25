/**
 * Admin Controller
 * Handles admin and management APIs
 */

const CallSession = require('../models/CallSession');
const ConversationMessage = require('../models/ConversationMessage');
const InteractionRecord = require('../models/InteractionRecord');
const CallRecording = require('../models/CallRecording');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

class AdminController {
  /**
   * Get all calls with filters
   */
  async getCalls(req, res) {
    try {
      const { businessId } = req;
      const {
        status,
        intent,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const query = { businessId };

      if (status) query.status = status;
      if (intent) query.detectedIntent = intent;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const calls = await CallSession.find(query)
        .populate('serviceId', 'name workflowType')
        .populate('customerId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await CallSession.countDocuments(query);

      res.json({
        success: true,
        calls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get calls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get calls'
      });
    }
  }

  /**
   * Get call details with transcript
   */
  async getCallDetails(req, res) {
    try {
      const { businessId } = req;
      const { callId } = req.params;

      const call = await CallSession.findOne({
        _id: callId,
        businessId
      })
        .populate('serviceId')
        .populate('customerId')
        .populate('interactionRecordId')
        .lean();

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      // Get conversation transcript
      const messages = await ConversationMessage.find({
        callSessionId: callId
      })
        .sort({ sequence: 1 })
        .lean();

      // Get recording if exists
      const recording = await CallRecording.findOne({
        callSessionId: callId
      }).lean();

      res.json({
        success: true,
        call: {
          ...call,
          transcript: messages,
          recording
        }
      });
    } catch (error) {
      logger.error('Get call details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call details'
      });
    }
  }

  /**
   * Get interaction records
   */
  async getInteractions(req, res) {
    try {
      const { businessId } = req;
      const {
        recordType,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const query = { businessId };

      if (recordType) query.recordType = recordType;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const interactions = await InteractionRecord.find(query)
        .populate('callSessionId', 'from to status duration')
        .populate('serviceId', 'name workflowType')
        .populate('customerId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await InteractionRecord.countDocuments(query);

      res.json({
        success: true,
        interactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get interactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get interactions'
      });
    }
  }

  /**
   * Get customers
   */
  async getCustomers(req, res) {
    try {
      const { businessId } = req;
      const { page = 1, limit = 20, search } = req.query;

      const query = { businessId };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const customers = await Customer.find(query)
        .sort({ lastInteractionAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Customer.countDocuments(query);

      res.json({
        success: true,
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get customers'
      });
    }
  }

  /**
   * Get analytics/dashboard data
   */
  async getAnalytics(req, res) {
    try {
      const { businessId } = req;
      const { startDate, endDate } = req.query;

      const dateQuery = {};
      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      // Call statistics
      const totalCalls = await CallSession.countDocuments({ businessId, ...dateQuery });
      const completedCalls = await CallSession.countDocuments({
        businessId,
        status: 'completed',
        ...dateQuery
      });
      const avgDuration = await CallSession.aggregate([
        { $match: { businessId, status: 'completed', ...dateQuery } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]);

      // Intent distribution
      const intentDistribution = await CallSession.aggregate([
        { $match: { businessId, detectedIntent: { $exists: true }, ...dateQuery } },
        { $group: { _id: '$detectedIntent', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Interaction statistics
      const totalInteractions = await InteractionRecord.countDocuments({ businessId, ...dateQuery });
      const confirmedInteractions = await InteractionRecord.countDocuments({
        businessId,
        status: 'confirmed',
        ...dateQuery
      });

      // Record type distribution
      const recordTypeDistribution = await InteractionRecord.aggregate([
        { $match: { businessId, ...dateQuery } },
        { $group: { _id: '$recordType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        analytics: {
          calls: {
            total: totalCalls,
            completed: completedCalls,
            completionRate: totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(2) : 0,
            avgDuration: avgDuration[0]?.avgDuration || 0
          },
          intents: intentDistribution,
          interactions: {
            total: totalInteractions,
            confirmed: confirmedInteractions,
            confirmationRate: totalInteractions > 0 ? (confirmedInteractions / totalInteractions * 100).toFixed(2) : 0
          },
          recordTypes: recordTypeDistribution
        }
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics'
      });
    }
  }

  /**
   * Export data (simplified - returns JSON)
   */
  async exportData(req, res) {
    try {
      const { businessId } = req;
      const { type, startDate, endDate } = req.query;

      const dateQuery = {};
      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      let data = [];

      switch (type) {
        case 'calls':
          data = await CallSession.find({ businessId, ...dateQuery })
            .populate('serviceId', 'name')
            .populate('customerId', 'name phone')
            .lean();
          break;

        case 'interactions':
          data = await InteractionRecord.find({ businessId, ...dateQuery })
            .populate('callSessionId', 'from to')
            .populate('serviceId', 'name')
            .populate('customerId', 'name phone')
            .lean();
          break;

        case 'customers':
          data = await Customer.find({ businessId, ...dateQuery }).lean();
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${Date.now()}.json`);
      res.json(data);
    } catch (error) {
      logger.error('Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  }
}

module.exports = new AdminController();

