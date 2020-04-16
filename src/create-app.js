const express = require('express');
const { v1: uuidv1 } = require('uuid');

module.exports = (config) => {
    const app = express();

    const requestFilter = (req, res, next) => {
        res.locals.log = logWithRequestData(req.method, req.path, uuidv1());
        next();
    };

    const logWithRequestData = (method, path, id) => (...message) => {
        console.log(`[${method}][${path}][${id}]`, ...message);
    };

    app.enable('trust proxy'); // for trusting heroku proxy
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(requestFilter);

    return app
};
