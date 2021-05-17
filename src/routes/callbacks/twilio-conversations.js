const { getCustomerByNumber } = require('../../providers/customers');
const twilioClient = require('../../providers/twilio');

const conversationsCallbackHandler = async (req, res) => {
    res.locals.log("Conversations Callback");
    res.locals.log(JSON.stringify(req.body));

    const eventType = req.body.EventType;

    switch (eventType) {
        case "onConversationAdd": {
            /* PRE-WEBHOOK
             *
             * This webhook will be called before creating a conversation.
             * 
             * It is required especially if Frontline Inbound Routing is enabled
             * so that when the worker will be added to the conversation, they will
             * see the friendly_name and avatar of the conversation.
             * 
             * More info about the `onConversationAdd` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onconversationadd
             * More info about handling incoming conversations: https://www.twilio.com/docs/frontline/handle-incoming-conversations
             */
            const customerNumber = req.body['MessagingBinding.Address'];
            const isIncomingConversation = !!customerNumber

            if (isIncomingConversation) {
                let customerDetails = await getCustomerByNumber(customerNumber) || {};

                const conversationProperties = {
                    friendly_name: customerDetails.display_name || customerNumber,
                    attributes: JSON.stringify({
                        avatar: customerDetails.avatar
                    })
                };
                return res.status(200).send(conversationProperties)
            }
            break;
        }
        case "onParticipantAdded": {
            /* POST-WEBHOOK
             *
             * This webhook will be called when a participant added to a conversation
             * including customer in which we are interested in.
             * 
             * It is required to add customer_id information to participant and
             * optionally his display_name and avatar.
             * 
             * More info about the `onParticipantAdded` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onparticipantadded
             * More info about the customer_id: https://www.twilio.com/docs/frontline/my-customers#customer-id
             * And more here you can see all the properties of a participant which you can set: https://www.twilio.com/docs/frontline/data-transfer-objects#participant
             */
            const conversationSid = req.body.ConversationSid;
            const participantSid = req.body.ParticipantSid;
            const customerNumber = req.body['MessagingBinding.Address'];
            const isCustomer = customerNumber && !req.body.Identity;

            if (isCustomer) {
                const customerParticipant = await twilioClient.conversations
                    .conversations(conversationSid)
                    .participants
                    .get(participantSid)
                    .fetch();

                const customerDetails = await getCustomerByNumber(customerNumber) || {};

                await setCustomerParticipantProperties(customerParticipant, customerDetails);
            }
            break;
        }
    }
    res.sendStatus(200);
};

const setCustomerParticipantProperties = async (customerParticipant, customerDetails) => {
    const participantAttributes = JSON.parse(customerParticipant.attributes);
    const customerProperties = {
        attributes: JSON.stringify({
            ...participantAttributes,
            avatar: participantAttributes.avatar || customerDetails.avatar,
            customer_id: participantAttributes.customer_id || customerDetails.customer_id,
            display_name: participantAttributes.display_name || customerDetails.display_name
        })
    };

    // If there is difference, update participant
    if (customerParticipant.attributes !== customerProperties.attributes) {
        // Update attributes of customer to include customer_id
        await customerParticipant
            .update(customerProperties)
            .catch(e => console.log("Update customer participant failed: ", e));
    }
}

module.exports = conversationsCallbackHandler;
