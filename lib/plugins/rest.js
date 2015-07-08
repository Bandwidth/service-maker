"use strict";

var Instance = require("../services/services-db.js");
var Boom     = require("boom");

exports.register = function (server, options, next) {

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
			var ami;
			var type;
			var instances;
			try {
				ami  = request.payload.ami;
				type = request.payload.type;

				instances = new Instance(options.mapper);
				instances.createInstance(ami, type)
				.then (function (instance) {
					reply(instance).created("/v1/instances/" + instance.id);
				});
			}
			catch (error) {
				reply("Bad Request: Returned if the instance configuration parameters are invalid.").code(400);
				console.log(instances);
			}
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances/{instanceId}",

		handler : function (request, reply) {

			var instances;
			var instanceId = request.params.instanceId;
			instances = new Instance(options.mapper);
			instances.getInstance({ id : instanceId })
			.then (function (instance) {
				if (!instance) {
					throw Boom.notFound("Instance not found for instance: " + instanceId);
				}
				reply(instance);
			})
			.catch (function (error) {
					reply(Boom.wrap(error));
				}
			);
		}
	});

	server.route({
		method  : "GET",
		path    : "/v1/instances",

		handler : function (request, reply) {

			var instances;
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

				try {
					instances = new Instance(options.mapper);
					instances.getAllInstances(query)
					.then (function (allInstances) {
						var payload = {};
						payload.instances = allInstances;
						reply(payload);
					});
				}
				catch (error) {
					reply(Boom.wrap(error));
				}
			}
		}
	});

	next();
};

exports.register.attributes = {
	name : "rest"
};
