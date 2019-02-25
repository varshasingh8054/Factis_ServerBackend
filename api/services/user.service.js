const Models = require('../models');

class UserService {

    async saveUser(user) {
        return await user.save();
    }

    async createUser(document) {
        return await Models.users.create(document);
    }

    findUser(query, projections) {
        return Models.users.findOne(query, projections).exec();
    }

    updateUser(query, updateObj, options) {
        return Models.users.update(query, updateObj, options).exec();
    }
}

module.exports = new UserService();
