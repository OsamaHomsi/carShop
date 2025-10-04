const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // كاش لمدة 5 دقائق

module.exports = cache;
