const express = require('express');
const router = express.Router();
const {
  login,
  register
} = require('../controller/userController');

// Email/password-based authentication routes
router.post('/login', login);
router.post('/register', register);

module.exports = router;

