/**
 * User CRUD Routes - same as be-domain-primetime
 */

const express = require('express');
const router = express.Router();
const { validateBody, validateParams } = require('../middlewares/validator');
const userSchemas = require('../joiSchema/userSchema');
const userController = require('../controllers/userController');
const { authUserMiddleware } = require('../middlewares/authUserMiddleware');
const { checkPermission } = require('../middlewares/checkPermission');

router.use(authUserMiddleware);

router.post('/getAll', checkPermission('view_users'), userController.getAllUsers);
router.get('/get/:userId', checkPermission('view_users'), validateParams(userSchemas.userId), userController.getUserById);
router.put(
  '/update/:userId',
  checkPermission('manage_users'),
  validateParams(userSchemas.userId),
  validateBody(userSchemas.updateUser),
  userController.updateUser
);
router.delete(
  '/delete/:userId',
  checkPermission('manage_users'),
  validateParams(userSchemas.userId),
  userController.deleteUser
);
router.put(
  '/assign_role/:userId',
  checkPermission('manage_users'),
  validateParams(userSchemas.userId),
  validateBody(userSchemas.assignRole),
  userController.assignRole
);
router.put(
  '/change_password/:userId',
  validateParams(userSchemas.userId),
  validateBody(userSchemas.changePasswordSchema),
  userController.changePassword
);

router.post(
  '/myProfile/changePassword',
  validateBody(userSchemas.changePassword),
  userController.changeMyPassword
);
router.post('/myProfile/update', validateBody(userSchemas.updateProfile), userController.updateMyProfile);

router.patch('/settings', validateBody(userSchemas.updateSettings), userController.userSettings);

module.exports = router;
