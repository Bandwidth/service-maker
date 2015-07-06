"use strict";

var Hapi              = require("hapi");
var Bluebird          = require("bluebird");
var MongoMapper       = require("genesis").MongoMapper;
var DatabaseConnector = require("./services/DatabaseConnector");

var databaseConnector = DatabaseConnector.connect(process.env.DB_URL, process.env.DB_USER, process.env.DB_PASSWORD);
var mapper            = new MongoMapper(databaseConnector);

Bluebird.promisifyAll(Hapi);

var port   = process.env.PORT || 8080;
var server = module.exports = new Hapi.Server();

server.connection({
	host : process.env.HOST,
	port : port
});

server.registerAsync ([
		{
			register : require("./plugins/rest"),
			options  : {
				mapper : mapper
			}
		}
	],
	function () {
		server.start(function () {
			console.log("Server started at: " + server.info.uri);
		});
	}
);
