const axios = require('axios');

/**
 * Represents an individual Shopify Store
 */
module.exports = class ShopifyConnection {
  constructor(settings) {
    const { adminUrl, storeUrl, callbackUrl, storeName, logWindow } = settings;
    this.adminUrl = adminUrl; // bncanada.myshopify.com
    this.storeUrl = storeUrl; // baileynelson.com
    this.name = storeName; // CA
    this.callbackUrl = callbackUrl; // api.bndev.ca/shopify
    this.logger = logWindow;
    this.pageSize = 100;
  }

  /**
   * Register a new webhook for this store
   * @param {string} topic - the topic of the webhook
   * @param {string} address - the callback url of the webhook
   */
  _registerWebhook(topic, address) {
    return axios
      .post(`${this.adminUrl}/webhooks.json`, {
        webhook: { topic, address, format: 'json' },
      })
      .catch(err => {
        return this._handleErrors(err);
      });
  }

  /**
   * Delete a webhook by ID
   * @param {string} id - ID of the webhook to delete
   */
  _deleteWebhook(id) {
    return axios.delete(`${this.adminUrl}/webhooks/${id}.json`).catch(err => {
      console.log(err);
      return this._handleErrors(err);
    });
  }

  /**
   * Register a list of webhooks for this store
   * @param {array} webhooks - list of webhooks to create in [ topic, address ] form
   */
  registerWebhooks(webhooks) {
    const promises = webhooks.map(([topic, address]) =>
      this._registerWebhook(topic, address),
    );
    return Promise.all(promises);
  }

  /**
   * Delete all webhooks for this store
   */
  async deleteWebhooks() {
    const webhooks = await this.getAll('webhooks');

    if (webhooks.length === 0) return [];

    const promises = webhooks.map(webhook => this._deleteWebhook(webhook.id));

    return Promise.all(promises);
  }

  async getAll(type, fields) {
    // Get item count
    const count = await this.getCount(type);
    const pages = count / this.pageSize + 1;
    const items = [];
    // ?limit=250&page=1
    for (let page = 1; page <= pages; page++) {
      const url = `${this.adminUrl}/${type}.json?limit=${
        this.pageSize
      }&page=${page}${fields ? `&fields=${fields.join(',')}` : ''}`;
      const response = await axios.get(url);
      items.push(...response.data[type]);
    }
    return items;
  }

  async getCount(type) {
    const response = await axios.get(`${this.adminUrl}/${type}/count.json`);
    return response.data.count;
  }

  async _handleErrors(err, id) {
    if (err.Error !== undefined && err.Error.includes('socket hang up')) {
      return;
    }

    switch (err.response.status) {
      case 404:
        console.log(`ID not found ${id}`);
        break;
      case 429:
        console.log(`rate limit hit: waiting to cool off`);
        await this.wait(2000);
        console.log('resume');
        break;
      case 422:
        // console.log('Webhook already exists');
        break;
      default:
        console.log(`uncaught error: ${err.response.status}`);
    }

    return { status: err.response.status };
  }

  wait(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
