"use strict"

exports.register = function(server, options, next) {

	server.route([
		{
			method  : "GET",
			path    : "/",
			handler : function (request, reply) {
			reply("").code(200);
			}
		}
	])

	next();
}

exports.register.attributes = {
	pkg : {
		"name"    : "rest"
	}
}
