"use strict";

var Request      = require("apparition").Request;
var Bluebird     = require("bluebird");
var Hapi         = require("hapi");
var Rest         = require("../../../lib/plugins/rest");
var MemoryMapper = require("genesis").MemoryMapper;
var expect       = require("chai").expect;
var Sinon        = require("sinon");
var Instance     = require("../../../lib/services/instanceAdapter.js");
require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_INSTANCE_ID;
	var VALID_AMI     = "ami-default";
	var VALID_TYPE    = "t2.micro";

	var INVALID_AMI   = [ "ami-defualt" ];

	var DEFAULT_AMI   = "ami-d05e75b8";
	var DEFAULT_TYPE  = "t2.micro";
	var INVALID_QUERY = "clumsy-cheetah";
	var location      = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	function createAnInstance (server) {

		return new Request("POST","/v1/instances").mime("application/json").payload({
			ami  : VALID_AMI,
			type : VALID_TYPE
		}).inject(server)
		.then(function (response) {
			response.payload = JSON.parse(response.payload);
			expect(response.statusCode, "status").to.equal(201);
			expect(response.headers.location, "location").to.match(location);
			expect(response.payload.ami, "ami").to.equal(VALID_AMI);
			expect(response.payload.type, "type").to.equal(VALID_TYPE);
			VALID_INSTANCE_ID = response.payload.id;
		});
	}

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

	describe("creating a new instance", function () {
		var mapper = new MemoryMapper();
		var server = new Hapi.Server();

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

	describe("getting an instance", function () {
		var mapper = new MemoryMapper();
		var server = new Hapi.Server();

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

		describe("with an invalid instance id", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances/" + INVALID_QUERY).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("shows the instance does not exist", function () {
				expect(result.statusCode,"status").to.equal(404);
			});
		});

		describe("with a valid instance", function () {
			before(function () {
				createAnInstance(server);
			});

			it("gets the instance of the requsted id", function () {
				return new Request("GET", "/v1/instances/" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					expect(response.statusCode,"status").to.equal(200);
				});
			});
		});
	});

	describe("querying for instances", function () {

		var mapper   = new MemoryMapper();
		var server   = new Hapi.Server();

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

		describe("with a valid type", function () {

			before(function () {
				createAnInstance(server);
			});

			it("returns an array of instances with the given type", function () {
				var payload;
				return new Request("GET", "/v1/instances?type=" + VALID_TYPE).inject(server)
				.then(function (response) {
					expect(response.statusCode,"status").to.equal(200);
					payload = JSON.parse(response.payload);
					expect(payload.instances).to.have.length.of.at.least(1);
				});
			});
		});

		describe("with an invalid instance by sending non-exisitng Instance Id and type", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?type=" + INVALID_QUERY + "&id=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an empty array of instances", function () {
				var payload;
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(0);
			});
		});

		describe("with a valid ID", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?id=" + VALID_INSTANCE_ID)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an instance with requested id", function () {
				var payload;
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(1);
				expect(payload.instances[ 0 ].id).to.equal(VALID_INSTANCE_ID);
			});
		});

		describe("with a valid AMI", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?ami=" + VALID_AMI)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an array of instances with requested ami", function () {
				expect(result.statusCode,"status").to.equal(200);
			});
		});

		describe("with state=pending", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?state=pending")
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an array of instances which are in a pending state", function () {
				expect(result.statusCode,"status").to.equal(200);
			});
		});

		describe("with invalid URI", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?uri=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an empty array of intsances", function () {
				var payload;
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(0);
			});
		});

		describe("with multiple values for a parameter", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?ami=" + INVALID_QUERY + "&ami=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("fails and returns a Bad Request", function () {
				expect(result.statusCode,"status").to.equal(400);
			});
		});
	});
	describe("encountering an internal error", function () {
		var server    = new Hapi.Server();
		var mapper    = new MemoryMapper();
		var instances = new Instance(mapper);

		before(function () {
			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					mapper    : mapper,
					instances : instances
				}
			});
		});

		after(function () {
			return server.stopAsync();
		});

		describe("failing to find an instance for specified instanceId", function () {
			var result;

			before(function () {
				Sinon.stub(instances, "getInstance").rejects(new Error("Simulated Failure"));

				return new Request("GET", "/v1/instances/foo-bar-baz").inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				instances.getInstance.restore();
			});

			it("fails", function () {
				expect(result.statusCode).to.equal(500);
			});
		});

		describe("failing to find all instances", function () {
			var result;

			before(function () {
				Sinon.stub(mapper, "find", function () {
					return Bluebird.reject(new Error("Simulated Failure."));
				});
				return new Request("GET", "/v1/instances?id=" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				mapper.find.restore();
			});

			it("fails", function () {
				expect(result.statusCode).to.equal(500);
			});
		});
	});
});
