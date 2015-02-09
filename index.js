var Hapi = require('hapi');
var Good = require('good');
var request = require('request');
var joi = require('joi');

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

server.route({
  method: 'POST'
, path: '/new'
, handler: function(request, reply) {
    var payload = JSON.parse(request.payload);

    if (payload.timeToLive === undefined || payload.size === undefined || payload.sshKeypair === undefined) {
      reply().code(400);
    } else {
      var awsResource = {
        ipAddress: '8.8.8.8'
      , hostname: 'ServiceMaker'
      , username: 'Tyler'
      , sshPrivateKey: payload.sshKeypair
      };
      reply(awsResource).code(201);
    }
  }
});

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
