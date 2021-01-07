
let { writeFileSync, readFileSync } = require('fs')
  , { join } = require('path')
  , { v4: uuidv4 } = require('uuid')
  , db = require('./last-roam/robinberjon.json')
  , killList = new Set([
      'Big Test Page',
      'embed',
      'TODO',
      'Quick Capture',
      'DONE',
      'POMO',
      'Characters',
      'roam/js',
      'roam/css',
      'Robin\'s CSS Theme',
      'diagram',
      'calc',
      'read:',
      'Projects',
      'Next Actions',
      'calc',
    ])
  , forcePeople = new Set([
      'David Deutsch',
      'Chiara Marletto',
      'Helen Nissenbaum',
      'Brave',
      'Apple',
      'Johnny Ryan',
      'Glimpse Protocol',
      'David Hilbert',
      'L. E. J. Brouwer',
      'Rebecca Spang',
      'William Sewell Jr.',
      'Saul Kripke',
      'Rognvaldur Ingthorsson',
      'Rebecca Grossman Cohen',
      'Shane Murray',
      'Jon Tien',
      'Advance',
      'Max Gendler',
      'Avast / Jumpshot',
      'VICE',
      'ODI',
      'Henry Corrigan-Gibbs',
      'Mozilla',
      'WP29',
      'ITEGA',
      'Gregory Chaitin',
      'Erik Hoel',
      'Jessica Flack',
      'Unilever',
      'Alice Fung',
      'Richard Hamming',
      'Peter Kelder',
      'Stough',
      'Mike Mew',
      'Wim Hof',
      'Luíz Sérgio Álvares DeRose',
      'Swami Rama',
      'Sri Sri Ravi Shankar',
      'Patrick McKeown',
      'Shannon Vallor',
      'Nolen Gertz',
      'News Media Alliance',
      'Hal Singer',
      'Shushana Zuboff',
      'Dave Singer',
      'Niklas Luhmann',
      'Nicolas Gisin',
      'Andrey Markov',
      'Emil Post',
      'Hannah Arendt',
      'Ryan Calo',
      'Paula J. Dalley',
      'John Holland',
      'Wesley Salmon',
      'Phil Dowe',
      'John Searle',
      'Danielle Citron',
      'Ben Wittes',
      'Cecilia Heyes',
      'Tracy Dennis-Tiwari',
      'David Graeber',
      'Manu Saadia',
      'Elinor Ostrom',
      'Judge Hidalgo',
      'Kelsey Johnson',
      'Max Weber',
      'Mark Colyvan',
      'Rainer Forst',
      'Michel Foucault',
      'Steven Lukes',
      'Jean Baubérot',
      'WHATWG',
      'W3C',
      'IETF',
      'Digital Content Next',
      'European Commission',
      'Aaron Krolik',
      'Safyia Noble',
      'Matt Weinberg',
      'Robin Berjon',
      'The Economist',
      'Omid Rafieian',
      'Angela Merkel',
      'Kurt Gödel',
      'Evan Selinger',
      'Alan Turing',
      'Arend Heyting',
      'Andrey Kolmogorov',
      'Isaac Newton',
      'Hermann Weyl',
      'Robin West',
    ])
  , forceNotion = new Set([
      'Computation',
      'Adtech',
      'Renormalisation',
      'Path Integrals',
      'Algorithmic Information Theory',
      'Probability',
      'The Great Filter',
      'Web Bundles — Notes',
      'What Is Computation?',
      'Biases',
      'Eutrapelia (graceful playfulness)',
      'Hacker',
      'Austerity (virtue)',
      'Zettlekasten',
      'European Construction',
      'Europe',
      'High Modernism',
      'GTD',
      'Education Methods',
    ])
  , forceReference = new Set([
      'Common-Knowledge Attacks on Democracy',
      'How Revolutions Happen',
      'GDPR',
      'WebID',
      'WebBundles',
      'The Hacker Ethic',
      'CPNI',
      'Frida',
      'Quantum Theory, the Church-Turing Principle, and the Universal Quantum Computer',
      'Cognitive Gadgets',
      'Polarisation',
      'Free the Tipple',
      'Les 7 laïcités françaises. Le modèle français de laïcité n’existe pas',
      'Architecture of the World Wide Web, Volume I',
      'Google Data Collection',
      'HTML Design Principles',
      'RFC 6265: HTTP State Management Mechanism',
      'Watching the Watchers: Nonce-based Inverse Surveillance to Remotely Detect Monitoring',
      '§230',
      'The Utopia of Rules',
    ])
  , forceIdea = new Set([
      'Social Media, Narratives, and Democracy',
      'Fair Market Places (FMP)',
      'JavaScript Browser ',
      'Shadow Noosphere',
      'Islamophobie en France',
      'Chrome Reverse Surveillance',
      'Geopolitics of the Internet',
    ])
  , forceNYT = new Set([
      'Times Todo',
      'Data Governance @ NYT',
      'California Class Action Litigation Hold 2020',
      'Content Aggregation Technology (CAT)',
      'governance.js',
      'Identity Strategy',
      'Data Ethics at The Times',
      'Privacy Hub',
      'W3C Training',
      'Data Quality',
      'WAN-IFRA Slides 2020-11',
      'State of Privacy 2020 H2',
      'DLI Presentation',
    ])
  , forceProject = new Set([
      'Privately Yours',
      'Enough To Be Dangerous',
      'Technocracy',
      'Next Job',
      'Learning Physics',
      'SPOC',
      'The Last Stand',
      'Smashing Privacy Article',
      'Opinionated',
    ])
  , forceHashtag = new Set([
      'read',
      'duplicates',
      'print',
      'adtech',
      'optinionated',
      'trust',
      'article',
      'book',
      'company',
      'inbox',
      'ok',
      'archived',
      'published',
      'draft',
      'table',
      'cocktail',
      'standard',
      'person',
      'someday',
      'q',
    ])
  , rootNodesByName = {}
  , nodesByUID = {}
  , uid2root = {}
  , rootMetadata = {}
  , people = {}
  , references = {}
  , notions = {}
  , ideas = {}
  , projects = {}
  , dates = {}
  , hashtags = {}
  , nyt = {}
  , unknown = {}
  , stableUUIDs = {}
