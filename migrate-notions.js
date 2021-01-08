#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , notions = require('./last-roam/notions.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(notions).map(k => notions[k])
  , notionsPage = '779fec18-8ccf-46bb-9228-d061535f3e20'
  , notionsCollection = 'ac7c316c-01e4-4daf-a7e9-8695ee9a4bd6'
  , ucfirst = (str = '') => str[0].toUpperCase() + str.slice(1)
  , propName = {
      status:     'Q@YA',
    }
;

async function run () {
  await nc.init();
  for (let notion of data) {
    process.stdout.write(`Migrating ${notion.ROBIN_TITLE} (${notion.ROBIN_UUID})…`);
    await nc.createEmptyRecord(notion.ROBIN_UUID, notionsPage, notionsCollection, { created: notion['create-time'], lastModified: notion['edit-time'] });
    let props = { title: notion.ROBIN_TITLE }
      , { status } = notion.ROBIN_META || {}
    ;
    if (status) props[propName.status] = [[ucfirst(status.replace(/^#/, ''))]];
    await nc.setProperties(notion.ROBIN_UUID, props);
    await nc.setIcon(notion.ROBIN_UUID, '📒');
    if (notion.children && notion.children.length) await nc.addPageContent(notion);
    process.stdout.write(`Done!\n`);
  }
}
run();
