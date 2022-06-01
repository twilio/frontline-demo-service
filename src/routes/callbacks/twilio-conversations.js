const twilio = require("twilio");
const {
  getCustomerByNumber,
  updateCustomer,
} = require("../../providers/customers");
const twilioClient = require("../../providers/twilio");

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

      const customerNumber = req.body["MessagingBinding.Address"];
      const proxyAddress = req.body["MessagingBinding.ProxyAddress"];
      const isIncomingConversation = !!customerNumber;

      if (isIncomingConversation) {
        let customer = (await getCustomerByNumber(customerNumber)) || {};

        // Remove "whatsapp:" prefix
        const twilioPhoneNumber = proxyAddress.slice(
          proxyAddress.indexOf(":") + 1,
          proxyAddress.length
        );

        // Customer was opted-out, but wrote us again
        await updateCustomer(customer.customer_id, {
          opt_out: { [twilioPhoneNumber]: false },
        });

        // Set Conversation attributes
        const conversationProperties = {
          friendly_name: customer.display_name || customerNumber,
          attributes: JSON.stringify({
            avatar: customer.avatar,
          }),
        };
        return res.status(200).send(conversationProperties);
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
      const customerNumber = req.body["MessagingBinding.Address"];
      const isCustomer = customerNumber && !req.body.Identity;

      if (isCustomer) {
        const customerParticipant = await twilioClient.conversations
          .conversations(conversationSid)
          .participants.get(participantSid)
          .fetch();

        const customerDetails =
          (await getCustomerByNumber(customerNumber)) || {};

        await setCustomerParticipantProperties(
          customerParticipant,
          customerDetails
        );
      }
      break;
    }

    // Conversations API "onMessageAdd" webhook
    // 
    case "onMessageAdd": {
      if (req.body.Body.toUpperCase() === "START") {
        // Found Opt-In keyword
        const customerNumber = req.body.Author;
        const customer = await getCustomerByNumber(customerNumber);

        // Fetch customer's participant object
        const customerParticipant = await twilioClient.conversations
          .conversations(req.body.ConversationSid)
          .participants.get(req.body.ParticipantSid)
          .fetch();

        // Get proxy number (twilio phone number)
        const proxyAddress = customerParticipant.messagingBinding.proxy_address;

        // Remove "whatsapp:" prefix
        const twilioPhoneNumber = proxyAddress.slice(
          proxyAddress.indexOf(":") + 1,
          proxyAddress.length
        );

        // Opt-Out customer from the twilio number
        await updateCustomer(customer.customer_id, {
          opt_out: { [twilioPhoneNumber]: false },
        });
        console.log("Customer: ", customer);
        res.sendStatus(200);
        return;
      }

      // Check if no opted-out customers are present in conversation
      const conversationSid = req.body.ConversationSid;
      // Fetch customer's participant object
      const participants = await twilioClient.conversations
        .conversations(conversationSid)
        .participants
        .list();

      const nonChatParticipants = participants.filter((participant) => {
        const proxyAddress = participant.messagingBinding?.proxy_address;
        const address = participant.messagingBinding?.address;

        return proxyAddress && address;
      });
      const optedOutParticipants = await Promise.all(
        nonChatParticipants.map(async (participant) => {
          const proxyAddress = participant.messagingBinding.proxy_address;
          const address = participant.messagingBinding.address;

          // Remove "whatsapp:" prefix
          const twilioPhoneNumber = proxyAddress.slice(
            proxyAddress.indexOf(":") + 1,
            proxyAddress.length
          );

          const customer = await getCustomerByNumber(address);
          console.log("Customer: ", customer);
          const isOptedOut = !!customer.opt_out[twilioPhoneNumber];
          return isOptedOut;
        })
      );

      if (optedOutParticipants.includes(true)) {
        // One of participants is opted out
        // Prevent message from being sent
        res.sendStatus(451);
        return;
      }
    }

    // Conversations API "onMessageAdded" webhook
    // Fires when a new message is posted to a conversation.
    case "onMessageAdded": {
      // Check message body for a opt-out keyword
      const conversationSid = req.body.ConversationSid;
      const participantSid = req.body.ParticipantSid;
      const messageBody = req.body.Body;

      if (
        messageBody.toUpperCase() === "STOP" ||
        messageBody.toUpperCase() === "CUSTOM-STOP"
      ) {
        // Found Opt-Out keyword
        const customerNumber = req.body.Author;
        const customer = await getCustomerByNumber(customerNumber);

        // Fetch customer's participant object
        const customerParticipant = await twilioClient.conversations
          .conversations(conversationSid)
          .participants.get(participantSid)
          .fetch();

        // Get proxy number (twilio phone number)
        const proxyAddress = customerParticipant.messagingBinding.proxy_address;
        // Remove "whatsapp:" prefix
        const twilioPhoneNumber = proxyAddress.slice(
          proxyAddress.indexOf(":") + 1,
          proxyAddress.length
        );

        // Opt-Out customer from the twilio number
        await updateCustomer(customer.customer_id, {
          opt_out: { [twilioPhoneNumber]: true },
        });

        console.log("Customer: ", customer);

        // Close conversation alltogether
        await twilioClient.conversations
          .conversations(conversationSid)
          .update({ state: "closed" });

        // Remove customer from conversation to prevent any further communications
        // await twilioClient.conversations
        //   .conversations(conversationSid)
        //   .participants.get(participantSid)
        //   .remove();
      }
    }
  }
  res.sendStatus(200);
};

const setCustomerParticipantProperties = async (
  customerParticipant,
  customerDetails
) => {
  const participantAttributes = JSON.parse(customerParticipant.attributes);
  const customerProperties = {
    attributes: JSON.stringify({
      ...participantAttributes,
      avatar: participantAttributes.avatar || customerDetails.avatar,
      customer_id:
        participantAttributes.customer_id || customerDetails.customer_id,
      display_name:
        participantAttributes.display_name || customerDetails.display_name,
    }),
  };

  // If there is difference, update participant
  if (customerParticipant.attributes !== customerProperties.attributes) {
    // Update attributes of customer to include customer_id
    await customerParticipant
      .update(customerProperties)
      .catch((e) => console.log("Update customer participant failed: ", e));
  }
};

module.exports = conversationsCallbackHandler;
