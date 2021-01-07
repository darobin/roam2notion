/* eslint no-await-in-loop: 0 */

let axios = require('axios')
  , { v4: uuidv4 } = require('uuid')
  , notionBase = 'https://www.notion.so/'
  , notionAPI = `${notionBase}api/v3`
  , typeMap = {
      embed:    'callout',
      to_do:    'to_do',
      heading:  'header',
      quote:    'quote',
    }
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
    // console.log(`${endpoint}\n${JSON.stringify(payload, null, 2)}`);
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
            }
          ].concat(creationMetadata(newId, parentPage, this.currentUser, created, lastModified))
        }
      ]
    });
  }
  async createEmptyBlock (
      newId,
      type = 'text',
      parentPage,
      parentBlock = parentPage,
      prevBlockId,
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
                type,
                id: newId,
                version: 1,
              },
            },
            {
              id: newId,
              table: 'block',
              path: [],
              command: 'update',
              args: {
                parent_id: parentBlock,
                parent_table: 'block',
                alive: true,
              }
            },
            {
              table: 'block',
              id: parentBlock,
              path: ['content'],
              command: 'listAfter',
              args: {
                after: prevBlockId,
                id: newId,
              }
            },
          ].concat(creationMetadata(newId, parentPage, this.currentUser, created, lastModified))
        }
      ]
    });
  }
  async setProperties (blockId, props = {}, formats = {}) {
    return this.post('saveTransactions', {
      requestId: uuidv4(),
      transactions: [
        {
          id: uuidv4(),
          spaceId: this.currentSpace,
          operations: []
            .concat(
              Object.keys(props).map(k => ({
                id: blockId,
                table: 'block',
                path: ['properties', k],
                command: 'set',
                args: props[k],
              }))
            )
            .concat(
              Object.keys(formats).map(k => ({
                id: blockId,
                table: 'block',
                path: ['format', k],
                command: 'set',
                args: formats[k],
              }))
            )
        }
      ]
    });
  }
  async setIcon (blockId, icon) {
    return this.setProperties(blockId, {}, { page_icon: icon });
  }
  async addBlock (parentPage, parentBlock = parentPage, node, prevBlockId) {
    let type = typeMap[node.ROBIN_TYPE] || 'text';
    if (type === 'header') {
      if (node.ROBIN_HEADING_LEVEL === 2) type = 'sub_header';
      else if (node.ROBIN_HEADING_LEVEL === 3) type = 'sub_sub_header';
    }
    console.log(`Adding block content for ${node.ROBIN_UUID} of type ${type}`);
    await this.createEmptyBlock(
      node.ROBIN_UUID,
      (type === 'callout') ? 'text' : type,
      parentPage,
      parentBlock,
      prevBlockId,
      { created: node['create-time'], lastModified: node['edit-time'] }
    );
    console.log(`  Created empty block`);
    if (type === 'text' || type === 'quote' || /header$/.test(type)) {
      await this.setProperties(node.ROBIN_UUID, { title: node.ROBIN_NOTION });
    }
    else if (type === 'callout') {
      await this.setProperties(
        node.ROBIN_UUID,
        { title: node.ROBIN_NOTION },
        { block_color: 'gray_background' }
      );
    }
    else if (type === 'to_do') {
      let props = { title: node.ROBIN_NOTION };
      if (node.ROBIN_TODO_CHECKED) props.checked = [['Yes']];
      await this.setProperties(node.ROBIN_UUID, props);
    }
    else console.warn(`Unknown type ${type}`);
    console.log(`  Set properties`);
    if (node.children && node.children.length) {
      console.log(`  Iterating into children`);
      let prevBlockId;
      for (let kid of node.children) {
        await this.addBlock(parentPage, node.ROBIN_UUID, kid, prevBlockId);
        prevBlockId = kid.ROBIN_UUID;
      }
    }
  }
  async addPageContent (node) {
    console.log(`Adding page content for ${node.ROBIN_UUID} ("${node.title}")`);
    if (node.children && node.children.length) {
      console.log(`  Page has chidren`);
      let prevBlockId;
      for (let kid of node.children) {
        console.log(`  Doing child ${kid.ROBIN_UUID}`);
        await this.addBlock(node.ROBIN_UUID, node.ROBIN_UUID, kid, prevBlockId);
        prevBlockId = kid.ROBIN_UUID;
      }
    }
  }
};

function creationMetadata (id, parentPage, user, created, lastModified) {
  return [
    {
      table: 'block',
      id,
      path: ['created_by_id'],
      command: 'set',
      args: user,
    },
    {
      table: 'block',
      id,
      path: ['created_by_table'],
      command: 'set',
      args: 'notion_user',
    },
    {
      table: 'block',
      id,
      path: ['created_time'],
      command: 'set',
      args: created,
    },
    {
      table: 'block',
      id,
      path: ['last_edited_time'],
      command: 'set',
      args: lastModified,
    },
    {
      table: 'block',
      id,
      path: ['last_edited_by_id'],
      command: 'set',
      args: user,
    },
    {
      table: 'block',
      id,
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
  ];
}

// first block in page:
// {
//   "table": "block",
//   "id": pageId,
//   "path": [
//     "content"
//   ],
//   "command": "listAfter",
//   "args": {
//     "id": blockId
//   }
// },
// second block in page:
// {
//   "table": "block",
//   "id": pageId,
//   "path": [
//     "content"
//   ],
//   "command": "listAfter",
//   "args": {
//     "after": prevBlockId,
//     "id": blockId
//   }
// },
// first child block:
// {
//   "table": "block",
//   "id": parentBlockId,
//   "path": [
//     "content"
//   ],
//   "command": "listAfter",
//   "args": {
//     "id": blockId
//   }
// },
// second child blocL
// {
//   "table": "block",
//   "id": parentBlockId,
//   "path": [
//     "content"
//   ],
//   "command": "listAfter",
//   "args": {
//     "after": prevBlockId,
//     "id": blockId
//   }
// },

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
