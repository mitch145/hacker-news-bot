const apiai = require('apiai');
const config = require('./config');
 
const app = apiai(config.apiAIClientToken);

module.exports = {
  app: app,
}