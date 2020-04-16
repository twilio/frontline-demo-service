const axios = require('axios');
const config = require('../config');

const TWILIO_AUTH_HEADER = 'X-Twilio-Token';

const authMiddleware = async (req, res, next) => {
    const token = req.header(TWILIO_AUTH_HEADER) || req.body.Token;

    // handle Twilio JWT token if present
    if (token) {
        console.log('Process token info');
        try {
            const tokenInfo = await validateToken(token);
            if (tokenInfo.identity) {
                req.tokenInfo = tokenInfo;
                next();
                return;
            }
        } catch (err) {
            console.log("Provided token is not valid", err);
        }
    } else {
        console.log("Token not provided");
    }
    // if token is not present or not valid
    res.sendStatus(401);
};

const validateToken = async (token) => {
    const response = await axios.post(
        `https://iam.twilio.com/v2/Tokens/validate/${config.twilio.sso_realm_sid}`,
        {
            token,
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
            auth: {
                username: config.twilio.account_sid,
                password: config.twilio.auth_token,
            },
        }
    );
    return { identity: response.data.realm_user_id };
};

module.exports = authMiddleware;
