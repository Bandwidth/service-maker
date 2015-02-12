var Hapi = require('hapi');
var Good = require('good');
var routes = require('./config/routes');

var server = new Hapi.Server();
server.connection({
  host: '0.0.0.0'
, port: parseInt(process.env.PORT) || 8000
});

server.route({
  method: 'GET'
, path: '/'
, handler: function(request, reply) {
    reply();
  }
});

server.route(routes);

if (!module.parent) { // Don't start server if testing
  var withGood = {
    register: Good
  , options: {
      reporters: [{
        reporter: require('good-console')
      , args: [{ log: '*', response: '*' }]
      }]
    }
  };
  server.register(withGood, function(error) {
    if (error) { throw error; } // Problem loading Good plugin
    server.start(function() {
      server.log('info', 'Server running at: ' + server.info.uri);
    });
  });
}

// Make the server accessible to other modules for testing
module.exports = server;
