/**
 * User Auth Routes - same as be-domain-primetime
 */

const express = require('express');
const router = express.Router();
const { validateBody } = require('../middlewares/validator');
const authSchemas = require('../joiSchema/authSchema');
const authController = require('../controllers/authController');

router.post('/login', validateBody(authSchemas.login), authController.login);
router.post('/refreshToken', validateBody(authSchemas.refreshToken), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/register', validateBody(authSchemas.register), authController.register);
router.post('/signup', validateBody(authSchemas.signup), authController.signup);

module.exports = router;
