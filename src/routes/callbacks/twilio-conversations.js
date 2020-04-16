const { findWorkerForCustomer, getCustomerByNumber, findRandomWorker } = require('../../providers/customers');
const twilioClient = require('../../providers/twilio');

const conversationsCallbackHandler = async (req, res) => {
    res.locals.log("Conversations Callback");
    res.locals.log(JSON.stringify(req.body));

    const eventType = req.body.EventType;

    switch (eventType) {
        case "onConversationAdd":{
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
        case "onParticipantAdded":{
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
    /*  case "onConversationAdded":{
            /* POST-WEBHOOK
             *
             * This webhook will be called after conversation is created.
             * 
             * DO NOT USE THIS WEBHOOK FOR ROUTING PURPOSES IF YOU ENABLED
             * FRONTLINE INBOUND ROUTING. Otherwise it would cause unexpected behaviour.
             * 
             * Given that Frontline Inbound Routing is disabled, manual routing
             * can be handled here. In that case `onConversationAdd` and
             * `onParticipantAdded` webhook subscriptions can be disabled.
             * 
             * More info about the `onConversationAdded` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onconversationadded
             */
    /*      const conversationSid = req.body.ConversationSid;
            const customerNumber = req.body['MessagingBinding.Address'];
            const isIncomingConversation = !!customerNumber

            if (isIncomingConversation) {
                const conversationParticipants = await twilioClient.conversations
                    .conversations(conversationSid)
                    .participants
                    .list();
                const conversationCreator = conversationParticipants[0];

                let customerDetails = await getCustomerDetails(customerNumber);

                await setCustomerParticipantProperties(conversationCreator, customerDetails);
                await setConversationProperties(conversationSid, customerDetails);

                await routeConversation(conversationSid, customerNumber);
            }
            break;
        }*/
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

const getCustomerDetails = async (customerNumber) => {
    let customerDetails = await getCustomerByNumber(customerNumber);

    if (!customerDetails) { // Unknown Customer
        customerDetails = {
            display_name: customerNumber
        };
    }
    return customerDetails;
}

const setConversationProperties = async (conversationSid, customerDetails) => {
    const conversationProperties = {
        friendlyName: customerDetails.display_name,
        attributes: JSON.stringify({
            avatar: customerDetails.avatar
        })
    };
    // Update conversation properties
    twilioClient.conversations
        .conversations(conversationSid)
        .update(conversationProperties)
        .catch(e => console.log('Update incoming conversation: ', e));
}

const routeConversation = async (conversationSid, customerNumber) => {
    let workerIdentity = await findWorkerForCustomer(customerNumber);

    if (!workerIdentity) { // Customer doesn't have a worker

        // Select a random worker
        workerIdentity = await findRandomWorker();

        // Or you can define default worker for unknown customers.
        // workerIdentity = 'john@example.com'

        if (!workerIdentity) {
            console.warn("Routing failed, please add workers to customersToWorkersMap or define a default worker", { conversationSid: conversationSid });
            return;
        }
    }
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

module.exports = conversationsCallbackHandler;
