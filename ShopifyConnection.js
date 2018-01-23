const axios = require('axios');

module.exports = class ShopifyConnection {
  constructor(admin_url, store_url, name) {
    this.url = admin_url;
    this.store_url = store_url;
    this.name = name;
    this.callback_url;
    this.pageSize = 100;
  }

  registerWebhook(base_url, topic, address) {
    return axios.post(`${base_url}/webhooks.json`, {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    });
  }

  getWebhooks(base_url) {
    return axios.get(`${base_url}/webhooks.json`);
  }

  deleteWebhook(base_url, id) {
    return axios.delete(`${base_url}/webhooks/${id}.json`);
  }

  async deleteWebhooks() {
    const data = await this.getWebhooks(this.url);
    const webhooks = data.data.webhooks;
  
    if(webhooks.length > 0) {
      try {
        const response = await axios.all(webhooks.map(webhook => this.deleteWebhook(this.url, webhook.id)));
        return webhooks.length;
      } catch(err) {
        console.error(err.message);
      }
    } else {
      return 0;
    }
  }

  async createWebhooks() {
    const webhookTopics = [
      'orders/cancelled',
      'orders/create',
      'orders/delete',
      'orders/fulfilled',
      'orders/paid',
      'orders/partially_fulfilled',
      'orders/updated',
      'draft_orders/create',
      'draft_orders/delete',
      'draft_orders/update'
    ];
    
    try {
      await axios.all(webhookTopics.map(topic => this.registerWebhook(this.url, topic, `${this.callback_url}/${topic.split('/')}`)));
      return webhookTopics.length;
    } catch(err) {
      if(err.response  !== undefined && err.response.status === 422) {
        console.log('Webhook already exists');
        // console.log(err.response.data.errors)
      } else
        console.error(err);
    }
  }

  async getAll(type) {
    // Get item count
    const count = await this.getCount(type);
    const pages = (count / this.pageSize) + 1;
    const items = [];
    // ?limit=250&page=1
    for(let page = 1; page <= pages; page++) {
      const response = await axios.get(`${this.url}/${type}.json?limit=${this.pageSize}&page=${page}`);
      items.push(...response.data[type]);
    }
    return items;
  }
  
  async getCount(type) {
    const response = await axios.get(`${this.url}/${type}/count.json`);
    return response.data.count;
  }
}
