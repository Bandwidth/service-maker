"use strict";

var AWS        = require("aws-sdk");
var sinon      = require("sinon");
var expect     = require("chai").expect;
var SshAdapter = require("../../../lib/services/sshAdapter");
var Bluebird   = require("bluebird");

describe("The SSH Adapter Class", function () {

	var id                   = "i-fbf47257";
	var options              = {};
	var ec2                  = new AWS.EC2();
	var SSH_POLLING_INTERVAL = 30; //Time in Seconds

	Bluebird.promisifyAll(ec2);
	options.ec2 =  ec2;

	describe("Checks if it is possible to ssh", function () {
		describe("once the status checks have passed", function () {
			var instanceStatusStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
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
				return sshAdapter.canSsh(id)
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("returns that it is possible to ssh", function () {
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.be.true;
			});
		});
		describe("as soon as instance is created", function () {
			var instanceStatusStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				instanceStatusStub = sinon.stub(ec2,"describeInstanceStatusAsync", function () {
					var data = {
						InstanceStatuses : []
					};
					return (Bluebird.resolve(data));
				});
				return sshAdapter.canSsh(id)
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("is not possible to ssh currently", function () {
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.be.false;
			});
		});

		describe("when system checks have failed", function () {
			var instanceStatusStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				instanceStatusStub = sinon.stub(ec2,"describeInstanceStatusAsync", function () {
					var data = {
						InstanceStatuses : [ {
							SystemStatus : {
								Details : [ {
									Status : "failed"
								} ]
							}
						} ]
					};
					return (Bluebird.resolve(data));
				});
				return sshAdapter.canSsh(id)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("it returns an error", function () {
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.be.equal("System Checks Failed");
			});
		});

		describe("when there is insufficient-data", function () {
			var instanceStatusStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				instanceStatusStub = sinon.stub(ec2,"describeInstanceStatusAsync", function () {
					var data = {
						InstanceStatuses : [ {
							SystemStatus : {
								Details : [ {
									Status : "insufficient-data"
								} ]
							}
						} ]
					};
					return (Bluebird.resolve(data));
				});
				return sshAdapter.canSsh(id)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("it returns an error", function () {
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.equal("System Checks Failed due to insufficient data");
			});
		});

	});

	describe("Starts ssh Polling", function () {

		describe("with invalid parameters", function () {
			var result;
			var sshAdapter = new SshAdapter(ec2);

			before(function () {
				return sshAdapter.SshPolling(undefined)
				.catch(function (err) {
					result = err;
				});
			});

			it("fails", function () {
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.equal("instanceID parameter is not defined");
			});
		});

		describe("when system checks have passed", function () {
			var canSshStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				canSshStub = sinon.stub(sshAdapter,"canSsh", function () {
					return (Bluebird.resolve(true));
				});

				return sshAdapter.SshPolling(id)
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				canSshStub.restore();
			});

			it("is possible to ssh now", function () {
				expect(result).to.be.true;
			});
		});

		describe("when it is still performing system checks", function () {
			var canSshStub;
			var delayStub;
			var clock;
			var count = 0;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				clock = sinon.useFakeTimers();
				canSshStub = sinon.stub(sshAdapter,"canSsh",function () {
					//First time it will return false. Second time will return true
					if (count > 0) {
						return Bluebird.resolve(true);
					}
					count = count + 1;
					return Bluebird.resolve(false);
				});
				delayStub = sinon.stub(Bluebird,"delay", function () {
					clock.tick(SSH_POLLING_INTERVAL * 1000);
					return Bluebird.resolve();
				});
			});

			after(function () {
				canSshStub.restore();
				clock.restore();
				delayStub.restore();
			});

			it("is possible to ssh eventually", function () {
				return sshAdapter.SshPolling(id)
				.then(function (data) {
					expect(data).to.be.true;
					expect(count).to.equal(1);
					expect(canSshStub.callCount).to.equal(2);
				});
			});
		});

		describe("when system checks have failed", function () {
			var canSshStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				canSshStub = sinon.stub(sshAdapter,"canSsh", function () {
					return (Bluebird.reject(new Error("System Checks Failed")));
				});

				sshAdapter.SshPolling(id)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				canSshStub.restore();
			});

			it("it throws an error", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result.message).to.be.equal("System Checks Failed");
			});
		});

		describe("when system checks detects insufficient-data", function () {
			var canSshStub;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				canSshStub = sinon.stub(sshAdapter,"canSsh", function () {
					return (Bluebird.reject(new Error("System Checks Failed due to insufficient data")));
				});

				return sshAdapter.SshPolling(id)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				canSshStub.restore();
			});

			it("it throws an error", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result.message).to.be.equal("System Checks Failed due to insufficient data");
			});
		});

		describe("when ssh polling encounters a timeout", function () {
			var canSshStub;
			var result;
			var delayStub;
			var clock;
			var TOTAL_NO_OF_ATTEMPTS = 15;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				clock = sinon.useFakeTimers();

				canSshStub = sinon.stub(sshAdapter,"canSsh", function () {
					return (Bluebird.resolve(false));
				});

				delayStub = sinon.stub(Bluebird,"delay", function () {
					clock.tick(SSH_POLLING_INTERVAL * 1000);
					return Bluebird.resolve();
				});

				return sshAdapter.SshPolling(id)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				canSshStub.restore();
				delayStub.restore();
			});

			it("it throws an error", function () {
				expect(result).to.be.an.instanceOf(Error);
				expect(result.message).to.be.equal("Timeout occured!");
				expect(canSshStub.callCount).to.equal(TOTAL_NO_OF_ATTEMPTS + 1);
			});
		});

	});

	describe("Aws faces an internal error", function () {
		var instanceStatusStub;
		var result;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync")
				.rejects(new Error("Simulated Failure"));

			return sshAdapter.SshPolling(id)
			.catch(function (error) {
				result = error;
			});
		});

		after(function () {
			instanceStatusStub.restore();
		});

		it("encounters an error", function () {
			expect(result).to.be.an.instanceOf(Error);
			expect(result.message,"error message").to.equal("Simulated Failure");
		});
	});
});
