"use strict";

var AWS        = require("aws-sdk");
var sinon      = require("sinon");
var expect     = require("chai").expect;
var SshAdapter = require("../../../lib/services/sshAdapter");
var Bluebird   = require("bluebird");
var options    = {};
var ec2        = new AWS.EC2();

Bluebird.promisifyAll(ec2);
options.ec2 =  ec2;

describe("The SSH Adapter Class", function () {
	var id                   = "i-fbf47257";
	var SSH_POLLING_INTERVAL = 30; //Time in Seconds

	describe("Can Ssh", function () {
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
			sshAdapter.canSsh(id)
			.then(function (data) {
				result = data;
			})
			.catch(function (err) {
				result = err;
			});
		});

		after(function () {
			instanceStatusStub.restore();
		});

		it("is able to connect", function () {
			expect(instanceStatusStub.called).to.be.true;
			expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
			expect(result).to.be.true;
		});
	});

	describe("Tries to ssh", function () {
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
				sshAdapter.canSsh(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("is not able to connect", function () {
				expect(instanceStatusStub.called).to.be.true;
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
				sshAdapter.canSsh(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("it returns an error as system checks have failed", function () {
				expect(instanceStatusStub.called).to.be.true;
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
				sshAdapter.canSsh(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				instanceStatusStub.restore();
			});

			it("it returns an error as there is insufficient-data", function () {
				expect(instanceStatusStub.called).to.be.true;
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.be.an.instanceof(Error);
				expect(result.message).to.equal("System Checks Failed");
			});
		});

	});

	describe("Starts ssh Polling", function () {

		describe("when system checks have passed", function () {
			var instanceStatusStub;
			var clock;
			var result;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
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
				clock.tick(SSH_POLLING_INTERVAL * 1000);

				sshAdapter.startSshPolling(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
				clock.tick(SSH_POLLING_INTERVAL * 1000);
			});

			after(function () {
				instanceStatusStub.restore();
				clock.restore();
			});

			it("is able to connect", function () {
				expect(instanceStatusStub.called).to.be.true;
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
				expect(result).to.not.be.an.instanceof(Error);
			});
		});

		describe("when there is no information regarding the status", function () {
			var instanceStatusStub;
			var clock;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				clock = sinon.useFakeTimers();
				instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync", function () {
					var data = {
						InstanceStatuses : []
					};
					return (Bluebird.resolve(data));
				});

				clock.tick(SSH_POLLING_INTERVAL * 1000);
				sshAdapter.startSshPolling(id);
				clock.tick(SSH_POLLING_INTERVAL * 1000);
			});

			after(function () {
				instanceStatusStub.restore();
				clock.restore();
			});

			it("is not able to connect", function () {
				expect(instanceStatusStub.called).to.be.true;
				expect(instanceStatusStub.args[ 0 ][ 0 ].InstanceIds[ 0 ]).to.equal(id);
			});
		});

		describe("when system checks have failed", function () {
			var instanceStatusStub;
			var result;
			var clock;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				clock = sinon.useFakeTimers();
				instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync", function () {
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

				clock.tick(SSH_POLLING_INTERVAL * 1000);
				sshAdapter.startSshPolling(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
				clock.tick(SSH_POLLING_INTERVAL * 1000);
			});

			after(function () {
				instanceStatusStub.restore();
				clock.restore();
			});

			it("is not able to connect as instance has failed", function () {
				expect(instanceStatusStub.called).to.be.true;
				expect(result).to.be.an.instanceOf(Error);
				expect(result.message).to.equal("System Checks Failed");
			});
		});

		describe("when system checks has returned insufficient-data", function () {
			var instanceStatusStub;
			var result;
			var clock;
			var sshAdapter = new SshAdapter(ec2);
			before(function () {
				clock = sinon.useFakeTimers();
				instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync", function () {
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

				clock.tick(SSH_POLLING_INTERVAL * 1000);
				sshAdapter.startSshPolling(id)
				.then(function (data) {
					result = data;
				})
				.catch(function (err) {
					result = err;
				});
				clock.tick(SSH_POLLING_INTERVAL * 1000);
			});

			after(function () {
				instanceStatusStub.restore();
				clock.restore();
			});

			it("is not able to connect as system checks have failed", function () {
				expect(instanceStatusStub.called).to.be.true;
				expect(result).to.be.instanceOf(Error);
				expect(result.message).to.equal("System Checks Failed");
			});
		});
	});

	describe("Aws faces an internal error", function () {
		var instanceStatusStub;
		var clock;
		var result;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			clock = sinon.useFakeTimers();
			instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync")
				.rejects(new Error("Simulated Failure"));

			clock.tick(SSH_POLLING_INTERVAL * 1000);
			sshAdapter.startSshPolling(id)
			.then(function (data) {
				result = data;
			})
			.catch(function (error) {
				result = error;
			});
			clock.tick(SSH_POLLING_INTERVAL * 1000);
		});

		after(function () {
			instanceStatusStub.restore();
			clock.restore();
		});

		it("encounters an error", function () {
			expect(result,"error").to.be.an.instanceOf(Error);
			expect(result.message,"error message").to.equal("Simulated Failure");
		});
	});
});
