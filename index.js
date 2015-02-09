var Hapi = require('hapi');
var Good = require('good');
var request = require('request');
var Joi = require('joi');
var Boom = require('boom');

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
, path: '/v1/instances'
, handler: function(request, reply) {
    var payload = JSON.parse(request.payload);

    // This is a Joi schema
    var INSTANCE_SCHEMA = Joi.object().keys({
      timeToLive: Joi.number().integer().min(0), // duration in seconds
      size: Joi.string().valid('micro', 'small', 'medium', 'large').default('micro'),
      sshKeyPair: Joi.string().required()
    });

    // Use the schema to validate a payload
    var validated = Joi.validate(request.payload, INSTANCE_SCHEMA);
    if (validated.error) {
      reply(Boom.badRequest(validated.error.message));
    } else {
      var instance = validated.value;
      reply(instance).code(201);
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
