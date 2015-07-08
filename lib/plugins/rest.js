"use strict";

var InstanceAdapter = require("../services/instanceAdapter.js");
var Boom     = require("boom");

exports.register = function (server, options, next) {
	var instances = options.instances || new InstanceAdapter(options.mapper);

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
			var ami  = request.payload.ami;
			var type = request.payload.type;
			instances.createInstance(ami, type)
			.then(function (instance) {
				reply(instance).created("/v1/instances/" + instance.id);
			})
			.catch(function (error) {
				if (error.name === "ValidationError") {
					reply("Bad Request: Please check the parameters passed.").code(400);
				}
				else {
					reply("Internal Server Error.").code(500);
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

			var	query = {};
			var bCheckPresenceofInValidParameter = false;
			/*Create a JSON object of all paramaters which are present in the GET Request*/
			for (var key in request.query) {
				if (key === "id") {
					query.id = request.query.id;
				}
				else if (key === "type") {
					query.type = request.query.type;
				}
				else if (key === "ami") {
					query.key = request.query.key;
				}
				else if (key === "state") {
					query.key = request.query.key;
				}
				else if (key === "uri") {
					query.key = request.query.uri;
				}
				else {
					bCheckPresenceofInValidParameter = true;
					break;
				}
			}
			if (Object.keys(request.query).length === 0 || bCheckPresenceofInValidParameter === true) {
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
		}
	});

	next();
};

exports.register.attributes = {
	name : "rest"
};
