const
  axios = require('axios'),
  fs = require('fs'),
  envConfig = require('./env-config'),
  createStores = require('./create-stores');

main();

async function main() {
  const env = envConfig(process.env);
  const stores = createStores(env);
  
  for(const store of stores) {
    const result = [['SKU', 'PRODUCT_HANDLE', 'VARIANT_ID', 'URL']];
    // Get all products
    console.log(`loading products from ${store.name}`);
    const products = await store.getAll('products');
    
    // Find SKU, Variant ID, and build product URL
    result.push(...buildSKUList(products, store.storeUrl));
    
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
