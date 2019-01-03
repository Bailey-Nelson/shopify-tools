/**
 * parse webhooks.json and format into a 2D array of address and topics
 *
 * [ [ topic, address ] ]
 * [ "orders/create", "https://api.baileynelson.com/shopify" ]
 */
module.exports = function parseWebhooks(env = 'dev') {
  const webhookConfig = require('./webhooks.json');

  const { topics, addresses, webhooks } = webhookConfig;

  const result = [];

  for (const webhook of webhooks) {
    try {
      result.push(parseSingle(webhook, topics, addresses, env));
    } catch (err) {
      // didn't work, just log the error and continue
      console.log(err);
    }
  }

  return result;
};

function parseSingle(webhook, topics, addresses, env) {
  const topic = topics[webhook.topic];
  let path = '';
  if (webhook.path !== undefined) {
    if (!webhook.path.startsWith('/')) {
      path = '/' + webhook.path;
    } else {
      path = webhook.path;
    }
  }
  const address = addresses[env][webhook.address] + path;

  return [topic, address];
}
