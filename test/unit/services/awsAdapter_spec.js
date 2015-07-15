"use strict";

var AwsAdapter = require("../../../lib/services/awsAdapter");
var expect     = require("chai").expect;
var Bluebird   = require("bluebird");
var Sinon      = require("sinon");
var AWS        = require("aws-sdk");
var ec2        = new AWS.EC2();

Bluebird.promisifyAll(ec2);

require("sinon-as-promised")(Bluebird);
describe("The AwsAdapter class ", function () {
	var DEFAULT_AMI  = "ami-d05e75b8";
	var DEFAULT_TYPE = "t2.micro";
	var INVALID_AMI  = "ami-invalid";
	var INVALID_TYPE = "t2.invalid";

	var VALID_INSTANCE = {
		ami  : DEFAULT_AMI,
		type : DEFAULT_TYPE
	};

	var INVALID_INSTANCE_AMI = {
		ami  : INVALID_AMI,
		type : DEFAULT_TYPE
	};

	var INVALID_INSTANCE_TYPE = {
		ami  : DEFAULT_AMI,
		type : INVALID_TYPE
	};

	describe("trying to create a new instance", function () {
		var createTagsStub;
		var result;
		var awsAdapter = new AwsAdapter(ec2);

		before(function () {
			createTagsStub = Sinon.stub(ec2, "createTagsAsync", function () {
				return "test";
			});
			runInstancesStub = Sinon.stub(ec2, "runInstancesAsync", function () {
				var data = {
					Instances : [ {
						instanceID : "test"
					} ]
				};
				return Bluebird.resolve(data);
			});
			awsAdapter.runInstances(VALID_INSTANCE)
			.then(function (response) {
				result = response;
			});
		});
		});

		after(function () {
			runInstancesStub.runInstanceAsync.restore();
		});

		it("returns a new instance with the ami and type provided", function () {
			expect(result.ami, "response").to.equal("ami-d05e75b8");
			expect(result.type, "response").to.equal("t2.micro");
		});

	});

	describe("creating a new instance with a invalid ami", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : INVALID_IMAGE_ID,
			type : DEFAULT_INSTANCE_TYPE
		});

		before(function () {
			awsAdapterStub = Sinon.stub(awsAdapter, "runInstances").onFirstCall()
			.returns(Bluebird.resolve("test"));

			awsAdapter.runInstances()
			.then(function (response) {
				result = response;
			});
		});

		after(function () {
			//awsAdapterStub.runInstances.restore();
		});

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});

	});

	describe("creating a new instance with an invalid type", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : DEFAULT_IMAGE_ID,
			type : INVALID_INSTANCE_TYPE
		});

		before(function () {
			awsAdapterStub = Sinon.stub(awsAdapter, "runInstances").onFirstCall()
			.returns(Bluebird.resolve("test"));
			awsAdapter.runInstances()
			.then(function (response) {
				result = response;
			})
			.catch(function (error) {
				result = error;
			});

		});

		after(function () {
			runInstancesStub.restore();
			createTagsStub.restore();
		});

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});
	});


	});

});
