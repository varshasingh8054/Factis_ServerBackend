const express = require('express');
const controller = require('./controller');
const validation = require('./validation');
const auth = require('../middleware');

module.exports = express
  .Router()
  .post('/register',validation.create, controller.create)
  .post('/login',validation.login, controller.login)
  .post('/changePassword',validation.changePassword,auth.verifyJWT_MW, controller.changePassword)
  .post('/forgotPassword',validation.forgotPassword,controller.forgotPassword)
  .post('/resetPassword',validation.resetPassword,controller.resetPassword)
  .post('/upload',controller.fileUpload);
