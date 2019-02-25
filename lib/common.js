const { userServices } = require('../api/services');

class CommonFunctions {

  async validateEmail(payload) {
    try {
      let query = {};
      if (payload.email) {
        query = {
          email: payload.email
        }
      } else if (payload.token) {
        query = {
          "resetPassword.token" :payload.token
        }
      }
      let users = await userServices.findUser(query);
      return users;
    } catch (err) {
      throw new Error(err);
    }

  }
}

module.exports = new CommonFunctions();