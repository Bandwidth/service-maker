"use strict";

//Modules required
var Hapi        = require("hapi");
//var MongoMapper = require("genesis").MongoMapper;
var Bluebird    = require("bluebird");

Bluebird.promisifyAll(Hapi);

var port   = process.env.PORT || 8080;
//var mapper = new MongoMapper(process.env.MONGODB_URL);
var server = module.exports = new Hapi.Server();

server.connection({
	host : process.env.HOST,
	port : port
});

server.registerAsync ([
		{
			register : require("./plugins/rest")
		}
	],
	function () {
		server.start(function () {
			console.log("Server started at: " + server.info.uri);
		});
	}
);
