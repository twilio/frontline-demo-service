const config = require('../config');
const twilioClient = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);

module.exports = twilioClient;
