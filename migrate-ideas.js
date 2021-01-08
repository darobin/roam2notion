#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , ideas = require('./last-roam/ideas.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(ideas).map(k => ideas[k])
  , ideasPage = '92a76446-1af9-40d0-86d9-38261e00d744'
  , ideasCollection = 'dd298559-21a1-4d9c-aa03-501f6b06402b'
  , ucfirst = (str = '') => str[0].toUpperCase() + str.slice(1)
  , propName = {
      status: 'GFl=',
    }
  , skip = new Set([
      'a2c657ab-006d-4ad3-b184-ae1c71f2dd79',
      '8ee2407e-73fa-437a-9a65-64e7c06e9ce7',
      '9d9f94ed-d8d4-444a-995f-c518c797c4c1',
      'def06034-cca0-4cf9-aa78-6b1f5f8eab01',
      'c6e1e9ad-f329-4198-98d0-f53d7e736c65',
      '8f8a2406-5bb6-44f2-bbfc-dbc0f128fd2d',
      'd26babcf-071a-4a48-922d-68205bacc479',
      '3b6800c3-346a-4ec4-af5b-1fffa974d4d4',
      'a8681205-fccd-4280-89ce-3a256c0f35ac',
      '6359dd83-59bf-4394-a29b-289030d6cc52',
    ])
;

async function run () {
  await nc.init();
  for (let idea of data) {
    if (skip.has(idea.ROBIN_UUID)) {
      process.stdout.write(`Skipping ${idea.ROBIN_TITLE} (${idea.ROBIN_UUID}) ###\n`);
      continue;
    }
    process.stdout.write(`Migrating ${idea.ROBIN_TITLE} (${idea.ROBIN_UUID})…`);
    await nc.createEmptyRecord(idea.ROBIN_UUID, ideasPage, ideasCollection, { created: idea['create-time'], lastModified: idea['edit-time'] });
    let props = { title: idea.ROBIN_TITLE }
      , { status } = idea.ROBIN_META || {}
    ;
    if (status) props[propName.status] = [[ucfirst(status.replace(/^#/, ''))]];
    await nc.setProperties(idea.ROBIN_UUID, props);
    await nc.setIcon(idea.ROBIN_UUID, '📗');
    if (idea.children && idea.children.length) await nc.addPageContent(idea);
    process.stdout.write(`Done!\n`);
  }
}
run();
