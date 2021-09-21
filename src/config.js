require('dotenv').config();

const _ = (varName, defaults) => process.env[varName] || defaults || null;

const port = _('PORT', 5000);

module.exports = {
    port: port,
    twilio: {
        account_sid: _('TWILIO_ACCOUNT_SID'),
        auth_token: _('TWILIO_AUTH_TOKEN'),
        sms_number: _('TWILIO_SMS_NUMBER'),
        whatsapp_number: _('TWILIO_WHATSAPP_NUMBER')
    },
};