;

loadUUIDs();
indexNodes(db);
resolveEmbeds();
findPeople();
sortTypes();
processMD();
flatten();
save();

function loadUUIDs () {
  try {
    stableUUIDs = JSON.parse(readFileSync(join(__dirname, 'last-roam/stable-uuids.json')));
  }
  catch (e) {}
}

function uuid (title) {
  if (!title) return console.warn(`NO TITLE GIVEN!`);
  if (stableUUIDs[title]) return stableUUIDs[title];
  stableUUIDs[title] = uuidv4();
  return stableUUIDs[title];
}

function indexNodes (data) {
  data.forEach(node => {
    if (killList.has(node.title)) {
      console.warn(`Killed "${node.title}"`);
      return;
    }
    rootNodesByName[node.title] = node;
    node.ROBIN_UUID = uuid(node.title);
    allChildren(node).forEach(kid => {
      if (kid.uid) {
        nodesByUID[kid.uid] = kid;
        uid2root[kid.uid] = node.title;
        kid.ROBIN_UUID = uuid(kid.uid);
      }
      else console.warn(`Child node did not have uid: ${JSON.stringify(kid)}`);
    });
    let meta = {};
    if (node['create-time']) meta.created = new Date(node['create-time']);
    if (node['edit-time']) meta.lastModified = new Date(node['edit-time']);
    if (node.children) {
      try {
        node.children = node.children.filter(kid => {
          let match = kid.string && kid.string.match(/^\s*\*\*\s*(status|thread|author|by|date|lang|publisher|related|retrieved|url|type|email)\s*\*\*\s*:\s*(.*)/i);
          if (match) {
            let [, key, value] = match;
            key = key.toLowerCase();
            if (key === 'by') key = 'author';
            meta[key] = value;
            return false;
          }
          return true;
        });
      }
      catch (e) {}
    }
    rootMetadata[node.title] = meta;
    rootNodesByName[node.title].ROBIN_META = meta;
  });
}

function allChildren (node) {
  let kids = [];
  if (node.children) {
    Array.prototype.push.apply(kids, node.children);
    node.children.forEach(kid => Array.prototype.push.apply(kids, allChildren(kid)));
  }
  return kids;
}

