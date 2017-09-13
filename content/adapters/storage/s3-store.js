'use strict';

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const BaseStore = require('ghost-storage-base');
const Promise = require('bluebird');

AWS.config.setPromisesDependency(Promise);

function stripLeadingSlash(str) {
  return str.replace(/^\/+/, '');
}

class S3Store extends BaseStore {

  constructor(config = {}) {
    if (!config.bucket) {
      throw new Error('s3-storage-module requires bucket in config!');
    }
    super(config);
    this.bucket = config.bucket;
    this.region = config.region || 'us-west-2';
    this.pathPrefix = config.pathPrefix || '';
    this.host = `https://s3${this.region === 'us-east-1' ? '' : `-${this.region}`}.amazonaws.com/${this.bucket}`;
    if (config.accessKeyId && config.secretAccessKey) {
      this.accessKeyId = config.accessKeyId;
      this.secretAccessKey = config.secretAccessKey;
    }
  }

  get s3 () {
    if (!this._s3) {
      let opts = {
        region: this.region
      };
      if (this.accessKeyId && this.secretAccessKey) {
        opts.accessKeyId = this.accessKeyId;
        opts.secretAccessKey = this.secretAccessKey;
      }
      this._s3 = new AWS.S3(opts);
    }
    return this._s3;
  }

  save(image, targetDir) {
    targetDir = targetDir || this.getTargetDir(this.pathPrefix);
    return Promise.all([
      this.getUniqueFileName(image, targetDir),
      readFile(image.path)
    ])
    .then(([filename, file]) => {
      return this.s3.putObject({
        ACL: 'public-read',
        Body: file,
        Bucket: this.bucket,
        CacheControl: `max-age=${30*24*60*60}`,
        ContentType: image.type,
        Key: stripLeadingSlash(filename)
      }).promise()
      .then(() => {
        return `${this.host}/${stripLeadingSlash(filename)}`;
      });
    });
  }

  serve() {
    return (req, res, next) => {
      this.s3.getObject({
        Bucket: this.bucket,
        Key: stripLeadingSlash(req.path)
      })
      .createReadStream()
      .on('error', (err) => {
        res.status(404);
        next(err);
      })
      .pipe(res);
    };
  }

  delete(filename, targetDir) {
    targetDir = targetDir || this.getTargetDir(this.pathPrefix);
    return this.s3.deleteObject({
      Bucket: this.bucket,
      Key: stripLeadingSlash(path.join(targetDir, filename))
    }).promise()
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
  }

  exists(filename) {
    return this.s3.headObject({
      Bucket: this.bucket,
      Key: stripLeadingSlash(filename)
    }).promise()
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
  }

  read(options = {}) {
    let url = options.path;
    if (url.startsWith(this.host)) {
      url = url.substring(this.host.length);
    }
    return this.exists(url)
    .then((exists) => {
      if (exists) {
        return this.s3.getObject({
          Bucket: this.bucket,
          Key: stripLeadingSlash(options.path)
        }).promise()
        .then((data) => {
          return data.Body;
        });
      } else {
        throw new Error(`${options.path} is not stored in s3`);
      }
    });
  }

}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = S3Store;
