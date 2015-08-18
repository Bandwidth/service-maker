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