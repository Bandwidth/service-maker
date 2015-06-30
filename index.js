"use strict";

//Modules required
var Hapi = require("hapi");

//Server initialization
var server = new Hapi.Server();
server.connection({
	host : "service-maker.herokuapp.com",
	port : 80
});

//Adding routes to the server
server.route({
	method  : "GET",
	path    : "/",
	handler : function (request, reply) {
		reply("").code(200);
	}

});

//Starting the server
server.start(function () {
	console.log("Server running at:", server.info.uri);
});
