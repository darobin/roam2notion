
let axios = require('axios')
  , notionBase = 'https://www.notion.so/'
  , notionAPI = `${notionBase}api/v3`
;

module.exports = class NotionClient {
  constructor ({ token }) {
    this.token = token;
    this.client = axios.create({
      baseURL: notionAPI,
      headers: {
        Cookie: `token_v2=${token}`
      },
    });
  }
  async init () {
    await this.updateUserInfo();
  }
  async updateUserInfo () {
    let { recordMap } = await this.post('loadUserContent');
    // console.log(recordMap);
    [this.currentUser] = Object.keys(recordMap.notion_user);
    [this.currentSpace] = Object.keys(recordMap.space);
    return recordMap;
  }
  async post (endpoint, payload = {}) {
    try {
      let { data } = await this.client.post(endpoint, payload);
      return data;
    }
    catch ({ response: { status, data } }) {
      throw new Error(`Got ${status} error POSTing to ${endpoint} with ${JSON.stringify(payload)}: ${JSON.stringify(data)}`);
    }
  }
  async getData (table, urlOrId) {
    let blockId = extractId(urlOrId);
    if (table === 'block') {
      // return .recordMap from this
      return this.post('loadPageChunk', { pageId: blockId, limit: 10000, cursor: { stack: [] },  chunkNumber: 0, verticalColumns: false });
    }
    // return .results from this
    return this.post('getRecordValues', { requests: [{ table: blockId, id: null }] });
  }
  async getBlock (urlOrId) {
    return this.getData('block', urlOrId);
  }
};

function extractId (urlOrId) {
  if (urlOrId.startsWith(notionBase)) {
    return str2uuid(
      urlOrId
        .split('#').reverse()[0]
        .split('/').reverse()[0]
        .split('&p=').reverse()[0]
        .split('?')[0]
        .split('-').reverse()[0]
      )
    ;
  }
  return urlOrId;
}

function str2uuid (str) {
  if (/-/.test(str)) return str;
  let parts = str.match(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/);
  parts.shift();
  return parts.join('-');
}
