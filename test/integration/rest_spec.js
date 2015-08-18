"use strict";

var Request         = require("apparition").Request;
var Bluebird        = require("bluebird");
var Hapi            = require("hapi");
var Rest            = require("../../lib/plugins/rest");
var AWS             = require("aws-sdk");
var ec2             = new AWS.EC2({
	region : "us-east-1"
});
var expect          = require("chai").expect;
var listofInstances = [ ];

require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);
Bluebird.promisifyAll(ec2);

var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
var DEFAULT_AMI  = "ami-d05e75b8";
var DEFAULT_TYPE = "t2.micro";

function cleanupInstance(id) {
	var instanceParams = {
		InstanceIds : [ id ]
	};
	return ec2.terminateInstancesAsync(instanceParams);
}

function cleanUpAwsInstances(listofInstances) {
	return Bluebird.each(listofInstances, function (instance) {
		return cleanupInstance(instance);
	});
}

function registerServer () {

	var server = new Hapi.Server();

	server.connection();
	return server.registerAsync({
		register : Rest
	})
	.then(function () {
		return server;
	});

}

function createInstance(server, ami, type) {
	var VALID_AMI  = "ami-d05e75b8";
	var VALID_TYPE = "t2.micro";

	if (ami === undefined) {
		ami = VALID_AMI;
	}

	if (type === undefined) {
		type = VALID_TYPE;
	}

	var request = new Request("POST", "/v1/instances").mime("application/json").payload({
		ami  : ami,
		type : type
	});

	return request.inject(server)
	.then(function (response) {
		var result = JSON.parse(response.payload);
		listofInstances.push(result.instanceID);
		return response;
	});
}

describe("The Rest plugin Integration Test", function () {
	var location = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	describe("creating a new instance", function () {
		var server = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync({
				register : Rest
			});
		});

		after(function () {
			return cleanUpAwsInstances(listofInstances)
			.then(function () {
				return server.stopAsync();
			});
		});

		describe("with valid parameters passed - excluding a security group", function () {
			var result;

			before(function () {

				return createInstance(server)
				.then (function (response) {
					result = response;
				});
			});

			it("returns the canonical uri with appropriate an statusCode", function () {
				expect(result.statusCode, "status").to.equal(201);
				expect(result.headers.location, "location").to.match(location);
			});
		});
	});

});

describe("Updating the state of an instance", function () {

	function startInstance () {

		var server;
		var reply;
		var instanceID;
		var revision;
		var instance;

		before(function () {
			return registerServer()
			.then(function (result) {
				server = result;
				return createInstance(server);
			})
			.then(function (result) {
				instance   = JSON.parse(result.payload);
				instanceID = instance.instanceID;
				revision   = instance.revision + 1;
				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "pending",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (result) {
				reply = result;
			});

		});

		after(function () {
			return server.stopAsync()
			.then(function () {
				return cleanupInstance(instanceID);
			});
		});

		it("updates the state of the instance to 'pending'", function () {
			var result = JSON.parse(reply.payload);
			expect(result.id).to.match(ID_REGEX);
			expect(result.ami).to.equal(DEFAULT_AMI);
			expect(result.type).to.equal(DEFAULT_TYPE);
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
			expect(result.revision).to.equal(revision);
		});

		it("returns the canonical uri with appropriate an statusCode", function () {
			expect(reply.statusCode, "status").to.equal(200);
		});
	}

	function stopInstance () {

		var server;
		var reply;
		var instanceID;
		var revision;
		var instance;

		before(function () {
			return registerServer()
			.then(function (result) {
				server = result;
				return createInstance(server);
			})
			.then(function (result) {
				instance   = JSON.parse(result.payload);
				instanceID = instance.instanceID;
				revision   = instance.revision + 1;
				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "stopping",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (result) {
				reply = result;
			});

		});

		after(function () {
			return server.stopAsync()
			.then(function () {
				return cleanupInstance(instanceID);
			});
		});

		it("updates the state of the instance to 'stopping'", function () {
			var result = JSON.parse(reply.payload);

			expect(result.id).to.match(ID_REGEX);
			expect(result.ami).to.equal(DEFAULT_AMI);
			expect(result.type).to.equal(DEFAULT_TYPE);
			expect(result.state).to.equal("stopping");
			expect(result.uri).to.equal(null);
			expect(result.revision).to.equal(revision);
		});

		it("returns the canonical uri with appropriate an statusCode", function () {
			expect(reply.statusCode, "status").to.equal(200);
		});
	}

	function terminateInstance () {

		var server;
		var reply;
		var instanceID;
		var revision;
		var instance;

		before(function () {
			return registerServer()
			.then(function (result) {
				server = result;
				return createInstance(server);
			})
			.then(function (result) {
				instance   = JSON.parse(result.payload);
				instanceID = instance.instanceID;
				revision   = instance.revision + 1;
				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "terminating",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (result) {
				reply = result;
			});

		});

		after(function () {
			return server.stopAsync()
			.then(function () {
				return cleanupInstance(instanceID);
			});
		});

		it("updates the state of the instance to 'terminating'", function () {
			var result = JSON.parse(reply.payload);
			expect(result.id).to.match(ID_REGEX);
			expect(result.ami).to.equal(DEFAULT_AMI);
			expect(result.type).to.equal(DEFAULT_TYPE);
			expect(result.state).to.equal("terminating");
			expect(result.uri).to.equal(null);
			expect(result.revision).to.equal(revision);
		});

		it("returns the canonical uri with appropriate an statusCode", function () {
			expect(reply.statusCode, "status").to.equal(200);
		});
	}

	describe("starting an instance", startInstance);
	describe("stopping an instance", stopInstance);
	describe("terminating an instance", terminateInstance);

});
