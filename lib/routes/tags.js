var Joi = require('joi');
var Boom = require('boom');

var InstancePool = require('./../../lib/InstancePool');
var Instances = require('./../../lib/Instances');
var Schemas = require('./../../lib/Schemas');
var Tags = require('./../../lib/Tags');

module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances/{instanceId}/tags'
  , handler: function(request, reply) {
      var payload = request.payload;

      // Use the schema to validate a payload.
      var validated = Joi.validate(request.payload, Schemas.TAG_SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        // Get the validated instance information.
        var tags = validated.value.Tags;
        var instanceId = encodeURIComponent(request.params.instanceId);
        Tags.applyTags(tags, instanceId, function() {
          reply().code(200);
        });
      }
    }
  }
, {
    method: 'DELETE'
  , path: '/v1/instances/{instanceId}/tags'
  , handler: function(request, reply) {
      var payload = request.payload;
      var validated = Joi.validate(payload, Schemas.TAG_SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        var tags = validated.value.Tags;
        var instanceId = encodeURIComponent(request.params.instanceId);
        Tags.removeTags(tags, instanceId, function() {
          reply().code(200);
        });
      }
    }
  }
, {
    method: 'GET'
  , path: '/v1/instances/{instanceId}/tags'
  , handler: function(request, reply) {
      var instanceId = encodeURIComponent(request.params.instanceId);
      Tags.getTags(instanceId, function(tags) {
        reply(tags).code(200);
      });
    }
  }
];
