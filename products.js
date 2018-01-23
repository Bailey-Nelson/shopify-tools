const
  axios = require('axios'),
  fs = require('fs'),
  ShopifyConnection = require('./ShopifyConnection');

main();

async function main() {
  const env = environments(process.env);
  const stores = createStores(env);
  // console.log(stores);
  // return;

  
  for(const store of stores) {
    const result = [['SKU', 'PRODUCT_HANDLE', 'VARIANT_ID', 'URL']];
    // Get all products
    console.log(`loading products from ${store.name}`);
    const products = await store.getAll('products');
    
    // Find SKU, Variant ID, and build product URL
    result.push(...buildSKUList(products, store.store_url));
    
    console.log(`${result.length} products and variants loaded from ${store.name}`);

    // Write to file
    fs.mkdir('products', err => {
      const file = fs.createWriteStream(`./products/${store.name}.csv`);
      file.on('error', function(err) { /* error handling */ });
      result.forEach(function(v) { file.write(v.join(',') + '\n'); });
      file.end();
    });
  };
}

function buildSKUList(products, url) {
  const result = [];
  for(const product of products) {
    for(const variant of product.variants) {
      if(variant.sku)
        result.push([variant.sku, product.handle, variant.id, `https://${url}/products/${product.handle}?variant=${variant.id}`]);
    }
  }
  return result;
}

function createStores(env) {
  return env.STORES.map(store => {
    const info = env[store];
    const url = `https://${info.API_KEY}:${info.API_SECRET}@${info.ADMIN_URL}`;
    return new ShopifyConnection(url, info['URL'], store);
  });
}

function environments(env) {
  if(env.STORES === null || env.STORES === undefined) throw new Error(`Missing 'STORES' environment variable`);
  const stores = env.STORES.split(',').map(x => x.toUpperCase());
  const environments = {
    STORES: stores
  };
  stores.forEach(store => {
    environments[store] = {
      API_KEY: env[`${store}_API_KEY`],
      API_SECRET: env[`${store}_API_SECRET`],
      ADMIN_URL: env[`${store}_ADMIN_URL`],
      URL: env[`${store}_URL`]
    }
  });

  return environments;
}
