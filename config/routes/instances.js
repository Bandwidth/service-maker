var Joi = require('joi');
var Boom = require('boom');

module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances'
  , handler: function(request, reply) {
      var payload = request.payload;

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
        reply().code(201).header('Location', '/v1/instances/5');
      }
    }
  }
, {
    method: 'GET'
  , path: '/v1/instances/{awsID}'
  , handler: function(request, reply) {
      var awsID = encodeURIComponent(request.params.awsID);
      if (awsID == 5) {
        var payload = {
          ip: '8.8.8.8'
        , hostname: '1.255.255.255'
        , username: 'Tyler'
        , SSHKeyPairName: 'User'
        }
        reply(payload).code(200);
      } else {
        reply().code(404);
      }
    }
  , config: {
      validate: {
        params: {
          awsID: Joi.number().integer().min(1).required()
        }
      }
    }
  }
];