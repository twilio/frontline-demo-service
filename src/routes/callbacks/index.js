const twilioWebhookMiddleware = require('../../middlewares/twilio-webhook');
const authMiddleware = require('../../middlewares/authorize');
const conversationsCallbackHandler = require('./twilio-conversations');
const outgoingConversationCallbackHandler = require('./outgoing-conversation');
const crmCallbackHandler = require('./crm');
const templatesCallbackHandler = require('./templates');

module.exports = router => {
    router.post("/callbacks/conversations", twilioWebhookMiddleware, conversationsCallbackHandler);
    router.post("/callbacks/outgoing-conversation", authMiddleware, outgoingConversationCallbackHandler);
    router.post("/callbacks/crm", authMiddleware, crmCallbackHandler);
    router.post("/callbacks/templates", authMiddleware, templatesCallbackHandler);
};
