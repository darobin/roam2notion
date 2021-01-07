
let axios = require('axios')
  , { v4: uuidv4 } = require('uuid')
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
  // Note: the parentCollection isn't the parent page, it has to be the table itself
  async createEmptyRecord (
      newId,
      parentPage,
      parentCollection,
      { created = Date.now(), lastModified = Date.now() } = {}
    ) {
    return this.post('saveTransactions', {
      requestId: uuidv4(),
      transactions: [
        {
          id: uuidv4(),
          spaceId: this.currentSpace,
          operations: [
            {
              id: newId,
              table: 'block',
              path: [],
              command: 'set',
              args: {
                type: 'page',
                id: newId,
                version: 1,
              },
            },
            // {
            //   "table": "collection_view",
            //   "id": "eb0058df-3b03-4983-8469-0ceb720b300a",
            //   path: [
            //     "page_sort"
            //   ],
            //   "command": "listAfter",
            //   args: {
            //     "after": "3fbf5e1e-fd96-4d8d-b3d0-cbb6d79082dc",
            //     id: newId,
            //   },
            // },
            {
              id: newId,
              table: 'block',
              path: [],
              command: 'update',
              args: {
                parent_id: parentCollection,
                parent_table: 'collection',
                alive: true,
              }
            },
            {
              table: 'block',
              id: newId,
              path: ['created_by_id'],
              command: 'set',
              args: this.currentUser,
            },
            {
              table: 'block',
              id: newId,
              path: ['created_by_table'],
              command: 'set',
              args: 'notion_user',
            },
            {
              table: 'block',
              id: newId,
              path: ['created_time'],
              command: 'set',
              args: created,
            },
            {
              table: 'block',
              id: newId,
              path: ['last_edited_time'],
              command: 'set',
              args: lastModified,
            },
            {
              table: 'block',
              id: newId,
              path: ['last_edited_by_id'],
              command: 'set',
              args: this.currentUser,
            },
            {
              table: 'block',
              id: newId,
              path: ['last_edited_by_table'],
              command: 'set',
              args: 'notion_user',
            },
            {
              table: 'block',
              id: parentPage,
              path: ['last_edited_time'],
              command: 'set',
              args: Date.now(),
            }
          ]
        }
      ]
    });
  }
  async setProperties (blockId, props) {
    return this.post('saveTransactions', {
      requestId: uuidv4(),
      transactions: [
        {
          id: uuidv4(),
          spaceId: this.currentSpace,
          operations: Object.keys(props).map(k => ({
            id: blockId,
            table: 'block',
            path: ['properties', k],
            command: 'set',
            args: props[k],
          }))
        }
      ]
    });
  }
  async setIcon (blockId, icon) {
    return this.post('saveTransactions', {
      requestId: uuidv4(),
      transactions: [
        {
          id: uuidv4(),
          spaceId: this.currentSpace,
          operations: [{
            id: blockId,
            table: 'block',
            path: ['format', 'page_icon'],
            command: 'set',
            args: icon,
          }]
        }
      ]
    });
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
