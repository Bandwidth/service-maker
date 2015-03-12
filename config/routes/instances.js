var Joi = require('joi');
var Boom = require('boom');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
  apiVersion: '2014-10-01'
, region: 'us-west-2'
});

var InstancePool = require('./../../lib/InstancePool');

module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances'
  , handler: function(request, reply) {
      var pool = new InstancePool('NaiveStrategy');

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
        // Get the validated information instance.
        var instance = validated.value;

        // TODO: Retrieve instance from pool.
        // Probably something like pool.getInstance(instance.size);

        // TODO: Apply tags to returned instance.

        // Reply with the instance location
        reply().code(201).header('Location', '/v1/instances/' + instanceId);
      }
    }
  }
, {
    method: 'PUT'
  , path: '/v1/instances/{instanceId}'
  , handler: function(request, reply) {
      var payload = request.payload;

      var SCHEMA = Joi.object().keys({
        state: Joi.string().valid('stopped', 'running', 'terminated')
      });

      var validated = Joi.validate(request.payload, SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        payload = JSON.parse(payload);
        var instanceId = request.params.instanceId;
        var state = payload.state;
        switch (state) {
          case 'stopped':
            var params = { InstanceIds: [instanceId] };
            ec2.stopInstances(params, function(error, data) {
              if (error) {
                request.log('info', error, error.stack);
                reply(error).code(400);
              } else {
                request.log('info', 'Stopped instance ' + instanceId);
                reply().code(204); // 204: Processed request, but not returning anything
              }
            });
            break;
          case 'running':
            params = { InstanceIds: [instanceId] };
            ec2.startInstances(params, function(error, data) {
              if (error) {
                request.log('info', error, error.stack);
                reply(error).code(400);
              } else {
                console.log('info', 'Started instance ' + instanceId);
                reply().code(204); // 204: Processed request, but not returning anything
              }
            });
            break;
          case 'terminated':
            params = { InstanceIds: [instanceId] };
            ec2.terminateInstances(params, function(error, data) {
              if (error) {
                request.log('info', error, error.stack);
                reply(error).code(400);
              } else {
                request.log('info', 'Terminated instance ' + instanceId);
                reply().code(204); // 204: Processed request, but not returning anything
              }
            });
            break;
        }
      }
    }
  }
, {
    method: 'GET'
  , path: '/v1/instances/{resourceId?}'
  , handler: function(request, reply) {
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
