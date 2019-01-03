const envConfig = require('./env-config'),
  createStores = require('./create-stores'),
  parseWebhooks = require('./parse-webhooks'),
  yargs = require('yargs');

(async function main() {
  let env;
  try {
    env = envConfig(process.env);
  } catch (err) {
    console.log(err.message);
    return;
  }

  const args = parseArgs(yargs);

  if (args.stores !== undefined) {
    env.STORES = args.stores.map(x => x.toUpperCase());
  }
  const stores = createStores(env);
  const stage = args.env || 'dev';
  const webhooks = parseWebhooks(stage);
  const longestTopic = Math.max(...webhooks.map(x => x[0].length));

  if (args.create !== undefined) {
    await create(stores, webhooks);
    await get(stores, longestTopic);
  } else if (args.delete !== undefined) {
    await remove(stores);
  } else if (args.get !== undefined) {
    await get(stores, longestTopic);
  }
})();

/**
 * Parse cli arguments
 * @param {yargs} yargs - yargs object
 */
function parseArgs(yargs) {
  return yargs
    .option('g', {
      alias: 'get',
      describe: 'get all registered webhooks for specified stores',
    })
    .option('c', {
      alias: 'create',
      describe: 'create webhooks based on webhooks.json',
    })
    .option('d', {
      alias: 'delete',
      describe: 'delete all webhooks in specified stores',
    })
    .option('e', {
      alias: 'env',
      describe: 'specify environment',
    })
    .option('s', {
      alias: 'stores',
      describe: 'specify stores to get webhooks for',
      choices: ['test', 'ca', 'au', 'uk', 'nz'],
      // default: 'test ca au uk nz',
    })
    .array('s')
    .conflicts('g', ['c', 'd'])
    .conflicts('d', ['g', 'c'])
    .conflicts('c', ['d', 'g'])
    .wrap(135)
    .help().argv;
}

/**
 * Register new webhooks from webhooks.json
 * @param {array} stores - List of Shopify store objects to register webhooks for
 */
function create(stores, webhooks) {
  stores.forEach(async store => {
    const registeredWebhooks = await store.registerWebhooks(webhooks);
    const count = registeredWebhooks.reduce(
      (acc, cur) => (cur.status.toString().startsWith(2) ? acc + 1 : acc),
      0,
    );
    console.log(`${store.name} => ${count} webhooks registered`);
  });
}

/**
 * Remove existing webhooks
 * @param {array} stores - List of Shopify store objects to remove webhooks from
 */
function remove(stores) {
  stores.forEach(async store => {
    const deletedWebhooks = await store.deleteWebhooks();
    const count = deletedWebhooks.reduce(
      (acc, cur) => (cur.status.toString().startsWith(2) ? acc + 1 : acc),
      0,
    );
    console.log(
      `${store.name} =>`,
      count > 0 ? `${count} webhooks removed` : 'No webhooks to delete',
    );
  });
}

/**
 * Fetch existing webhooks
 * @param {array} stores - List of Shopify store objects to fetch registered webhooks from
 */
function get(stores, longestTopic) {
  stores.forEach(async store => {
    const webhooks = await store.getAll('webhooks');
    if (webhooks.length > 0) {
      const data = webhooks.map(webhook => [webhook.address, webhook.topic]);
      console.log(store.name + ':');
      data.forEach(row =>
        console.log(
          `  ${row[1]}`.padEnd(longestTopic + 3, ' '),
          `=>  ${row[0]}`,
        ),
      );
      console.log('\n');
    } else console.log(`${store.name} => No webhooks registered`);
  });
}
