const axios = require('axios');

module.exports = class ShopifyConnection {
  constructor(adminUrl, storeUrl, callbackUrl, storeName, logWindow) {
    this.adminUrl = adminUrl; // bncanada.myshopify.com
    this.storeUrl = storeUrl; // baileynelson.com
    this.name = storeName; // CA
    this.callbackUrl = callbackUrl; // shopify.bndev.ca
    this.topics = require('./webhooks.json'); // ['orders/cancelled', 'customers/created', ...]
    this.pageSize = 100;
    this.logger = logWindow;
  }

  _registerWebhook(topic) {
    const address = this.callbackUrl;
    return axios.post(`${this.adminUrl}/webhooks.json`, {
      webhook: { topic, address, format: 'json' },
    });
  }

  _deleteWebhook(id) {
    return axios.delete(`${this.adminUrl}/webhooks/${id}.json`);
  }

  _createGiftCard(gift_card) {
    return axios.post(`${this.adminUrl}/gift_cards.json`, { gift_card });
  }

  async createGiftCards(giftCards) {
    for (const giftCard of giftCards) {
      const { initial_value, code, expires_on } = giftCard;
      const obj = { initial_value, code, expires_on };
      try {
        await this._createGiftCard(obj);
        console.log('gift card created');
      } catch (err) {
        if (err.message.includes('422'))
          console.log('Gift card already exists');
      }
      // break;
    }

    console.log('gift cards created');
  }

  async deleteWebhooks() {
    const webhooks = await this.getAll('webhooks');

    if (webhooks.length > 0) {
      try {
        await axios.all(
          webhooks.map(webhook => this._deleteWebhook(webhook.id)),
        );
        return webhooks.length;
      } catch (err) {
        console.error(err.message);
      }
    } else {
      return 0;
    }
  }

  async registerWebhooks() {
    try {
      await axios.all(this.topics.map(topic => this._registerWebhook(topic)));
      return this.topics.length;
    } catch (err) {
      if (err.response !== undefined && err.response.status === 422) {
        console.log('Webhook already exists');
        return 0;
        // console.log(err.response.data.errors)
      } else console.error(err);
    }
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

  /**
   * Update a variant with {kv} values given {id}. Only values provided in {kv} will be updated
   * @param {Integer} id Shopify Variant ID of the variant to update
   * @param {Object} kv object containing key/values of fields to update
   * @returns {Boolean} returns true or false representing success status of update
   */
  async updateVariant(id, kv) {
    const body = { variant: Object.assign({ id }, kv) };

    let failed = false;
    try {
      // console.log(id, kv)
      await axios.put(`${this.adminUrl}/variants/${id}.json`, body);
    } catch (err) {
      failed = true;
      await this._handleErrors(err, id);
    } finally {
      this.logger.update(false, 1);
      if (failed === true) this.logger.update(false, 0, 0, 1);
      else this.logger.update(false, 0, 1);
    }
    return !failed;
  }

  async _handleErrors(err, id) {
    try {
      if (err.Error !== undefined && err.Error.includes('socket hang up')) {
        // console.log('Socket hang up');
        return;
      }

      switch (err.response.status) {
        case 404:
          console.log(`ID not found ${id}`);
          break;
        case 429:
          console.log(`rate limit hit: waiting to cool off`);
          await this.wait(2000);
          console.log('after wait');
          break;
        default:
          console.log(`uncaught error: ${err.response.status}`);
      }
    } catch (err2) {
      // console.log(err2);
    }
  }

  wait(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
