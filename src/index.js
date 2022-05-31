const createApp = require('./create-app');
const config = require('./config');
const routes = require('./routes');

const app = createApp(config);
routes(app);

function logRoutes(port) {
  console.log('\n', 'Your routes:');
  app._router.stack
    .filter(b => b.name === 'bound dispatch')
    .forEach(o => o.route && console.log(o.route.path));
  console.log('\n', 'Next steps:');
  console.log(`- Use ngrok to expose port ${port}`);
  console.log(
    '- Configure the callback URLs on your Twilio Frontline Console: https://www.twilio.com/console/frontline'
  );
  console.log('\n', 'Each callback URL is a combination of your ngrok domain + the route');
  console.log(
    'Read more: https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#configure-the-twilio-frontline-integration-service'
  );
}  

app.listen(config.port, () => {
  console.info(`Application started at http://localhost:${config.port}`);
  logRoutes(config.port);
});
