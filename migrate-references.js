#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , refs = require('./last-roam/references.json')
  , people = require('./last-roam/people.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(refs).map(k => refs[k])
  , refsPage = '8b779ab6-c1f8-4351-97ca-783d5452ff8a'
  , refsCollection = '97e380a5-ab4c-4a9b-a9c0-18d636978581'
  , ucfirst = (str = '') => str[0].toUpperCase() + str.slice(1)
  , propName = {
      type:       'mr=m',
      status:     'tcLb',
      author:     '^Ekz',
      url:        'rtvW',
      publisher:  'XJuM',
      date:       'VQgI',
      related:    ':OO}',
      retrieved:  'J|q<',
      thread:     '<I_S',
    }
;

async function run () {
  await nc.init();
  for (let ref of data) {
    process.stdout.write(`Migrating ${ref.ROBIN_TITLE} (${ref.ROBIN_UUID})…`);
    await nc.createEmptyRecord(ref.ROBIN_UUID, refsPage, refsCollection, { created: ref['create-time'], lastModified: ref['edit-time'] });
    let props = { title: ref.ROBIN_TITLE }
      , {
          type, status, author, url, publisher, date, related, retrieved, thread
        } = ref.ROBIN_META || {}
    ;
    if (type) props[propName.type] = [[ucfirst(type.replace(/^#/, ''))]];
    if (status) props[propName.status] = [[ucfirst(status.replace(/^#/, ''))]];
    if (author) props[propName.author] = parseMeta(author, 'author', ref);
    if (url) props[propName.url] = [[url, [['a', url]]]];
    if (publisher) props[propName.publisher] = parseMeta(publisher, 'publisher', ref);
    if (date) props[propName.date] = [[date]];
    if (related) props[propName.related] = parseMeta(related, 'related', ref);
    if (retrieved) {
      props[propName.retrieved] = [['‣', [['d', {
        type: 'date',
        start_date: new Date(retrieved.replace(/\[|\]/g, '')).toISOString().replace(/T.*/, '')
      }]]]];
    }
    if (thread) props[propName.thread] = [[thread, [['a', thread]]]];
    await nc.setProperties(ref.ROBIN_UUID, props);
    await nc.setIcon(ref.ROBIN_UUID, '📘');
    if (ref.children && ref.children.length) await nc.addPageContent(ref);
    process.stdout.write(`Done!\n`);
  }
}
run();

function parseMeta (str, type, ref) {
  let names = str.match(/\[\[[^\]]+\]\]/g).map(au => au.replace(/^\[\[|\]\]$/g, ''))
    , authors = []
  ;
  names.forEach((n, idx) => {
    if (idx) authors.push([', ']);
    let node = people[n];
    if (!node) {
      console.warn(`>>> Object '${type}' node not found for ${n} in ${ref.ROBIN_TITLE}`);
      authors.push([n]);
    }
    else {
      authors.push(['‣', [['p', node.ROBIN_UUID]]]);
    }
  });
  return authors;
}
