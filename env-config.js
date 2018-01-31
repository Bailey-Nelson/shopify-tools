module.exports = function(env) {
  if(env.STORES === null || env.STORES === undefined) throw new Error(`Missing 'STORES' environment variable`);
  const storeNames = env.STORES.split(',').map(x => x.toUpperCase());
  const environments = {
    ADDRESS: env.ADDRESS,
    STORES: storeNames
  };
  storeNames.forEach(storeName => {
    environments[storeName] = {
      API_KEY: env[`${storeName}_API_KEY`],
      API_SECRET: env[`${storeName}_API_SECRET`],
      SHARED_SECRET: env[`${storeName}_SHARED_SECRET`],
      ADMIN_URL: env[`${storeName}_ADMIN_URL`],
      STORE_URL: env[`${storeName}_STORE_URL`]
    }
  });

  return environments;
}