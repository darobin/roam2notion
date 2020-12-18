
let { readFileSync, mkdirSync } = require('fs')
  , { join } = require('path')
  , rmdb = '/Users/208664/.kipple/data/roam/robin@berjon.com/robinberjon/robinberjon.json'
  , outDir = join(__dirname, 'output')
  , data = JSON.parse(readFile(rmdb))
;

mkdirSync(outDir, { recursive: true });
