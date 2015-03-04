var Joi = require('joi');
var Boom = require('boom');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var server = require('./../../index.js');

module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances'
  , handler: function(request, reply) {
      var payload = request.payload;

      // This is a Joi schema
      var INSTANCE_SCHEMA = Joi.object().keys({
        timeToLive: Joi.number().integer().min(0) // duration in seconds
      , size: Joi.string().valid('micro', 'small', 'medium', 'large').default('micro')
      , sshKeyPair: Joi.string().required()
      });

      // Use the schema to validate a payload
      var validated = Joi.validate(request.payload, INSTANCE_SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        var instance = validated.value;

        // Define instance paramaters
        var ec2Params = {
          ImageId: 'ami-d53818e5' // Ubuntu 14.04 us-west-2
        , InstanceType: 't1.micro'
        , KeyName: '123abc'
        , MinCount: 1
        , MaxCount: 1
        };

        // Create the instance
        ec2.runInstances(ec2Params, function(err, data) {
          if (err) {
            console.log('Could not create instance', err);
            return;
          }

          // Get the instance ID
          var instanceId = data.Instances[0].InstanceId;
          console.log('Created ' + ec2Params.InstanceType + ' instance ' + instanceId);

          // Add tags to the instance
          var tags = {
            Resources: [instanceId]
          , Tags: [
              {
                Key: 'Name'
              , Value: 'Service Maker Test'
              }
            ]
          }

          ec2.createTags(tags, function(err) {
            console.log('Applied tags to instance ' + instanceId);
          })

          // Reply with the instance location
          reply().code(201).header('Location', '/v1/instances/' + instanceId);
        });
      }
    }
  }
, {
    method: 'GET'
  , path: '/v1/instances/{resourceId?}'
  , handler: function(request, reply) {
      console.log('Getting info for resource: ' + request.params.resourceId);
      var params = {};
      if (request.params.resourceId) {
        params = {
          InstanceIds: [encodeURIComponent(request.params.resourceId)]
        };
      }
      ec2.describeInstances(params, function(err, data) {
        if (err) {
          reply(Boom.badRequest(err));
        } else {
          // EC2 returns multiple reservations.
          // Each has a list of instances associated with it.
          var instanceInfo = [];
          data.Reservations.forEach(function(reservation, index, array) {
            reservation.Instances.forEach(function(instance, index, array) {
              instanceInfo.push({
                InstanceId: instance.InstanceId
              , State: instance.State.Name
              , Tags: instance.Tags
              });
            });
          });
          reply(instanceInfo);
        }
      });
    }
  }
];