// {{[[embed]]: ((4YAViO6u0))}}
// ((JA4sjnXba))
function resolveEmbeds () {
  Object.keys(rootNodesByName).forEach(title => {
    let node = rootNodesByName[title];
    allChildren(node).forEach(kid => {
      if (!kid.string) return;
      kid.string = kid.string.replace(/\{\{\[\[embed]]: \(\(([^)]+)\)\)}}/g, (_, uid) => {
        // the goal here is that these will get converted to callouts
        kid.ROBIN_TYPE = 'embed'; // map to callouts
        let n = nodesByUID[uid]
          , srcTitle = uid2root[uid]
        ;
        if (n) {
          if (kid.children) kid.children.unshift(n);
          else kid.children = [n];
        }
        return srcTitle ? `[[${srcTitle}]]` : '**Unknown Embed**';
      });
      kid.string = kid.string.replace(/\(\(([^)]+)\)\)/g, (_, uid) => {
        let n = nodesByUID[uid]
          , srcTitle = uid2root[uid]
          , body = n ? n.string : '"Unknown Embed"'
        ;
        if (srcTitle) body += ` ([[${srcTitle}]])`;
        return body;
      });
    });
  });
}

function findPeople () {
  Object.keys(rootNodesByName).forEach(title => {
    let meta = rootMetadata[title];
    if (meta.author) {
      meta.author.replace(/\[\[([^\]]+)]]/g, (_, person) => {
        people[person] = rootNodesByName[person];
      });
    }
  });
}

function sortTypes () {
  Object.keys(rootNodesByName).forEach(title => {
    let node = rootNodesByName[title];
    if (people[title]) return;
    if (forcePeople.has(title)) return people[title] = node;
    if (forceNotion.has(title)) return notions[title] = node;
    if (forceIdea.has(title)) return ideas[title] = node;
    if (forceReference.has(title)) return references[title] = node;
    if (forceProject.has(title)) return projects[title] = node;
    if (forceHashtag.has(title)) return hashtags[title] = node;
    if (forceNYT.has(title)) return nyt[title] = node;
    if (/^🟦/.test(title)) return references[title] = node;
    if (/^🟨/.test(title)) return notions[title] = node;
    if (/^🟩/.test(title)) return ideas[title] = node;
    if (/^★/.test(title)) return projects[title] = node;
    if (/^\d{4}$/.test(title) || /^\w+ \d+\w+, \d{4}$/.test(title)) return dates[title] = node;
    unknown[title] = node;
  });
}

