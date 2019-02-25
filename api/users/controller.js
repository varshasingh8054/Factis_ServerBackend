const { userServices } = require('../services/index');
const jwtToken = require('../../lib/auth');
const { EMAIL ,USER_TYPE } = require('../../lib/constant');
const { SUCCESS_MESSAGE, ERROR_MESSAGE } = require('../../lib/message');
const commonFunctions = require('../../lib/common');
const emailProvider = require('../../lib/email-provider');
const logger = require('../../lib/logger');
const mongoose = require('mongoose').Types;
const customError = require('../../lib/custom-error');
const util = require('../../lib/util')


class Controller {

  async create(req, res, next) {    
    try {     
      let payload = req.body;
      let validateEmail = await commonFunctions.validateEmail(payload);
      if (validateEmail) {
        return next(new customError(ERROR_MESSAGE.EMAIL_EXIST));
      }
      let user = await userServices.createUser(payload);
      res.send({ status: 1, code: 200, message: SUCCESS_MESSAGE.SUCCESS, data: user });
    } catch (err) {
      res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
    }
  }

  async login(req, res,next) {
    try {
      let payload = req.body;
      let user = await commonFunctions.validateEmail(payload);
      if (user) {
        user.comparePassword(req.body.password, (err, isMatch) => {
          if (err) return res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
          if (!isMatch) return res.send({ status: 0, code: 404, message: ERROR_MESSAGE.INVALID_PWD });
          let { firstName, lastName, email, _id } = user;
          let token = jwtToken.createJWToken({
            sessionData: { firstName, lastName, email, _id },
            maxAge: 3600
          });
          logger.logResponse(req.id, res.statusCode, 200);
          res.send({ status: 1, code: 200, message: SUCCESS_MESSAGE.SUCCESS, token: token })
        });
      } else {
        next(new customError(ERROR_MESSAGE.INVALID_EMAIL));
      }
    } catch (err) {
      res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
    }
  }

  async changePassword(req, res) {
    console.log("req.user", req.user);
    if (req.user) {
      let payload = req.body;
      let { _id, email } = req.user;
      payload.email = email;
      let user = await commonFunctions.validateEmail(payload);
      user.comparePassword(payload.oldPassword, async function (err, isMatch) {
        if (err) return res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
        if (!isMatch) return res.send({ status: 0, code: 404, message: ERROR_MESSAGE.INVALID_OLD_PWD });
        try {
          user.password = payload.newPassword;
          let updatedUser = await userServices.saveUser(user);
          res.send({ status: 1, code: 200, message: SUCCESS_MESSAGE.SUCCESS, data: updatedUser });
        } catch (err) {
          res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
        }

      });
    } else {
      res.send({ status: 0, code: 404, message: ERROR_MESSAGE.INVALID_AUTH });
    }
  }

  async forgotPassword(req, res) {
    try {
      let payload = req.body;
      let user = await commonFunctions.validateEmail(payload);
      if (user) {      
        let otp = util.getOTP();
        let query = { email :payload.email};
        let updateObj = {verificationCode:otp}
        let updatedUser = await userServices.updateUser(query,updateObj,{new:true});
        user.otp = otp.token;
        let emailReply = await emailProvider.sendEmail(USER_TYPE.CUSTOMER, EMAIL.FORGOT_PWD.TYPE, user);
        res.send({ status: 1, code: 200, message: SUCCESS_MESSAGE.SUCCESS ,data:otp })
      } else {
        res.send({ status: 0, code: 404, message: ERROR_MESSAGE.INVALID_EMAIL });
      }
    } catch (err) {
      res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
    }
  }

  async resetPassword(req, res,next){
    try {
      let payload = req.body;
      let user = await commonFunctions.validateEmail(payload);
      if (user) {
        let OTP = payload.verificationCode.token;
        let userOTP = user.verificationCode.token;
        if(OTP !== userOTP){
          return next(new customError(ERROR_MESSAGE.INVALID_OTP));
        }
        let secret = payload.verificationCode.two_factor_temp_secret;      
        let validOTP = util.verifyOTP(userOTP,secret);
        if(!validOTP){
          return next(new customError(ERROR_MESSAGE.INVALID_OTP));
        }
        user.password = payload.password;
        await userServices.saveUser(user);
        res.send({ status: 1, code: 200, message: SUCCESS_MESSAGE.SUCCESS })
      } else {
        res.send({ status: 0, code: 404, message: ERROR_MESSAGE.INVALID_EMAIL });
      }
    } catch (err) {
      res.send({ status: 0, code: 404, message: ERROR_MESSAGE.ERROR, data: err.stack });
    }
  }

  async fileUpload(req, res) {
    var formidable = require('formidable');
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      res.send({ files: files });
    });
  }

  async userDetails() {

  }
}
module.exports = new Controller();
