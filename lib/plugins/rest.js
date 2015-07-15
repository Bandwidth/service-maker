"use strict";

var InstanceAdapter = require("../services/instanceAdapter.js");
var Boom            = require("boom");
var _               = require("lodash");
var Joi             = require("joi");
var AwsAdapter      = require("../services/awsAdapter");
var AWS             = require("aws-sdk");
var Instance        = require("../models/Instance");
var Bluebird        = require("bluebird");
var SshAdapter      = require("../services/sshAdapter");

exports.register = function (server, options, next) {

	var ec2 = new AWS.EC2({
		region : "us-east-1"
	});

	Bluebird.promisifyAll(ec2);

	var instances = options.instances || new InstanceAdapter(options.mapper);
	var awsAdapter = options.awsAdapter || new AwsAdapter(ec2);
	var sshAdapter = options.sshAdapter || new SshAdapter(ec2);
	server.route({
		method  : "GET",
		path    : "/",

		handler : function (request, reply) {
			reply();
		}
	});

	server.route({
		method  : "POST",
		path    : "/v1/instances",

		handler : function (request, reply) {
			var result;
			var awsInstanceID;
			var ami  = request.payload.ami;
			var type = request.payload.type;
			instances.createInstance(ami, type)
			.then(function (instance) {
				result = instance;
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances/{instanceId}",

		handler : function (request, reply) {

			var instanceId = request.params.instanceId;

			instances.getInstance({ id : instanceId })
			.then (function (instance) {
				if (!instance) {
					throw Boom.notFound("No instances found for id " + instanceId);
				}
				reply(instance);
			})
			.catch (function (error) {
				server.log([ "error", "rest", "NotFound" ], "404: Instance not found.");
				reply(Boom.wrap(error));
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances",
		handler : function (request, reply) {

			var	query  = {};
			var schema = Joi.object().keys({
				id    : Joi.string(),
				type  : Joi.string(),
				ami   : Joi.string(),
				state : Joi.string(),
				uri   : Joi.string()
			});

			query = _.pick(request.query, "id", "ami", "type", "state", "uri");

			Joi.validate(query, schema, function (error) {
				if (error) {
					reply(Boom.badRequest("Bad Request: Please check the parameters passed."));
				}
				else {
					instances.getAllInstances(query)
					.then (function (allInstances) {
						var payload = {};
						payload.instances = allInstances;
						reply(payload);
					})
					.catch (function (error) {
							reply(Boom.wrap(error));
						}
					);
				}
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances/{instanceId}",

		handler : function (request, reply) {

			var instanceId = request.params.instanceId;

			instances.getInstance({ id : instanceId })
			.then (function (instance) {
				if (!instance) {
					throw Boom.notFound("No instances found for id " + instanceId);
				}
				reply(instance);
			})
			.catch (function (error) {
				reply(Boom.wrap(error));
			});
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances",
		handler : function (request, reply) {

			var	query  = {};
			var schema = Joi.object().keys({
				id    : Joi.string(),
				type  : Joi.string(),
				ami   : Joi.string(),
				state : Joi.string(),
				uri   : Joi.string()
			});

			query = _.pick(request.query,"id","ami","type","state","uri");

			Joi.validate(query, schema, function (err) {
				if (err) {
					reply("").code(400);
				}
				else {
					instances.getAllInstances(query)
					.then (function (allInstances) {
						var payload = {};
						payload.instances = allInstances;
						reply(payload);
					})
					.catch (function () {
							reply("").code(500);
						}
					);
				}
			});
		}
	});
	next();
};

exports.register.attributes = {
	name : "rest"
};
