
let axios = require('axios')
  , notionAPI = 'https://www.notion.so/api/v3'
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
    // XXX
    // self._store.store_recordmap(records)
    // self.current_user = self.get_user(list(records["notion_user"].keys())[0])
    // self.current_space = self.get_space(list(records["space"].keys())[0])
    return recordMap;
  }
  async post (endpoint, payload = {}) {
    let { status, data } = await this.client.post(endpoint, payload);
    if (status > 400) throw new Error(`Got ${status} error POSTing to ${endpoint} with ${JSON.stringify(payload)}`);
    return data;
  }
  async getBlock (urlOrId, forceRefresh) {
    //
  }
  // def get_record_data(self, table, id, force_refresh=False):
  //     return self._store.get(table, id, force_refresh=force_refresh)
  //
  // def get_block(self, url_or_id, force_refresh=False):
  //     """
  //     Retrieve an instance of a subclass of Block that maps to the block/page identified by the URL or ID passed in.
  //     """
  //     block_id = extract_id(url_or_id)
  //     block = self.get_record_data("block", block_id, force_refresh=force_refresh)
  //     if not block:
  //         return None
  //     if block.get("parent_table") == "collection":
  //         if block.get("is_template"):
  //             block_class = TemplateBlock
  //         else:
  //             block_class = CollectionRowBlock
  //     else:
  //         block_class = BLOCK_TYPES.get(block.get("type", ""), Block)
  //     return block_class(self, block_id)
};


// def extract_id(url_or_id):
//     """
//     Extract the block/page ID from a Notion.so URL -- if it's a bare page URL, it will be the
//     ID of the page. If there's a hash with a block ID in it (from clicking "Copy Link") on a
//     block in a page), it will instead be the ID of that block. If it's already in ID format,
//     it will be passed right through.
//     """
//     input_value = url_or_id
//     if url_or_id.startswith(BASE_URL):
//         url_or_id = (
//             url_or_id.split("#")[-1]
//             .split("/")[-1]
//             .split("&p=")[-1]
//             .split("?")[0]
//             .split("-")[-1]
//         )
//     try:
//         return str(uuid.UUID(url_or_id))
//     except ValueError:
//         raise InvalidNotionIdentifier(input_value)
