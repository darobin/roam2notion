#!/usr/bin/env node

let { program } = require('commander')
  , { writeFileSync } = require('fs')
  , { join, isAbsolute } = require('path')
  , { token } = require('./secrets.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
;

// --version
program.version(require('./package.json').version);

program
  .requiredOption('-i, --id <id>', 'ID of the Notion document')
  .option('-o, --out <file>', 'File to write to')
;

// now do something
program.parse(process.argv);

// console.log(program.id, program.out);

// https://www.notion.so/Migrate-From-Roam-88be6e0cdbff4d5baba923fb8243d16f
async function run () {
  await nc.init();
  let refPage = await nc.getBlock(program.id)
    , json = JSON.stringify(refPage, null, 2)
  ;
  if (program.out) {
    let file = isAbsolute(program.out) ? program.out : join(process.cwd(), program.out);
    writeFileSync(file, json);
  }
  else process.stdout.write(json);
}
run();
