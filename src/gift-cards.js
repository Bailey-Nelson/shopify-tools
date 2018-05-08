const
  envConfig = require('./env-config'),
  createStores = require('./create-stores'),
  csv = require('csv'),
  fs = require('fs');


!async function main() {
  const env = envConfig(process.env);
  const stores = createStores(env);

  // Parse gift card csv
  const giftCards = await loadGiftcardCSV('gift-cards-au.csv');
  const data = normalize(giftCards);
  console.log(data);
  
  for(const store of stores) {
    await store.createGiftCards(data);
  };
}();

function normalize(giftCards) {
  return giftCards.map(giftCard => {
    // const d = Date.parse(giftCard.expires_on);
    const d = new Date(giftCard.expires_on);
    const year = d.getUTCFullYear();
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + d.getUTCDate()).slice(-2);
    const date = `${year}-${month}-${day}`;
    return {
      initial_value: giftCard.initial_value,
      code: giftCard.code,
      expires_on: date
    }
  });
}

async function loadGiftcardCSV(filename) {
  return new Promise(async resolve => {
    const data = await readFile(filename);
    csv.parse(data, {columns: true}, function(err, output) {
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