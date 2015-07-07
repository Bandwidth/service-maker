"use strict";

var Instance = require("../services/instanceAdapter.js");

exports.register = function (server, options, next) {

	server.route({
		method  : "GET",
		path    : "/",

		handler : function (request, reply) {
			reply("").code(200);
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
				.then(function (instance) {
					reply(instance).created("/v1/instances/" + instance.id);
				});
			}
			catch (error) {
				reply("Bad Request: Returned if the instance configuration parameters are invalid.").code(400);
			}
		}
	});

	next();
};

exports.register.attributes = {
	name : "rest"
};
