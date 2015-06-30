"use strict";

//Modules required
var Hapi = require("hapi");

//Setting the port for the application
var port = process.env.PORT || 8080;

//Server initialization
var server = new Hapi.Server();
server.connection({
	host : "0.0.0.0",
	port : port
});

//Adding routes to the server
server.route({
	method  : "GET",
	path    : "/",
	handler : function (request, reply) {
		reply("Hello").code(200);
	}

});

//Starting the server
server.start(function () {
	console.log("Server running at:", server.info.uri);
});
