# Frontline Integration Service Example

***NOTE: Effective February 9, 2023***, Twilio Frontline is limited to existing Frontline accounts only. New and existing Twilio customers without previous access to Frontline will not be able to get Frontline through Twilio's Console nor access developer documentation.   For more information, please check out the Twilio [Frontline](https://support.twilio.com/hc/en-us/articles/12427869273627-Twilio-Frontline-Limitation-of-New-Sales-Notice-and-Information) Support documentation.

This repository contains an example server-side web application that is required to use [Twilio Frontline](https://www.twilio.com/frontline).

## Prerequisites
- A Twilio Account. Don't have one? [Sign up](https://www.twilio.com/try-twilio) for free!
- Follow the quickstart tutorial [here](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart).
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
The customer data can be configured in ```src/routes/callbacks/crm.js```.

Quick definition of customer's objects can be found below.

### Map between customer address + worker identity pair.
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
Example:
```js
const customers = [
    {
        customer_id: 98,
        display_name: 'Bobby Shaftoe',
        channels: [
            { type: 'email', value: 'bobby@example.com' },
            { type: 'sms', value: '+123456789' },
            { type: 'whatsapp', value: 'whatsapp:+123456789' }
        ],
        links: [
            { type: 'Facebook', value: 'https://facebook.com', display_name: 'Social Media Profile' }
        ],
        worker: 'joe@example.com'
    }
];
```

---
Detailed information can be found in **Quickstart**, provided by Frontline team.

## Troubleshooting

### Port issues

If you experience issues running the Node.js server on port `5001`, you can use any other free port.

You can add `PORT=xxxx` to the `.env`. 

Alternatively, you can edit it [here](./src/config.js). Note that the one from the `.env` file will override the one on [src/config.js](./src/config.js).
