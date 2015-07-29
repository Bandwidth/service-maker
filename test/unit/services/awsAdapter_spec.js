"use strict";

var AwsAdapter      = require("../../../lib/services/awsAdapter");
var expect          = require("chai").expect;
var Bluebird        = require("bluebird");
var Sinon           = require("sinon");
var AWS             = require("aws-sdk");
var SshAdapter      = require("../../../lib/services/sshAdapter");
var InstanceAdapter = require("../../../lib/services/instanceAdapter");
var ec2             = new AWS.EC2();

Bluebird.promisifyAll(ec2);

require("sinon-as-promised")(Bluebird);

describe("The AwsAdapter class ", function () {
	var DEFAULT_AMI        = "ami-d05e75b8";
	var DEFAULT_TYPE       = "t2.micro";
	var INVALID_AMI        = "ami-invalid";
	var INVALID_TYPE       = "t2.invalid";
	var VALID_EC2_INSTANCE = "i-9444c16a";
	var VALID_IP_ADDRESS   = "127.0.0.1";

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

	var serverLog  = function () {
			//This is an empty block which mocks server.log function
	};

	var instances  = new InstanceAdapter();

	var awsOptions = { serverLog : serverLog, ec2 : ec2, instances : instances };

	describe("trying to create a new instance", function () {
		var createTagsStub;
		var result;
		var awsAdapter = new AwsAdapter(awsOptions);

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
			var beginPollingStub;

			before(function () {
				runInstancesStub = Sinon.stub(ec2, "runInstancesAsync").resolves({
						Instances : [ {
							InstanceId : "test"
						} ]
				});

				beginPollingStub = Sinon.stub(awsAdapter,"beginPolling");

				awsAdapter.runInstances(VALID_INSTANCE)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				runInstancesStub.restore();
				beginPollingStub.restore();
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

	describe("gets properties of given instance", function () {
		var describeInstancesStub;
		var result;
		before(function () {
			var awsAdapter = new AwsAdapter(awsOptions);
			describeInstancesStub = Sinon.stub(ec2, "describeInstancesAsync", function () {
				var data = { Reservations : [ { Instances : [ { PublicIpAddress : "127.0.0.1" } ] } ] };
				return Bluebird.resolve(data);
			});
			return awsAdapter.describeInstance(VALID_EC2_INSTANCE)
			.then(function (response) {
				result = response;
			});
		});

		after(function () {
			describeInstancesStub.restore();
		});

		it("gets properties of the given instance", function () {
			expect(result).to.be.instanceof(Array);
			expect(result[ 0 ].PublicIpAddress).to.be.equal("127.0.0.1");
			expect(result.length).to.equal(1);
		});
	});

	describe("gets properties of invalid instance", function () {
		var describeInstancesStub;
		var result;
		before(function () {
			var awsAdapter = new AwsAdapter(awsOptions);
			describeInstancesStub = Sinon.stub(ec2, "describeInstancesAsync", function () {
				return Bluebird.reject(new Error("Instance not Found"));
			});
			return awsAdapter.describeInstance(VALID_EC2_INSTANCE)
			.catch(function (error) {
				result = error;
			});
		});

		after(function () {
			describeInstancesStub.restore();
		});

		it("fails", function () {
			expect(result).to.be.an.instanceof(Error);
			expect(result.message).to.equal("Instance not Found");
		});
	});

	describe("gets the IP Address of the instance", function () {
		var result;
		var describeInstancesStub;

		before(function () {
			var awsAdapter = new AwsAdapter(awsOptions);
			describeInstancesStub = Sinon.stub(ec2, "describeInstancesAsync", function () {
				var data = { Reservations : [ { Instances : [ { PublicIpAddress : "127.0.0.1" } ] } ] };
				return Bluebird.resolve(data);
			});

			return awsAdapter.getPublicIPAddress(VALID_EC2_INSTANCE)
			.then(function (response) {
				result = response;
			})
			.catch(function (error) {
				result = error;
			});
		});

		after(function () {
			describeInstancesStub.restore();
		});

		it("gets a valid IP address", function () {
			expect(describeInstancesStub.called).to.be.true;
			expect(result).to.equal(VALID_IP_ADDRESS);
		});
	});

	describe("begins Polling", function () {

		var sshAdapter = new SshAdapter(ec2);

		awsOptions.sshAdapter = sshAdapter;

		var awsAdapter = new AwsAdapter(awsOptions);

		describe("and gets IP address of instance", function () {
			var SshPollingStub;
			var getPublicIPAddressStub;
			var instanceProp;
			var result;

			before(function () {
				SshPollingStub = Sinon.stub(sshAdapter,"SshPolling", function () {
					return Bluebird.resolve();
				});

				getPublicIPAddressStub = Sinon.stub(awsAdapter,"getPublicIPAddress", function () {
					return Bluebird.resolve(VALID_IP_ADDRESS);
				});

				return instances.createInstance("ami-d05e75b8","t2.micro")
				.then(function (data) {
					instanceProp  = JSON.parse(JSON.stringify(data));
					instanceProp.instanceID = VALID_EC2_INSTANCE;
					return awsAdapter.beginPolling(instanceProp);
				})
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				SshPollingStub.restore();
				getPublicIPAddressStub.restore();
			});

			it("updates the state and uri of the instance", function () {
				expect(result.id).to.equal(instanceProp.id);
				expect(result.type).to.equal(instanceProp.type);
				expect(result.ami).to.equal(instanceProp.ami);
				expect(result.state).to.equal("ready");
				expect(result.uri).to.equal("https://" + VALID_IP_ADDRESS);
			});
		});

		describe("and faces error while updating the instance", function () {
			var SshPollingStub;
			var getPublicIPAddressStub;
			var updateInstanceStub;
			var instanceProp;
			var result;

			before(function () {
				SshPollingStub = Sinon.stub(sshAdapter,"SshPolling", function () {
					return Bluebird.resolve();
				});

				getPublicIPAddressStub = Sinon.stub(awsAdapter,"getPublicIPAddress", function () {
					return Bluebird.resolve(VALID_IP_ADDRESS);
				});

				updateInstanceStub = Sinon.stub(instances, "updateInstance").rejects(new Error("Simulated Failure."));

				return instances.createInstance("ami-d05e75b8","t2.micro")
				.then(function (data) {
					instanceProp  = JSON.parse(JSON.stringify(data));
					instanceProp.instanceID = VALID_EC2_INSTANCE;
					return awsAdapter.beginPolling(instanceProp);
				})
				.catch(function (error) {
					result = error;
				});
			});

			after(function () {
				SshPollingStub.restore();
				getPublicIPAddressStub.restore();
				updateInstanceStub.restore();
			});

			it("updates the state and uri of the instance", function () {
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.be.equal("Simulated Failure.");
			});
		});

		describe("and faces an error while polling", function () {
			var SshPollingStub;
			var instanceProp;
			var result;

			before(function () {
				SshPollingStub = Sinon.stub(sshAdapter,"SshPolling", function () {
					return Bluebird.reject(new Error("Simulated Failure"));
				});

				return instances.createInstance("ami-d05e75b8","t2.micro")
				.then(function (data) {
					instanceProp  = JSON.parse(JSON.stringify(data));
					instanceProp.instanceID = VALID_EC2_INSTANCE;
					return awsAdapter.beginPolling(instanceProp);
				})
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				SshPollingStub.restore();
			});

			it("updates the state and uri of the instance", function () {

				expect(result.id).to.equal(instanceProp.id);
				expect(result.type).to.equal(instanceProp.type);
				expect(result.ami).to.equal(instanceProp.ami);
				expect(result.state).to.equal("failed");
				expect(result.uri).to.equal(null);
			});
		});

		describe("faces an error while polling and updating instance fails as well", function () {
			var SshPollingStub;
			var updateInstanceStub;
			var instanceProp;
			var result;

			before(function () {
				SshPollingStub = Sinon.stub(sshAdapter,"SshPolling", function () {
					return Bluebird.reject(new Error("Simulated Failure"));
				});

				updateInstanceStub = Sinon.stub(instances, "updateInstance").rejects(new Error("Simulated Failure."));

				return instances.createInstance("ami-d05e75b8","t2.micro")
				.then(function (data) {
					instanceProp  = JSON.parse(JSON.stringify(data));
					instanceProp.instanceID = VALID_EC2_INSTANCE;
					return awsAdapter.beginPolling(instanceProp);
				})
				.catch (function (error) {
					result = error;
				});
			});

			after(function () {
				SshPollingStub.restore();
				updateInstanceStub.restore();
			});

			it("fails to update the state and uri of the instance", function () {

				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.be.equal("Simulated Failure.");
			});
		});
	});

	describe("Trying to create awsAdapter Instance", function () {

		describe("with missing parameters", function () {
			var awsAdapter;
			var result;
			var options = {};
			options.serverLog = function () { };
			before(function () {
				try {
					awsAdapter = new AwsAdapter(options);
				}
				catch (err) {
					result = err;
				}

			});

			it("fails to create an object", function () {
				expect(awsAdapter).to.be.undefined;
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.equal("child \"sshAdapter\" fails because [\"sshAdapter\" is required]");
			});
		});

		describe("with invalid parameters", function () {
			var awsAdapter;
			var result;
			var options = {};
			options.sshAdapter = new SshAdapter(ec2);
			options.instances = "thisIswrong";
			options.ec2 = ec2;
			options.serverLog = function () { };
			before(function () {
				try {
					awsAdapter = new AwsAdapter(options);
				}
				catch (err) {
					result = err;
				}

			});

			it("fails to create an object", function () {
				expect(awsAdapter).to.be.undefined;
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.equal("child \"instances\" fails because [\"instances\" must be an object]");
			});
		});
	});
});