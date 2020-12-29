
let { token } = require('./secrets.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
;

// XXX:
//  - Convert data
//    - apply kill list
//    - index nodes
//    - resolve embeds
//    - detect people
//    - extract metadata and type/icon
//    - convert MD to Notion's internal format
//  - Upload
//    - create empty blocks with titles, in the right places
//    - save name to uuid mapping
//    - process all links accordingly
//    - upload all content in transactions

async function run () {
  await nc.init();
  // let refPage = await nc.getBlock('https://www.notion.so/Migrate-From-Roam-88be6e0cdbff4d5baba923fb8243d16f');
  let refPage = await nc.getBlock('49bafe7f-c189-4e2d-97b4-3be87fbd90a0');
  // let refPage = await nc.getBlock('https://www.notion.so/8b779ab6c1f8435197ca783d5452ff8a?v=86347cf2435e425180b0bf358859ee07&p=fc91b05147b24774a949e8784850f009');
  // let refPage = await nc.getBlock('https://www.notion.so/8b779ab6c1f8435197ca783d5452ff8a?v=86347cf2435e425180b0bf358859ee07');
  console.log(JSON.stringify(refPage, null, 2));
}
run();
