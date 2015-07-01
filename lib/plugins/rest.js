"use strict";

exports.register = function (server, options, next) {

	server.route({
		method  : "GET",
		path    : "/",

		handler : function (request, reply) {
			reply("").code(200);
		}
	});

/*	server.route({
		method  : "GET",
		path    : "/v1/instances",

		handler : function (request, reply) {
			console.log(request.query());
			reply("OK").code(200);
		}

	});*/

	next();
};

exports.register.attributes = {
	name : "rest"
};
