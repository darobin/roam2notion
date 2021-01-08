#!/usr/bin/env node
/* eslint no-await-in-loop: 0 */

let { token } = require('./secrets.json')
  , people = require('./last-roam/people.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
  , data = Object.keys(people).map(k => people[k])
  , peoplePage = '750824a8-f04a-4913-b699-54e1326a9a83'
  , peopleCollection = '33aa975f-3c5b-438f-806f-a5021912f8e3'
;

async function run () {
  await nc.init();
  for (let person of data) {
    process.stdout.write(`Migrating ${person.ROBIN_TITLE} (${person.ROBIN_UUID})…`);
    await nc.createEmptyRecord(person.ROBIN_UUID, peoplePage, peopleCollection, { created: person['create-time'], lastModified: person['edit-time'] });
    await nc.setProperties(person.ROBIN_UUID, { title: person.ROBIN_TITLE });
    await nc.setIcon(person.ROBIN_UUID, '⚫');
    if (person.children && person.children.length) await nc.addPageContent(person);
    process.stdout.write(`Done!\n`);
  }
}
run();
