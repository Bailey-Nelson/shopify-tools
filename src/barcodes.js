const
  envConfig = require('./env-config'),
  createStores = require('./create-stores'),
  { Client } = require('pg'),
  client = new Client(),
  BarcodeLogWindow = require('./BarcodeLogWindow');


!async function main() {
  const logger = new BarcodeLogWindow('Barcode update requests and failures');
  const env = envConfig(process.env);
  const stores = createStores(env, logger);

  const productsQuery = `select sku, barcode from products`;
  await client.connect();
  const bndataProductsArray = await client.query(productsQuery);
  client.end();
  const bnProductsMap = buildProductsMap(bndataProductsArray.rows);
  // console.log(`loaded ${bnProductsMap.size} products from bndata\n`);

  const variants = await Promise.all(stores.map(store => getVariantsByStore(store, bnProductsMap)));

  // Get the total number of variant update requests that will be sent, for logging purposes!
  const totalVariants = variants.reduce((accumulator, currentVal) => accumulator + currentVal.filter(x => x.barcode !== null).length, 0);
  logger.totalRequests = totalVariants;

  const promises = [];
  for (let i = 0; i < stores.length; i++) {
    promises.push(updateVariants(stores[i], variants[i].filter(x => x.barcode !== null)));
  }

  const result = await Promise.all(promises);
  // TODO: Log result better
  // console.log(result);
}();

async function getVariantsByStore(store, products) {
  const shopifyProducts = await store.getAll('products', ['id', 'variants']);
  const shopifyVariants = getVariants(shopifyProducts);

  matchVariantsBySKU(products, shopifyVariants);

  // console.log(`loaded ${shopifyVariants.length} variants from ${store.name}`);

  return shopifyVariants;
}

function buildProductsMap(bndataProducts) {
  const map = new Map();
  for (const product of bndataProducts) {
    const { id, barcode } = product;
    map.set(product.sku, { id, barcode });
  }
  return map;
}

function getVariants(products) {
  const variants = [];
  products.forEach(product => {
    product.variants.forEach(x => {
      if (x.id && x.sku)
        variants.push({
          sku: x.sku.toString().trim(),
          id: x.id.toString().trim(),
          barcode: x.barcode,
        });
    });
  });

  // We only really need to update variants that don't already have barcodes
  return variants.filter(x => !x.barcode || x.barcode.toString().trim().length === 0);
}

function matchVariantsBySKU(products, variants) {
  for (const variant of variants) {
    const result = products.get(variant.sku);
    if (result === undefined || result.barcode === undefined)
      variant.barcode = null;
    else
      variant.barcode = result.barcode;
  }
}

/**
 * Given a ShopifyConnection object and a list of variant objects (inc. id, barcode, sku),
 * update all the provided variants in the provided store.
 * 
 * The Shopify Plus admin API has an 80 request bucket with a "leak" rate of 4 requests per second.
 * This means that a manual wait may be necessary as to not hit the API limit, resulting in a 429 error response.
 * @param {ShopifyConnection} store a ShopifyConnection object
 * @param {Array} variants an array of variant objects contianing keys representing id, barcode, and sku
 * @returns {Object} an object containing succeeded/failed keys representing how many requests succeeded and failed 
 */
async function updateVariants(store, variants) {
  const promises = [];
  for (const variant of variants) {
    /**
     * Adding the wait means there will always be a set wait time, regardless of
     * how long the update request takes to return.
     * Basic shopify api limit is 2 per second, shopify plus supposedly increases 
     * that to 4. 1000ms / 4 reqs = 250ms per request.
     * We'll see if this page is lying https://help.shopify.com/en/api/getting-started/api-call-limit
     */
    promises.push(store.updateVariant(variant.id, { barcode: variant.barcode }));
    await wait(250);
  }

  let successfulUpdates = 0, unsuccessfulUpdates = 0;
  const results = await Promise.all(promises);
  for (const result of results)
    result === true ? successfulUpdates++ : unsuccessfulUpdates++;

  return {
    succeeded: successfulUpdates,
    failed: unsuccessfulUpdates,
  };
}

async function wait(ms = 100) {
  return new Promise(resolve => {
    return setTimeout(resolve, ms);
  });
}