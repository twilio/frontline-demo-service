const twilioClient = require('../../providers/twilio');

const routingCallbackHandler = async (req, res) => {
    res.locals.log("Frontline Routing Callback");
    res.locals.log(JSON.stringify(req.body));

    const conversationSid = req.body.ConversationSid;
    const customerNumber = req.body['MessagingBinding.Address'];

    await routeConversation(conversationSid, customerNumber);
    res.sendStatus(200);
};

const routeConversation = async (conversationSid, customerNumber) => {
    const workerIdentity = "dsavin@twilio.com";
    await routeConversationToWorker(conversationSid, workerIdentity);
}

const routeConversationToWorker = async (conversationSid, workerIdentity) => {
    // Add worker to the conversation with a customer
    twilioClient.conversations
        .conversations(conversationSid)
        .participants
        .create({ identity: workerIdentity })
        .then(participant => console.log('Create agent participant: ', participant.sid))
        .catch(e => console.log('Create agent participant: ', e));
}

module.exports = routingCallbackHandler;
