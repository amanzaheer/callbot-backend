/**
 * Business Routes
 */

const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/register', businessController.register.bind(businessController));
router.post('/login', businessController.login.bind(businessController));

// Protected routes
router.use(authenticate);

router.get('/profile', businessController.getProfile.bind(businessController));
router.put('/profile', businessController.updateProfile.bind(businessController));

// Service routes
router.post('/services', businessController.createService.bind(businessController));
router.get('/services', businessController.getServices.bind(businessController));
router.put('/services/:serviceId', businessController.updateService.bind(businessController));
router.delete('/services/:serviceId', businessController.deleteService.bind(businessController));

// FAQ routes
router.post('/faqs', businessController.createFAQ.bind(businessController));
router.get('/faqs', businessController.getFAQs.bind(businessController));
router.put('/faqs/:faqId', businessController.updateFAQ.bind(businessController));
router.delete('/faqs/:faqId', businessController.deleteFAQ.bind(businessController));

// Training Data routes
router.post('/training-data', businessController.uploadTrainingData.bind(businessController));
router.get('/training-data', businessController.getTrainingData.bind(businessController));
router.delete('/training-data/:trainingDataId', businessController.deleteTrainingData.bind(businessController));

module.exports = router;

