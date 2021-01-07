#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , tags = require('./last-roam/hashtags.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(tags).map(k => tags[k])
  , tagsPage = '1e78b966-8b64-46da-b2a4-f7391e77b1d6'
  , tagsCollection = '7124aa0d-c8e4-4acd-b148-aa1b2cd67210'
;

async function run () {
  await nc.init();
  for (let tag of data) {
    process.stdout.write(`Migrating ${tag.ROBIN_TITLE} (${tag.ROBIN_UUID})…`);
    await nc.createEmptyRecord(tag.ROBIN_UUID, tagsPage, tagsCollection, { created: tags['create-time'], lastModified: tags['edit-time'] });
    await nc.setProperties(tag.ROBIN_UUID, { title: tag.ROBIN_TITLE });
    await nc.setIcon(tag.ROBIN_UUID, '#️⃣');
    process.stdout.write(`Done!\n`);
  }
}
run();
