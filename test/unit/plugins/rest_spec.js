"use strict";

var Request  = require("apparition").Request;
var Bluebird = require("bluebird");
var Hapi     = require("hapi");
var Rest     = require("../../../lib/plugins/rest");
var expect   = require("chai").expect;
var Genesis  = require("genesis");
var Sinon    = require("sinon");
var Instance = require("../../../lib/services/instanceAdapter");

require("sinon-as-promised")(Bluebird);
Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_INSTANCE_ID = "faef26e3-b7fb-4756-9135-be3785133682";
	var VALID_AMI         = "ami-default";
	var VALID_TYPE        = "t2.micro";
	var INVALID_QUERY     = "clumsy-cheetah";
	var server            = new Hapi.Server();
	var mapper            = new Genesis.MemoryMapper();

	it("is a Hapi plugin", function () {
		expect(Rest, "attributes").to.have.property("register")
		.that.is.a("function")
		.and.that.has.property("attributes")
		.that.has.property("name", "rest");
	});

	describe("when registered", function () {
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

		describe("when registered", function () {
			it("provides the '/' route", function () {
				return new Request("GET", "/").inject(server)
				.then(function (response) {
					expect(response.statusCode, "status").to.equal(200);
				});
			});
		});
		it("creates the instance and returns the canonical url", function () {
			var request = new Request("POST", "/v1/instances").mime("application/json").payload({
				ami  : VALID_AMI,
				type : VALID_TYPE
			});
			return request.inject(server)
			.then(function (response) {
				var payload;
				expect(response.statusCode, "status").to.equal(201);

				payload           = JSON.parse(response.payload);
				VALID_INSTANCE_ID = payload.id;
			});
		});
		describe("getting an invalid instance", function () {
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

		describe("getting a valid instance", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances/" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("shows the instance", function () {
				expect(result.statusCode,"status").to.equal(200);
			});
		});

		describe("getting a list of valid instances", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?type=" + VALID_TYPE).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns an array of instances", function () {
				var payload;
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances).to.have.length.of.at.least(1);
			});
		});

		describe("getting an invalid instance by sending non-exisitng Instance Id and type", function () {
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

		describe("Sending a GET request with all invalid parameters", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?extra=test&random=thisiswrong")
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns a Bad Request", function () {
				expect(result.statusCode,"status").to.equal(400);
			});
		});

		describe("Sending a GET request with a mix of valid and invalid parameters", function () {
			var result;

			before(function () {
				return new Request("GET", "/v1/instances?extra=test&random=thisiswrong&type=" + VALID_TYPE)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("returns a Bad Request", function () {
				expect(result.statusCode,"status").to.equal(400);
			});
		});

		describe("Sending a GET request with a valid ID", function () {
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

		describe("Sending a GET request with a valid AMI", function () {
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

		describe("Sending a GET request with state=pending", function () {
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

		describe("Sending a GET request an invalid URI", function () {
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

		describe("failing to find an instance for specified instanceId", function () {
			var result;
/*
			before(function () {
				Sinon.stub(mapper, "findOne", function () {
					return Bluebird.reject(new Error("Simulated Failure."));
				});
				return new Request("GET", "/v1/" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				mapper.findOne.restore();
			});

			it("displays an error page", function () {
				expect(result.statusCode).to.equal(500);
			});*/
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
