# Frontline Integration Service Example

This repository contains an example server-side web application that is required to use [Twilio Frontline](https://www.twilio.com/frontline).

It creates the following routes that you will then need to add to your Twilio Frontline Console:

- `/callbacks/crm`
- `/callbacks/outgoing-conversation`
- `/callbacks/templates`
- `/callbacks/routing`
- `/callbacks/twilio-conversations`

Detailed information can be found in the [Node.js Quickstart](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart).

## Prerequisites
- A Twilio Account. Don't have one? [Sign up](https://www.twilio.com/try-twilio) for free!
- Follow the [quickstart tutorial](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart).
- NodeJS (latest or LTS)
- Yarn

## How to start development service

```shell script
# install dependencies
yarn

# copy environment variables
cp .env.example .env

# run service
yarn run start
```

## Environment variables

```
# Service variables
PORT # default 5001

# Twilio account variables
TWILIO_ACCOUNT_SID=ACXXX...
TWILIO_AUTH_TOKEN

# Variables for chat configuration
TWILIO_SMS_NUMBER # Twilio number for incoming/outgoing SMS
TWILIO_WHATSAPP_NUMBER # Twilio number for incoming/outgoing Whatsapp
```

## Setting up customers and mapping
The customer data can be configured in [src/providers/customers.js](src/providers/customers.js).

### Map between customer address + worker identity pair.
For inbound routing: Used to determine to which worker a new conversation with a particular customer should be routed to.

```js
{
    customerAddress: workerIdentity
}
```

Example:
```js
const customersToWorkersMap = {
    'whatsapp:+87654321': 'john@example.com'
}
```


### Customers list
In the CRM callback reponse, each [customer object](https://www.twilio.com/docs/frontline/data-transfer-objects#customer) should look like this: 

Example:
```js
const customers = [
    {
        customer_id: 98, // required
        display_name: 'Bobby Shaftoe', // required
        worker: 'joe@example.com', // required
        channels: [
            { type: 'email', value: 'bobby@example.com' },
            { type: 'sms', value: '+123456789' },
            { type: 'whatsapp', value: 'whatsapp:+123456789' }
        ],
        links: [
            { type: 'Facebook', value: 'https://facebook.com', display_name: 'Social Media Profile' }
        ],
    },
    //... more customer objects
];
```

Response format:
```plain
objects: {
    customers: customers
}
```

## Troubleshooting

### Port issues

If you experience issues running the Node.js server on port `5001`, you can use any other free port.

You can add `PORT=xxxx` to the `.env`. 

Alternatively, you can edit it [here](./src/config.js). Note that the one from the `.env` file will override the one on [src/config.js](./src/config.js).
