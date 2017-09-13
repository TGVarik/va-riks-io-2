'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const glob = require('glob').sync;
const mkdirp = require('mkdirp').sync;
const Ghost = require('ghost');
const modernizr = require('modernizr');

let themeAssets = require('./themeAssets.json');

Promise.all([
  copyAssets(themeAssets, path.resolve(process.cwd(), 'content/themes/ghostium/assets')),
  buildModernizr()
])
.then(() => {
  return Ghost();
})
.then((ghost) => {
  ghost.start();
})
.catch((err) => {
 console.error(err.stack);
 process.exit(-1)
});

function buildModernizr() {
  return new Promise((resolve) => {
    modernizr.build({
      options: [
      'prefixed',
      'setClasses'
      ]
    }, (res) => {
      mkdirp(path.resolve(process.cwd(), 'content/themes/ghostium/assets/js'));
      fs.writeFileSync(path.resolve(process.cwd(), 'content/themes/ghostium/assets/js/modernizr.js'), res);
      resolve();
    });
  });
}

function copyAssets(assets, destPrefix) {
  let promises = [];
  for (let destFolder in assets) {
    let sourceGlobs = assets[destFolder];
    if (destPrefix) {
      destFolder = path.join(destPrefix, destFolder);
    }
    destFolder = path.resolve(process.cwd(), destFolder);
    if (!fs.existsSync(destFolder)) {
      mkdirp(destFolder);
    }

    let sources = [...new Set([].concat(...sourceGlobs
    .map((sourceGlob) => {
      return glob(sourceGlob, {absolute: true});
    })))];

    for (let src of sources) {
      let dest = path.join(destFolder, path.basename(src));
      if (fs.existsSync(dest)) {
        promises.push(Promise.all([
          hashFile(src),
          hashFile(dest)
        ])
        .then(([srcHash, destHash]) => {
          if (srcHash !== destHash) {
            return copyAsset(src, dest);
          }
        }));
      } else {
        promises.push(copyAsset(src, dest));
      }
    }


  }
  return Promise.all(promises);
}

function copyAsset(src, dest) {
  return new Promise((resolve, reject) => {
    fs
    .createReadStream(src)
    .pipe(fs.createWriteStream(dest))
    .on('error', (err) => {
      reject(err);
    })
    .on('finish', () => {
      resolve();
    });
  });
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    let hash = crypto.createHash('sha256');
    fs.createReadStream(filePath)
    .on('data', (data) => {
      hash.update(data);
    })
    .on('end', () => {
      resolve(hash.digest('hex'));
    })
    .on('error', (err) => {
      reject(err);
    });
  });
}
