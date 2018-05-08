const ShopifyConnection = require('./ShopifyConnection');

module.exports = function createStores(env, logWindow) {
  return env.STORES.map(storeName => {
    const info = env[storeName];
    const storeUrl = info.STORE_URL;
    const adminUrl = `https://${info.API_KEY}:${info.API_SECRET}@${info.ADMIN_URL}`;
    const callbackUrl = `https://${env.ADDRESS}`;
    return new ShopifyConnection(adminUrl, storeUrl, callbackUrl, storeName, logWindow);
  });
}