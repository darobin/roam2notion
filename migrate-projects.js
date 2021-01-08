#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , projects = require('./last-roam/projects.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(projects).map(k => projects[k])
  , projectsPage = '085e9199-7fbb-4077-ba99-549c103a5ece'
  , projectsCollection = '4d0384a5-2b47-41c6-bd06-43113b805e75'
  , ucfirst = (str = '') => str[0].toUpperCase() + str.slice(1)
  , propName = {
      status: 'rPbE',
    }
;

async function run () {
  await nc.init();
  for (let prj of data) {
    process.stdout.write(`Migrating ${prj.ROBIN_TITLE} (${prj.ROBIN_UUID})…`);
    await nc.createEmptyRecord(prj.ROBIN_UUID, projectsPage, projectsCollection, { created: prj['create-time'], lastModified: prj['edit-time'] });
    let props = { title: prj.ROBIN_TITLE }
      , { status } = prj.ROBIN_META || {}
    ;
    if (status) props[propName.status] = [[ucfirst(status.replace(/^#/, ''))]];
    await nc.setProperties(prj.ROBIN_UUID, props);
    await nc.setIcon(prj.ROBIN_UUID, '✨');
    if (prj.children && prj.children.length) await nc.addPageContent(prj);
    process.stdout.write(`Done!\n`);
  }
}
run();
