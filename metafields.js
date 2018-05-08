const
  envConfig = require('./env-config'),
  createStores = require('./create-stores');

!async function main() {
  const env = envConfig(process.env);
  const stores = createStores(env);

  await get(env, stores);

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
    const metafields = await store.getAll('metafields');
    console.log(metafields);
    // if(metafields.length > 0) {
    //   const data = metafields.map(webhook => [webhook.address, webhook.topic])
    //   console.log(store.name + ':');
    //   data.forEach(row => console.log(`  ${row[0]} => ${row[1]}`))
    //   // console.log(data);
    //   console.log('\n')
    // } else console.log(`${store.name} => No metafields registered`);
  });
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
