
let { token } = require('./secrets.json')
  , NotionClient = require('./notion-client')
  , nc = new NotionClient({ token })
;

let refPage = nc.getBlock('https://www.notion.so/8b779ab6c1f8435197ca783d5452ff8a?v=86347cf2435e425180b0bf358859ee07');
