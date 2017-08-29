document.addEventListener('DOMContentLoaded', () => {
  renderStatus('Loading...');

  getCurrentTab()
    .then(tab => {
      url = new URL(tab.url);

      let pathSegments = url.pathname.split('/')
        .filter(x => x);
      let queryStringValues = Array.from(url.searchParams.values());

      let urlSegements = pathSegments.concat(queryStringValues)
        .map(decodeURIComponent);
      let candidates = flatten(
        urlSegements.map(x => getBase64Candidates(x)));
      candidates = flatten(candidates.map(x => [x, x.slice(0, x.length - 1)]));
      console.log('candidates', candidates);

      let nonPrintableAscii = range(0xa)
        .concat([0xb, 0xc])
        .concat(range(0xe, 0x20))
        .concat(range(0x7f, 0xa0))
        .map(x => String.fromCharCode(x));

      let result = candidates
        .map(tryBase64Decode)
        .filter(x => x)
        .filter(x => !stringContainsAny(x, nonPrintableAscii))
        .filter(x => Array.from(x).length > 3)
        .map(tryParseJson)
        ;


      renderStatus('Url: '+ JSON.stringify(result, null, 4));
    })
    .catch(e => {
      renderStatus('There was an error. ' + e);
      console.error(e);
    });
});

function range(m, n) {
  if (n === undefined) {
    n = m;
    m = 0;
  }

  m = +m;
  n = +n;

  let length = n - m;
  length |= 0;

  return [...Array(length).keys()].map(i => i + m);
}

function stringContainsAny(str, characters) {
  characters = Array.from(characters);
  str = Array.from(str);
  return characters.some(x => str.includes(x));
  //for (let c of str) {
  //  if (characters.includes(c)) {
  //    return true;
  //  }
  //}
  //return false;
}

function tryBase64Decode(str) {
  try {
    return atob(str);
  }
  catch (e) {
    return '';
  }
}

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  }
  catch (e) {
    return str;
  }
}

function flatten(arr) {
  arr = arr || [];
  return arr.reduce((l, r) => l.concat(r), []);
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function getBase64Candidates(str) {
  str = str || '';
  return str.match(/[a-zA-Z0-9-_+=\/]{4,}/g) || [];
}

function getCurrentTab() {
  return new Promise(resolve => {
    let queryInfo = {
      active: true,
      currentWindow: true
    };

    chrome.tabs.query(queryInfo, tabs => resolve(tabs[0]));
  });
}
