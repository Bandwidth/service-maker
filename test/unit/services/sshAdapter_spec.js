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

	describe("Aws faces an internal error", function () {
		var instanceStatusStub;
		var result;
		var sshAdapter = new SshAdapter(ec2);
		before(function () {
			instanceStatusStub = sinon.stub(ec2, "describeInstanceStatusAsync")
				.rejects(new Error("Simulated Failure"));

			return sshAdapter.canSsh(id)
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
