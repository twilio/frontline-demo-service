const config = require('../../config');

const outgoingConversationCallbackHandler = (req, res) => {
    console.log('outgoingConversationCallbackHandler');

    const location = req.body.Location;

    // Location helps to determine which action to perform.
    switch (location) {
        case 'GetProxyAddress': {
            handleGetProxyAddress(req, res);
            return;
        }

        default: {
            console.log('Unknown location: ', location);
            res.sendStatus(422);
        }
    }
};

const handleGetProxyAddress = (req, res) => {
    console.log('Getting Proxy Address');

    const body = req.body;
    const workerIdentity = body.Worker;
    const customerId = body.CustomerId;
    const channelName = body.ChannelType;
    const channelAddress = body.ChannelValue;

    const proxyAddress = getCustomerProxyAddress(channelName);

    // In order to start a new conversation ConversationsApp need a proxy address
    // otherwise the app doesn't know from which number send a message to a customer
    if (proxyAddress) {
        res.status(200).send({ proxy_address: proxyAddress });
        console.log("Got proxy address!");
        return;
    }

    console.log("Proxy address not found");
    res.sendStatus(403);
};

const getCustomerProxyAddress = (channelName) => {
    if (channelName === 'whatsapp') {
        return config.twilio.whatsapp_number;
    } else {
        return config.twilio.sms_number;
    }
};

module.exports = outgoingConversationCallbackHandler;
