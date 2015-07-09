"use strict";

var InstanceAdapter = require("../services/instanceAdapter.js");

exports.register = function (server, options, next) {

	var instances = new InstanceAdapter(options.mapper);
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
	next();
};

exports.register.attributes = {
	name : "rest"
};
