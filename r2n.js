
let { readFileSync, mkdirSync } = require('fs')
  , { join } = require('path')
  , rmdb = '/Users/208664/.kipple/data/roam/robin@berjon.com/robinberjon/robinberjon.json'
  , outDir = join(__dirname, 'output')
  , data = JSON.parse(readFile(rmdb))
;

mkdirSync(outDir, { recursive: true });

// XXX
//  - this is depressing how bad it is
//  - 

// XXX:
// Experiment:
//  - can we import with an icon?
//  - can we import with identifiers that understand themselves?
//  - can we import with links that are recognised between docs?
//  - can we import maths, maybe just with the annotation?
// Code:
//  - index nodes (steal from Kipple)
//  - name to icon
//  - extract metadata
//  - turn authors into people (icon, ensure type)
//  - list duplicate nodes
//  - convert MD
//  - keep as bullets (except headings)
//  - metadata as tables
//  - pull in images
//  - start with those that don't have outgoing links, then those that link to nothing but those...
//  - link to self doesn't count
//  - try to geen
