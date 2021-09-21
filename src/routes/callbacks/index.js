const twilioWebhookMiddleware = require('../../middlewares/twilio-webhook');
const conversationsCallbackHandler = require('./twilio-conversations');
const routingCallbackHandler = require('./routing');
const outgoingConversationCallbackHandler = require('./outgoing-conversation');
const crmCallbackHandler = require('./crm');
const templatesCallbackHandler = require('./templates');

module.exports = router => {
    router.post("/callbacks/conversations", twilioWebhookMiddleware, conversationsCallbackHandler);
    router.post("/callbacks/routing", twilioWebhookMiddleware, routingCallbackHandler);
    router.post("/callbacks/outgoing-conversation", twilioWebhookMiddleware, outgoingConversationCallbackHandler);
    router.post("/callbacks/crm", twilioWebhookMiddleware, crmCallbackHandler);
    router.post("/callbacks/templates", twilioWebhookMiddleware, templatesCallbackHandler);
};
