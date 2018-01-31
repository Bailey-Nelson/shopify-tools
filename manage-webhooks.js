const
  envConfig = require('./env-config'),
  createStores = require('./create-stores');

!async function main() {
  let env;
  try {
    env = envConfig(process.env);
  } catch(err) {
    killswitch(err.message);
  }

  const args = process.argv.slice(2);
  const stores = createStores(env);

  switch(args[0]) {

    case '--remove':
    case '-r':
    case '--delete':
    case '-d':
      await remove(env, stores);
      break;

    case '--register':
    case '--create':
    case '-c':
      await register(env, stores);
      break;

    case '--get':
    case '-g':
    default:
      await get(env, stores);
  }

}();

/**
 * Register new webhooks from webhooks.json
 * @param {object} env - Environment variables nicely formatted
 * @param {list} stores - List of Shopify store objects to register webhooks for
 */
async function register(env, stores) {
  stores.forEach(async store => {
    const count = await store.registerWebhooks();
    console.log(`${store.name} => ${count} webhooks registered`);
  });
}

/**
 * Remove existing webhooks
 * @param {object} env - Environment variables nicely formatted
 * @param {list} stores - List of Shopify store objects to remove webhooks from
 */
async function remove(env, stores) {
  stores.forEach(async store => {
    const deleted = await store.deleteWebhooks();
    console.log(`${store.name} =>`, deleted > 0 ? `${deleted} webhooks removed` : 'No webhooks to delete');
  });
}

/**
 * Fetch existing webhooks
 * @param {object} env - Environment variables nicely formatted
 * @param {list} stores - List of Shopify store objects to fetch registered webhooks from
 */
async function get(env, stores) {
  stores.forEach(async store => {
    const webhooks = await store.getAll('webhooks');
    if(webhooks.length > 0) {
      const data = webhooks.map(webhook => [webhook.address, webhook.topic])
      console.log(store.name + ':');
      data.forEach(row => console.log(`  ${row[0]} => ${row[1]}`))
      // console.log(data);
      console.log('\n')
    } else console.log(`${store.name} => No webhooks registered`);
  });
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function killswitch(reason) {
  console.error(reason);
  process.exit(1)
}