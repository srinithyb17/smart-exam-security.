const app = require('../server/server.js');
const db = require('../server/database.js');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await db.init();
    initialized = true;
  }
  return app(req, res);
};
