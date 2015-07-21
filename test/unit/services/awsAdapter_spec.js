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
		});

		after(function () {
			createTagsStub.restore();
		});

		describe("with valid parameters", function () {

			var runInstancesStub;

			before(function () {
				runInstancesStub = Sinon.stub(ec2, "runInstancesAsync").resolves({
						Instances : [ {
							InstanceId : "test"
						} ]
				});

				awsAdapter.runInstances(VALID_INSTANCE)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("returns a new instance with the ami and type provided", function () {
				expect(runInstancesStub.args[ 0 ][ 0 ].ImageId).to.equal(DEFAULT_AMI);
				expect(runInstancesStub.args[ 0 ][ 0 ].InstanceType).to.equal(DEFAULT_TYPE);
				expect(runInstancesStub.args[ 0 ][ 0 ].MaxCount).to.equal(1);
				expect(runInstancesStub.args[ 0 ][ 0 ].MinCount).to.equal(1);
				expect(result.ami, "response").to.equal("ami-d05e75b8");
				expect(result.type, "response").to.equal("t2.micro");
			});
		});

		describe("with invalid ami", function () {

			var runInstancesStub;

			before(function () {

				var AMIError = new Error();
				AMIError.name = "InvalidAMIID.Malformed";
				AMIError.message = "The AMI entered does not exist. Ensure it is of the form ami-xxxxxx.";

				runInstancesStub = Sinon.stub(ec2, "runInstancesAsync").rejects(AMIError);

				awsAdapter.runInstances(INVALID_INSTANCE_AMI)
				.then(function (response) {
					result = response;
				})
				.catch(function (error) {
					result = error;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("throws an InvalidAMIID.Malformed error", function () {
				expect(result, "error").to.be.instanceof(Error);
				expect(result.message).to.equal("The AMI entered does not exist. Ensure it is of the form ami-xxxxxx.");
				expect(runInstancesStub.args[ 0 ][ 0 ].ImageId).to.equal(INVALID_AMI);
				expect(runInstancesStub.args[ 0 ][ 0 ].InstanceType).to.equal(DEFAULT_TYPE);
				expect(runInstancesStub.args[ 0 ][ 0 ].MaxCount).to.equal(1);
				expect(runInstancesStub.args[ 0 ][ 0 ].MinCount).to.equal(1);
			});
		});

		describe("with invalid type", function () {

			var runInstancesStub;

			before(function () {

				var TypeError = new Error();
				TypeError.name = "InvalidParameterValue";
				TypeError.message = "The Type entered does not exist. Ensure it is a valid EC2 type.";

				runInstancesStub = Sinon.stub(ec2, "runInstancesAsync").rejects(TypeError);

				awsAdapter.runInstances(INVALID_INSTANCE_TYPE)
				.then(function (response) {
					result = response;
				})
				.catch(function (error) {
					result = error;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("throws an InvalidParameterValue", function () {
				expect(result, "error").to.be.instanceof(Error);
				expect(runInstancesStub.args[ 0 ][ 0 ].ImageId).to.equal(DEFAULT_AMI);
				expect(runInstancesStub.args[ 0 ][ 0 ].InstanceType).to.equal(INVALID_TYPE);
				expect(runInstancesStub.args[ 0 ][ 0 ].MaxCount).to.equal(1);
				expect(runInstancesStub.args[ 0 ][ 0 ].MinCount).to.equal(1);
				expect(result.message).to.equal("The Type entered does not exist. Ensure it is a valid EC2 type.");
			});
		});
	});
});
