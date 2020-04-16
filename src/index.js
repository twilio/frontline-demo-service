const  createApp = require('./create-app');
const config = require('./config');
const routes = require('./routes');

const app = createApp(config);
routes(app);

app.listen(config.port, () => {
	console.info(`Application started at ${config.port}`)
});