function processMD () {
  Object.keys(rootNodesByName).forEach(title => {
    let node = rootNodesByName[title];
    node.ROBIN_TITLE = [[
      node.title
        ? node.title.replace(/^(?:🟦|🟨|🟩|★)\s*/, '')
        : `Untitled ${node.ROBIN_UUID}`
    ]];
    allChildren(node).forEach(kid => {
      if (!kid.string) return;
      let todoRx = /\{{2,}\[\[TODO\]\]\}{2,}/
        , doneRx = /\{{2,}\[\[DONE\]\]\}{2,}/
        , tableRx = /\{{2,}\[\[table\]\]\}{2,}/
        , diagramRx = /\{{2,}\[\[diagram\]\]\}{2,}/
        , bqRx = /^\s*>\s*/
        , imgRx = /!\[([^\]]*)\]\(([^)]+)\)/g
      ;
      if (kid.heading) {
        kid.ROBIN_TYPE = 'heading';
        kid.ROBIN_HEADING_LEVEL = kid.heading;
      }
      else if (todoRx.test(kid.string)) {
        kid.ROBIN_TYPE = 'to_do';
        kid.ROBIN_TODO_CHECKED = false;
        kid.string = kid.string.replace(todoRx, '');
      }
      else if (doneRx.test(kid.string)) {
        kid.ROBIN_TYPE = 'to_do';
        kid.ROBIN_TODO_CHECKED = true;
        kid.string = kid.string.replace(doneRx, '');
      }
      kid.string = kid.string.replace(/\{\{\[\[embed]]: (.*)}}/, '$1');
      if (tableRx.test(kid.string)) {
        kid.string = kid.string.replace(tableRx, '**XXX TABLE BELOW XXX**');
        console.warn(`• Convert table in page ${node.title} (each direct child is a row, columns are sub items in turn for each row)`);
      }
      if (diagramRx.test(kid.string)) {
        kid.string = kid.string.replace(diagramRx, '**XXX DIAGRAM HERE XXX**');
        console.warn(`• Convert diagram in page ${node.title}`);
      }
      if (bqRx.test(kid.string)) {
        kid.ROBIN_TYPE = 'quote';
        kid.string = kid.string.replace(bqRx, '');
        if (kid.children && kid.children.length) console.warn(`### Node ${kid.ROBIN_UUID} is a quote with children`);
      }
      if (imgRx.test(kid.string)) {
        kid.string = kid.string.replace(imgRx, '**XXX INSERT IMAGE "$2" WITH ALT "$1" XXX**');
        console.warn(`• Embed image in page ${node.title}`);
      }
      // We split the string into a series of potential tokens.
      // We then walk the tokens to produce Notion markup.
      // In order: Roam links, math, links, bold, italics, code, strike, tags
      let tokens = kid.string.split(/((?:\[\[[^\]]+\]\])|(?:\$\$.*?\$\$)|(?:\[[^\]]+\]\([^)]+\))|(?:\*\*)|(?:__)|(?:`)|(?:~~)|(?:#\w+))/).filter(Boolean)
        , states = {
            b: false,
            i: false,
            c: false,
            s: false,
          }
        , token2state = {
            '**': 'b',
            __: 'i',
            '`': 'c',
            '~~': 's',
          }
        , state2notion = () => Object.keys(states).map(k => states[k] ? [k] : false).filter(Boolean)
        , notion = []
        , roamLinkRx = /^\[\[([^\]]+)\]\]$/
        , mathRx = /^\$\$(.*?)\$\$$/
        , linkRx = /^\[([^\]]+)\]\(([^)]+)\)$/
        , tagRx = /^#(\w+)$/
      ;
      while (tokens.length) {
        let tok = tokens.shift();
        if (roamLinkRx.test(tok)) {
          let [, tit] = tok.match(roamLinkRx)
            , target = rootNodesByName[tit]
          ;
          if (!target) {
            console.warn(`Found token ${tok} in ${node.title} but it has no matching target.`);
            continue;
          }
          notion.push(['‣', [['p', target.ROBIN_UUID]]]);
        }
        else if (tagRx.test(tok)) {
          let [, tit] = tok.match(tagRx)
            , target = rootNodesByName[tit]
          ;
          if (!target) {
            console.warn(`Found token ${tok} as tag ${tit} in ${node.title} but it has no matching target.`);
            continue;
          }
          notion.push(['‣', [['p', target.ROBIN_UUID]]]);
        }
        else if (mathRx.test(tok)) {
          let [, math] = tok.match(mathRx);
          notion.push(['⁍', [['e', math]]]);
        }
        else if (linkRx.test(tok)) {
          let [, text, link] = tok.match(linkRx);
          notion.push([text, state2notion().concat([['a', link]])]);
        }
        else if (token2state[tok]) {
          states[token2state[tok]] = !states[token2state[tok]];
        }
        else {
          let st = state2notion();
          notion.push([tok, st.length ? st : false].filter(Boolean));
        }
      }
      kid.ROBIN_NOTION = notion;

      // warn if we reach the end and not all tokens are false
      if (Object.values(states).find(s => s)) {
        console.warn(`In ${node.title}, got child "${kid.string}" that parsed unbalanced (${JSON.stringify(states)}):\n${JSON.stringify(notion, null, 2)}`);
      }
    });
  });
}

function flatten () {
  Object.keys(rootNodesByName).forEach(title => {
    let node = rootNodesByName[title];
    flattenByType(node, 'heading');
  });
}

function flattenByType (node, type, changeKids = () => {}) {
  if (!node.children) return;
  let sourceKids = node.children.concat();
  for (let i = 0; i < sourceKids.length; i++) {
    let kid = sourceKids[i];
    if (kid.children && kid.children.length) {
      if (kid.ROBIN_TYPE === type) {
        let insertKids = kid.children;
        delete kid.children;
        insertKids.forEach(changeKids);
        Array.prototype.splice.apply(sourceKids, [i + 1, 0].concat(insertKids));
      }
      else flattenByType(kid, type, changeKids);
    }
  }
  node.children = sourceKids;
}

function save () {
  let out = {
    people,
    references,
    notions,
    ideas,
    projects,
    dates,
    hashtags,
    nyt,
    unknown,
    'stable-uuids': stableUUIDs,
  };
  Object.keys(out).forEach(k => {
    writeFileSync(join(__dirname, 'last-roam', `${k}.json`), JSON.stringify(out[k], null, 2));
  });
}
