#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  // , dates = require('./last-roam/dates.json')
  , nyt = require('./last-roam/nyt.json')
  // , ukn = require('./last-roam/unknown.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  // , miscPage = 'c38da0e1-e674-4960-aacb-f5b726dac6f9'
  , nytPage = 'da55380a-cf9c-4640-b95a-6cc625ee594c'
  , skip = new Set([
      'Times Todo',
      'Data Governance @ NYT',
      'California Class Action Litigation Hold 2020',
      'Content Aggregation Technology (CAT)',
      'governance.js',
      'Identity Strategy',
      'State of Privacy 2020 H2',
      'Data Ethics at The Times',
      'Privacy Hub',
      'W3C Training',
      'Data Quality',
      'WAN-IFRA Slides 2020-11',
      'DLI Presentation',
    ])
;

async function run () {
  await nc.init();
  // process.stdout.write(`••• Dates\n`);
  // await runBatch(Object.values(dates), miscPage);
  // process.stdout.write(`••• Uknowns\n`);
  // await runBatch(Object.values(ukn), miscPage);
  process.stdout.write(`••• NYT\n`);
  await runBatch(Object.values(nyt), nytPage);
}
run();

async function runBatch (data, parentPage) {
  for (let notion of data) {
    if (skip.has(notion.ROBIN_TITLE.toString())) continue;
    process.stdout.write(`Migrating ${notion.ROBIN_TITLE} (${notion.ROBIN_UUID})…`);
    await nc.createEmptyPage(notion.ROBIN_UUID, parentPage, { created: notion['create-time'], lastModified: notion['edit-time'] });
    await nc.setProperties(notion.ROBIN_UUID, { title: notion.ROBIN_TITLE });
    if (notion.children && notion.children.length) await nc.addPageContent(notion);
    process.stdout.write(`Done!\n`);
  }
}
