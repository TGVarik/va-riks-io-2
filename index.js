'use strict';

const path = require('path');

require('ghost')({
  config: path.join(__dirname, 'config.js')
})
.then((ghost) => {
  ghost.start();
});
