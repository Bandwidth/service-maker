var Joi = require('joi');
var Boom = require('boom');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var InstancePool = require('./../../lib/InstancePool');
var Instances = require('./../../lib/Instances');
var Tags = require('./../../lib/Tags');

module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances/{instanceId}/tags'
  , handler: function(request, reply) {
      var payload = request.payload;

      // Use this schema to validate tags.
      var TAG_SCHEMA = Joi.array().includes({
        Name: Joi.string().required()
      , Value: Joi.string().required()
      });

      // var TAG_SCHEMA = Joi.object().keys({
      //   tags: Joi.array().items(
      //     Joi.object().keys({
      //       Name: Joi.string().required()
      //     , Value: Joi.string().required()
      //     })
      //   )
      // });

      // Use the schema to validate a payload.
      var validated = Joi.validate(request.payload, TAG_SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        // Get the validated instance information.
        var instance = validated.value;

        reply(instance);
      }
    }
  }
];
