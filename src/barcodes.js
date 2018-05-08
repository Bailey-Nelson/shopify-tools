const
  envConfig = require('./env-config'),
  createStores = require('./create-stores'),
  BarcodeLogWindow = require('./BarcodeLogWindow'),
  csv = require('csv'),
  fs = require('fs');

const files = {
  'AU': 'au_product_feed.csv',
  'CA': 'ca_product_feed.csv',
  'UK': 'uk_product_feed.csv',
  'TEST': 'au_product_feed.csv',
};

async function testLoop(logWindow, iterations) {
  for(let i = 0; i < iterations; i++) {
    logWindow.update(false, 1, 1, 1);
    await wait(1000);
  }
}

!async function main() {
  const env = envConfig(process.env);
  const logger = new BarcodeLogWindow('Barcode update requests and failures');
  // await wait(10000);

  // return;
  
  const stores = createStores(env, logger);
  for(const store of stores) {
    const csvProducts = await loadProductsCSV(`src/${files[store.name]}`)
    const products = normalize(csvProducts);
    logger.totalRequests = products.length;
    for(const product of products) {
      if(product === undefined || product === null) { logger.totalRequests--; continue; };
      const { barcode, variantId } = product;
      await store.updateVariant(variantId, { barcode });
      await wait(50);
    }
  }

  logger.end();

}();

function wait(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalize(products) {
  return products
    .filter(product => product.link !== '' && product.link !== '#N/A')
    .map(product => {
      try {
        const variantId = product.link.match(/variant=([0-9]*)/)[1];
        const handle = product.Handle;
        return {
          handle, variantId, barcode: product.gtin, sku: product.id
        }
      } catch(err) {
        // console.log('probably no variant')
      }
  });
}

async function loadProductsCSV(filename) {
  return new Promise(async resolve => {
    const data = await readFile(filename);
    csv.parse(data, { columns: true }, function(err, output) {
      return resolve(output);
    });
  });
}

function readFile(filename) {
  return new Promise(resolve => {
    fs.readFile(filename, 'utf8', (err, data) => {
      return resolve(data);
    });
  });
}