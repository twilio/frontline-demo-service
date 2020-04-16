const twilio = require('twilio');
const config = require('../config');

const twilioWebhookMiddleware = twilio.webhook(config.twilio.auth_token);

module.exports = twilioWebhookMiddleware;
