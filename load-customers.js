const
  // Analytics = require('analytics-node'),
  // analytics = new Analytics(process.env.SEGMENT_KEY, { flushAt: 1 }),
  envConfig = require('./env-config'),
  createStores = require('./create-stores');


main();

async function main() {
  const env = envConfig(process.env);
  const stores = createStores(env);
  
  for(const store of stores) {
    const result = [];
    // Get all customers
    console.log(`loading customers from ${store.name}`);
    const customers = await store.getAll('products');
    
    // Normalize data and push to result list
    result.push(...buildCustomerList(customers));
    
    console.log(`${result.length} customers loaded from ${store.name}`);

    // TODO: Send to segment #identify
    
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

function buildCustomerList(customers) {
  return customers.map(customer => { return {
    first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      shopify_id: customer.id,
      phone: customer.phone,
      address: customer.addresses[0] || []
    
  }});
}
