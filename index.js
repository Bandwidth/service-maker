"use strict";

//Modules required
var Hapi = require("hapi");

//Setting the port for the application
var port = process.env.PORT || 8080;

//Server initialization
var server = new Hapi.Server();
server.connection({
	host : process.env.HOST,
	port : port
});

server.register ([
		{
			register : require("./plugins/rest.js")
		}
	],
	function () {
		server.start(function () {
			console.log("Server started at: " + server.info.uri);
		});
	}
);
