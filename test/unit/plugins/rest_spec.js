"use strict";

var Request      = require("apparition").Request;
var Bluebird     = require("bluebird");
var Hapi         = require("hapi");
var Rest         = require("../../../lib/plugins/rest");
var MemoryMapper = require("genesis").MemoryMapper;
var expect       = require("chai").expect;
var Sinon        = require("sinon");
require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_AMI     = "ami-default";
	var VALID_TYPE    = "t2.micro";

	var INVALID_AMI   = [ "ami-defualt" ];

	var DEFAULT_AMI   = "ami-d05e75b8";
	var DEFAULT_TYPE  = "t2.micro";

	it("is a Hapi plugin", function () {
		expect(Rest, "attributes").to.have.property("register")
		.that.is.a("function")
		.and.that.has.property("attributes")
		.that.has.property("name", "rest");
	});

	describe("when registered", function () {
		var server = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync(Rest);
		});

		after(function () {
			return server.stopAsync();
		});

		it("provides the '/' route", function () {
			return new Request("GET", "/").inject(server)
			.then(function (response) {
				expect(response.statusCode, "status").to.equal(200);
			});
		});
	});

	describe("when a request is made", function () {
		var location     = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
		var server       = new Hapi.Server();
		var mapper = new MemoryMapper();

		before(function () {
			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					mapper : mapper
				}
			});
		});

		after(function () {
			return server.stopAsync();
		});

		describe("with valid parameters passed", function () {
			it("creates the instance and returns the canonical url", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
					expect(response.payload.ami, "ami").to.equal(VALID_AMI);
					expect(response.payload.type, "type").to.equal(VALID_TYPE);
				});
			});
		});

		describe("with no parameters passed", function () {
			it("creates the instance and returns the canonical url", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json");
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
					expect(response.payload.ami, "ami").to.equal(DEFAULT_AMI);
					expect(response.payload.type, "type").to.equal(DEFAULT_TYPE);
				});
			});
		});

		describe("with invalid parameter(s) passed", function () {
			it("returns an error with statusCode 400", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : INVALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					expect(response.statusCode, "status").to.equal(400);
					expect(response.payload)
					.to.equal("Bad Request: Please check the parameters passed.");
				});
			});
		});

		describe("when there is a problem with the database connection", function () {
			var result;

			before(function () {
				Sinon.stub(mapper, "create", function () {
					return Bluebird.reject(new Error("Simulated Failure."));
				});

				return new Request("POST", "/v1/instances").inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				mapper.create.restore();
			});

			it("displays an error page", function () {
				expect(result.statusCode).to.equal(500);
			});
		});
	});


});
