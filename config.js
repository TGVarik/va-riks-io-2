'use strict';

const path = require('path');
const keys = require('./keys.json');

let config = module.exports = {
  production: {
    server: {
      host: '127.0.0.1',
      port: 2368
    },
    url: 'https://va.riks.io',
    mail: {
      from: '"va.riks.io" <ghost@riks.io>',
      transport: 'SMTP',
      options: {
        host: 'email-smtp.us-west-2.amazonaws.com',
        port: 465,
        service: 'SES',
        auth: {
          user: keys.SMTP_USER,
          pass: keys.SMTP_PASS
        }
      }
    },
    database: {
      client: 'mysql',
      connection: {
        host: 'mysql.int.riks.io',
        user: keys.MYSQL_USER,
        password: keys.MYSQL_PASS,
        database: 'ghost',
        charset: 'utf8'
      }
    },
    storage: {
      active: 'ghost-storage-s3',
      'ghost-storage-s3': {
        accessKeyId: keys.AWS_ACCESS_KEY_ID,
        secretAccessKey: keys.AWS_SECRET_ACCESS_KEY,
        bucket: 'ghost-content-va-riks-io',
        region: 'us-west-2'
      }
    },
    paths: {
      contentPath: path.join(__dirname, 'content')
    }
  }
};
