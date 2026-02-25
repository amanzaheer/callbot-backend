/**
 * Auth Routes (alias for business auth)
 */

const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');

router.post('/register', businessController.register.bind(businessController));
router.post('/login', businessController.login.bind(businessController));

module.exports = router;

