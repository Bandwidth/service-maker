var Hapi = require('hapi');
var Good = require('good');
var routes = require('./config/routes');

var InstancePool = require('./lib/InstancePool');

var server = new Hapi.Server();
server.connection({
  host: '0.0.0.0'
, port: parseInt(process.env.PORT) || 8000
});

server.route(routes);

if (!module.parent) { // Don't start server if testing
  var loggingOptions = {
    opsInterval: 10000
  , reporters: [{
      reporter: require('good-console')
    , args: [{ request: '*', log: '*', response: '*', 'error': '*' }]
    }]
  };
  var withGood = {
    register: require('good')
  , options: loggingOptions
  };
  server.register(withGood, function(error) {
    if (error) {
      console.error(error);
    } else {
      server.start(function() {
        server.log('info', 'Starting instance pool...');
        var pool = new InstancePool('NaiveStrategy');
        pool.initialize(server, function() {
          server.log('info', 'Server started at ' + server.info.uri);
        });
      });
    }
  });
}

// Make the server accessible to other modules for testing
module.exports = server;
