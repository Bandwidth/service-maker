var instances = require('./instances');
var tags = require('./tags');

// Add other routes here
// eg. concat(instances, databases, ...)
module.exports = [].concat(instances, tags);
