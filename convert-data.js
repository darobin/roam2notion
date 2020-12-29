
let db = require('./last-roam/robinberjon.json')
  , killList = new Set([
      'Big Test Page',
    ])
  , rootNodesByName = {}
  , nodesByUID = {}
  , uid2root = {}
  , rootMetadata = {}
;

indexNodes(db);

// XXX:
//  - Convert data
//    - apply kill list
//    - index nodes
//    - resolve embeds
//    - detect people
//    - extract metadata and type/icon
//    - convert MD to Notion's internal format


function indexNodes (data) {
  data.forEach(node => {
    if (killList.has(node.title)) {
      console.warn(`Killed "${node.title}"`);
      return;
    }
    rootNodesByName[node.title] = node;
    allChildren(node).forEach(kid => {
      if (kid.uid) {
        nodesByUID[kid.uid] = kid;
        uid2root[kid.uid] = node.title;
      }
    });
    let meta = {};
    if (node['create-time']) meta.created = new Date(node['create-time']);
    if (node['edit-time']) meta.lastModified = new Date(node['edit-time']);
    if (node.children) {
      try {
        node.children.forEach(kid => {
          let match = kid.string && kid.string.match(/^\s*\*\*\s*(status|thread|author|by|date|lang|publisher|related|retrieved|url|type|email)\s*\*\*\s*:\s*(.*)/i);
          if (match) {
            let [, key, value] = match;
            key = key.toLowerCase();
            if (key === 'by') key = 'author';
            meta[key] = value;
          }
          else throw new Error('Hammer Time!');
        });
      }
      catch (e) {}
    }
    rootMetadata[node.title] = meta;
  });
}

function allChildren (node) {
  let kids = [];
  if (node.children) {
    Array.prototype.push.apply(kids, node.children);
    node.children.forEach(kid => Array.prototype.push.apply(kids, allChildren(kid)));
  }
  return kids;
}
