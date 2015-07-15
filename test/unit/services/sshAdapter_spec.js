"use strict";

var AWS             = require("aws-sdk");
var sinon           = require("sinon");
var expect          = require("chai").expect;
var SshAdapter      = require("../../../lib/services/SshAdapter");
var Bluebird        = require("bluebird");
var options         = {};
var ec2             = new AWS.EC2();

Bluebird.promisifyAll(ec2);
options.ec2 =  ec2;
//var instanceAdapter = require("../../../lib/services/instanceAdapter");

describe("The SSH Adapter Class", function () {
	var id                   = "test";
	var SSH_POLLING_INTERVAL = 30; /*Time in Seconds*/

	describe("should determine if instance is not sshable", function () {
		var stub;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			/*get an instanceId*/

		});

		after(function () {
			stub.restore();
		});

		it("is not sshable", function () {
			stub = sinon.stub(ec2, "describeInstanceStatusAsync", function () {
				var data = {
					InstanceStatuses : []
				};
				return (Bluebird.resolve(data));
			});
			sshAdapter.canSsh(id)
			.then(function (sshable) {
				expect(stub.called).to.be.true;
				expect(sshable).to.exist;
				expect(sshable).to.be.false;
			});
		});
	});

	describe("should determine if instance is sshable", function () {
		var stub;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			/*get an instanceId*/

		});

		after(function () {
			stub.restore();
		});

		it("is sshable", function () {
			stub = sinon.stub(ec2,"describeInstanceStatusAsync", function () {
				var data = {
					InstanceStatuses : [ {
						SystemStatus : {
							Details : [ {
								Status : "passed"
							} ]
						}
					} ]
				};
				return (Bluebird.resolve(data));
			});
			sshAdapter.canSsh(id)
			.then(function (sshable) {
				expect(stub.called).to.be.true;
				expect(sshable).to.exist;
				expect(sshable).to.be.true;
			});
		});
	});

	describe("Start ssh Polling", function () {
		var instanceStatusStub;
		//var setIntervalStub;
		var clock;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			/*Get an instance id*/

			clock = sinon.useFakeTimers();
			instanceStatusStub = sinon.stub(ec2,"describeInstanceStatusAsync", function () {
				var data = {
					InstanceStatuses : [ {
						SystemStatus : {
							Details : [ {
								Status : "passed"
							} ]
						}
					} ]
				};
				return (Bluebird.resolve(data));
			});
		});

		after(function () {
			instanceStatusStub.restore();
			clock.restore();
		});

		it("is able to connect", function () {
			clock.tick(SSH_POLLING_INTERVAL * 1000);
			sshAdapter.startSshPolling(id)
			.then(function (data) {
				console.log("I received some data: " + data);
			})
			.catch(function (err) {
				console.log("Received an err: " + err);
			});
			clock.tick(SSH_POLLING_INTERVAL * 1000);
			expect(instanceStatusStub.called).to.be.true;
		});
	});

	describe("Start ssh Polling", function () {
		var instanceStatusStub;
		//var setIntervalStub;
		var clock;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			/*Get an instance id*/

			clock = sinon.useFakeTimers();
			instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync", function () {
				var data = {
					InstanceStatuses : []
				};
				return (Bluebird.resolve(data));
			});
		});

		after(function () {
			instanceStatusStub.restore();
			clock.restore();
		});

		it("not able to connect", function () {
			clock.tick(SSH_POLLING_INTERVAL * 1000);
			sshAdapter.startSshPolling(id)
			.then(function (data) {
				console.log("got data" + data);
			})
			.catch(function (err) {
				console.log("got err" + err);
			});
			clock.tick(SSH_POLLING_INTERVAL * 1000);
			expect(instanceStatusStub.called).to.be.true;
		});
	});

	describe("Aws faces an internal error", function () {
		var instanceStatusStub;
		var clock;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			/*Get an instance id*/

			clock = sinon.useFakeTimers();
			instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync")
				.rejects(new Error("Simulated Failure"));
		});

		after(function () {
			instanceStatusStub.restore();
			clock.restore();
		});

		it("encounters an error", function () {
			clock.tick(SSH_POLLING_INTERVAL * 1000);
			sshAdapter.startSshPolling(id)
			.then(function () {

			})
			.catch(function (error) {
				console.log("The error is: " + error);
				expect(error,"error").to.be.an.instanceOf(Error);
				expect(error.message,"error message").to.equal("Simulated Failure");
			});

			clock.tick(SSH_POLLING_INTERVAL * 1000);

			//expect(instanceStatusStub.called).to.be.true;
		});
	});
});
