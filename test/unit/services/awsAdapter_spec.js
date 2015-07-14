"use strict";

var AwsAdapter  = require("../../../lib/services/awsAdapter");
var expect      = require("chai").expect;
var Bluebird    = require("bluebird");
var Sinon       = require("sinon");
var AWS         = require("aws-sdk");
var ec2         = new AWS.EC2();
var options;

Bluebird.promisifyAll(ec2);

require("sinon-as-promised")(Bluebird);

describe("The AwsAdapter class ", function () {
	var DEFAULT_IMAGE_ID      = "ami-d05e75b8";
	var DEFAULT_INSTANCE_TYPE = "t2.micro";

	//var INVALID_IMAGE_ID      = "ami-invalid";
	//var INVALID_INSTANCE_TYPE = "t2.invalid";

	describe("creating a new instance with valid ami, type", function () {
		var runInstancesStub;
		var result;
		before(function () {
			options.ec2 = ec2;
			var awsAdapter = new AwsAdapter({
				id   : DEFAULT_IMAGE_ID,
				type : DEFAULT_INSTANCE_TYPE
			}, options);
			runInstancesStub = Sinon.stub(ec2, "runInstancesAsync", function () {
				console.log("somethingosthinoi");
				return Bluebird.resolve("test");
			});

			awsAdapter.runInstances()
			.then(function (response) {
				result = response;
			});
		});

		after(function () {
			runInstancesStub.restore();
		});

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});

	});
});
