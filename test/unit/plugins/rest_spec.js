"use strict";

var Request         = require("apparition").Request;
var Bluebird        = require("bluebird");
var Hapi            = require("hapi");
var Rest            = require("../../../lib/plugins/rest");
var MemoryMapper    = require("genesis").MemoryMapper;
var expect          = require("chai").expect;
var InstanceAdapter = require("../../../lib/services/instanceAdapter.js");
var AwsAdapter      = require("../../../lib/services/awsAdapter");
var SshAdapter      = require("../../../lib/services/sshAdapter");
var Sinon           = require("sinon");

require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_INSTANCE_ID  = "da14fbf2-5404-4f92-b55f-a961578204ed";
	var VALID_AMI          = "ami-d05e75b8";
	var VALID_TYPE         = "t2.micro";
	var ID_REGEX           = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	var INVALID_AMI        = [ "ami-defualt" ];
	var INVALID_QUERY      = "clumsy-cheetah";
	var location           = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
	var VALID_EC2_INSTANCE = "i-9444c16a";
	var VALID_IP_ADDRESS   = "127.0.0.1";

	it("is a Hapi plugin", function () {
		expect(Rest, "attributes").to.have.property("register")
		.that.is.a("function")
		.and.that.has.property("attributes")
		.that.has.property("name", "rest");
	});

	describe("when registered", function () {
		var server = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync(Rest);
		});

		after(function () {
			return server.stopAsync();
		});

		it("provides the '/' route", function () {
			return new Request("GET", "/").inject(server)
			.then(function (response) {
				expect(response.statusCode, "status").to.equal(200);
			});
		});
	});
	describe("creating a new instance", function () {
		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();
		var createInstanceStub;
		var runInstancesStub;
		var startSshPollingStub;
		var getPublicIPAddressStub;
		var updateInstanceStub;

		var awsAdapter = new AwsAdapter();
		var sshAdapter = new SshAdapter();

		before(function () {
			createInstanceStub = Sinon.stub(instanceAdapter, "createInstance")
			.returns(Bluebird.resolve({
				id    : "0373ee03-ac16-42ec-b81c-37986d4bcb01",
				ami   : "ami-d05e75b8",
				type  : "t2.micro",
				state : "pending",
				uri   : ""
			}));

			runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
			.returns(Bluebird.resolve({
				id         : "0373ee03-ac16-42ec-b81c-37986d4bcb01",
				ami        : "ami-d05e75b8",
				type       : "t2.micro",
				revision   : 0,
				state      : "pending",
				uri        : null,
				instanceID : VALID_EC2_INSTANCE
			}));

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					awsAdapter : awsAdapter,
					sshAdapter : sshAdapter,
					instances  : instanceAdapter
				}
			});
		});

		after(function () {
			createInstanceStub.restore();
			runInstancesStub.restore();
			return server.stopAsync();
		});

		describe("with valid parameters passed", function () {

			before(function () {
				startSshPollingStub = Sinon.stub(sshAdapter, "startSshPolling")
				.returns(Bluebird.resolve());

				updateInstanceStub = Sinon.stub(instanceAdapter,"updateInstance")
				.returns(Bluebird.resolve("asdasd"));

				getPublicIPAddressStub = Sinon.stub(awsAdapter, "getPublicIPAddress", function () {
					return (Bluebird.resolve(VALID_IP_ADDRESS));
				});
			});

			after(function () {
				getPublicIPAddressStub.restore();
				startSshPollingStub.restore();
				updateInstanceStub.restore();
			});

			it("creates the instance and returns the canonical uri", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
					expect(startSshPollingStub.called).to.be.true;
					expect(getPublicIPAddressStub.called).to.be.true;
					expect(updateInstanceStub.called).to.be.true;
				});
			});
		});

		describe("with no parameters passed", function () {
			before(function () {
				startSshPollingStub = Sinon.stub(sshAdapter, "startSshPolling")
				.returns(Bluebird.resolve());

				updateInstanceStub = Sinon.stub(instanceAdapter,"updateInstance")
				.returns(Bluebird.resolve());

				getPublicIPAddressStub = Sinon.stub(awsAdapter, "getPublicIPAddress", function () {
					return (Bluebird.resolve(VALID_IP_ADDRESS));
				});
			});

			after(function () {
				getPublicIPAddressStub.restore();
				startSshPollingStub.restore();
				updateInstanceStub.restore();
			});

			it("creates the instance and returns the canonical uri", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json");
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
				});
			});
		});

		describe("Ssh polling encounters an error", function () {
			before(function () {
				startSshPollingStub = Sinon.stub(sshAdapter, "startSshPolling")
				.rejects(new Error("Simulated Failure"));

				updateInstanceStub = Sinon.stub(instanceAdapter,"updateInstance")
				.returns(Bluebird.resolve());

				getPublicIPAddressStub = Sinon.stub(awsAdapter, "getPublicIPAddress", function () {
					return (Bluebird.resolve(VALID_IP_ADDRESS));
				});
			});

			after(function () {
				getPublicIPAddressStub.restore();
				startSshPollingStub.restore();
				updateInstanceStub.restore();
			});

			it("fails", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
				});
			});
		});

		describe("Getting IP address encounters an error", function () {

			before(function () {
				startSshPollingStub = Sinon.stub(sshAdapter, "startSshPolling")
				.returns(Bluebird.resolve());

				updateInstanceStub = Sinon.stub(instanceAdapter,"updateInstance")
				.returns(Bluebird.resolve());

				getPublicIPAddressStub = Sinon.stub(awsAdapter, "getPublicIPAddress")
				.rejects(new Error("Simulated Failure"));
			});

			after(function () {
				getPublicIPAddressStub.restore();
				startSshPollingStub.restore();
				updateInstanceStub.restore();
			});

			it("fails", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					response.payload = JSON.parse(response.payload);
					expect(response.statusCode, "status").to.equal(201);
					expect(response.headers.location, "location").to.match(location);
				});
			});
		});
	});

	describe("with invalid parameter(s) passed", function () {
		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();
		var createInstanceStub;

		before(function () {
			var AMIError  = new Error();
			AMIError.name = "ValidationError";

			createInstanceStub = Sinon.stub(instanceAdapter, "createInstance")
			.rejects(AMIError);

			server.connection();

			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instanceAdapter
				}
			});

		});

		after(function () {
			createInstanceStub.restore();
		});

		it("returns an error with statusCode 400", function () {
			var request = new Request("POST", "/v1/instances").mime("application/json").payload({
				ami  : INVALID_AMI,
				type : VALID_TYPE
			});
			return request.inject(server)
			.then(function (response) {
				var error = JSON.parse(response.payload);
				expect(error.statusCode, "status").to.equal(400);
				expect(error.message)
				.to.equal("Bad Request: Please check the parameters passed.");
			});
		});
	});
	describe("fails in creating a new instance", function () {
		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();
		var createInstanceStub;
		var runInstancesStub;
		var updateInstanceStub;

		var awsAdapter = new AwsAdapter();

		before(function () {
			createInstanceStub = Sinon.stub(instanceAdapter, "createInstance")
			.returns(Bluebird.resolve({
				ami   : "ami-d05e75b8",
				type  : "t2.micro",
				state : "pending",
				uri   : ""
			}));

			updateInstanceStub = Sinon.stub(instanceAdapter, "updateInstance")
			.returns(Bluebird.resolve({
				ami   : "ami-d05e75b8",
				type  : "t2.micro",
				state : "failed",
				uri   : ""
			}));

			server.connection();

			return server.registerAsync({
				register : Rest,
				options  : {
					awsAdapter : awsAdapter
				}
			});
		});

		after(function () {
			updateInstanceStub.restore();
			createInstanceStub.restore();
			return server.stopAsync();
		});

		describe("when the credentials aren't properly configured", function () {
			before(function () {
				var AuthError  = new Error();
				AuthError.name = "AuthFailure";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(AuthError);
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("returns an error with statusCode 500", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					var error = JSON.parse(response.payload);
					expect(error.statusCode, "status").to.equal(500);
					expect(error.message)
					.to.equal("An internal server error occurred");
				});
			});
		});

		describe("with an ami that doesn't exist", function () {

			before(function () {
				var AMIError  = new Error();
				AMIError.name = "InvalidAMIID.Malformed";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(AMIError);
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("returns an error with statusCode 400", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : "ami-invalid",
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					var error = JSON.parse(response.payload);
					expect(error.statusCode, "status").to.equal(400);
					expect(error.message)
					.to.equal("The AMI entered does not exist. Ensure it is of the form ami-xxxxxx.");
				});
			});
		});

		describe("with a type that doesn't exist", function () {

			before(function () {
				var TypeError  = new Error();
				TypeError.name = "InvalidParameterValue";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(TypeError);
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("returns an error with statusCode 400", function () {
				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : "t2.notExist"
				});
				return request.inject(server)
				.then(function (response) {
					var error = JSON.parse(response.payload);
					expect(error.statusCode, "status").to.equal(400);
					expect(error.message)
					.to.equal("The Type entered does not exist. Ensure it is a valid EC2 type.");
				});
			});
		});
	});

	describe("when there is a problem with the database connection", function () {
		var mapper = new MemoryMapper();
		var server = new Hapi.Server();

		before(function () {
			Sinon.stub(mapper, "create").rejects(new Error("Simulated Failure."));
			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					mapper : mapper
				}
			});
		});

		after(function () {
			mapper.create.restore();
			return server.stopAsync();
		});

		it("returns an internal server error with status code 500", function () {
			var request = new Request("POST", "/v1/instances").mime("application/json").payload({
				ami  : VALID_AMI,
				type : VALID_TYPE
			});
			return request.inject(server)
			.then(function (response) {
				expect(response.result.message).to.equal("An internal server error occurred");
				expect(response.statusCode).to.equal(500);
			});

		});
	});

	describe("getting an instance", function () {

		var server = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();

		before(function () {

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instanceAdapter
				}
			});
		});

		after(function () {
			return server.stopAsync();
		});

		describe("with an invalid instance id", function () {
			var result;
			var getInstanceStub;
			before(function () {

				getInstanceStub = Sinon.stub(instanceAdapter, "getInstance")
				.returns(Bluebird.resolve(null));

				return new Request("GET", "/v1/instances/" + INVALID_QUERY).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getInstanceStub.restore();
			});

			it("shows the instance does not exist", function () {
				expect(result.statusCode,"status").to.equal(404);
				expect(getInstanceStub.args[ 0 ][ 0 ].id).to.equal(INVALID_QUERY);
			});
		});

		describe("with a valid instance", function () {
			var getInstanceStub;

			before(function () {
				getInstanceStub = Sinon.stub(instanceAdapter, "getInstance")
				.returns(Bluebird.resolve({
					id    : VALID_INSTANCE_ID,
					ami   : "ami-d05e75b8",
					type  : "t2.micro",
					state : "pending",
					uri   : ""
				}));
			});

			after(function () {
				getInstanceStub.restore();
			});

			it("gets the instance of the requsted id", function () {
				return new Request("GET", "/v1/instances/" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					var res = JSON.parse(response.payload);
					expect(response.statusCode,"status").to.equal(200);
					expect(res.id).to.match(ID_REGEX);
					expect(res.ami).to.equal(VALID_AMI);
					expect(res.type).to.equal(VALID_TYPE);
					expect(res.state).to.equal("pending");
					expect(getInstanceStub.args[ 0 ][ 0 ].id).to.equal(VALID_INSTANCE_ID);
				});
			});
		});
	});

	describe("querying for instances", function () {

		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();

		before(function () {
			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instanceAdapter
				}
			});
		});

		after(function () {
			return server.stopAsync();
		});

		describe("with a valid type", function () {
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ {
						id    : VALID_INSTANCE_ID,
						ami   : "ami-d05e75b8",
						type  : "t2.micro",
						state : "pending",
						uri   : ""
					} ]
				));
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an array of instances with the given type", function () {

				return new Request("GET", "/v1/instances?type=" + VALID_TYPE).inject(server)
				.then(function (response) {
					var res = JSON.parse(response.payload);
					expect(response.statusCode,"status").to.equal(200);
					expect(res.instances[ 0 ].id).to.match(ID_REGEX);
					expect(res.instances[ 0 ].ami).to.equal(VALID_AMI);
					expect(res.instances[ 0 ].type).to.equal(VALID_TYPE);
					expect(res.instances[ 0 ].state).to.equal("pending");
					expect(res.instances).to.have.length.of.at.least(1);
					expect(getAllInstancesStub.args[ 0 ][ 0 ].type).to.equal(VALID_TYPE);
				});
			});
		});

		describe("with an invalid instance by sending non-exisitng Instance Id and type", function () {
			var result;
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ ]));

				return new Request("GET", "/v1/instances?type=" + INVALID_QUERY + "&id=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an empty array of instances", function () {
				var payload;
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(0);
				expect(getAllInstancesStub.args[ 0 ][ 0 ].type).to.equal(INVALID_QUERY);
				expect(getAllInstancesStub.args[ 0 ][ 0 ].id).to.equal(INVALID_QUERY);
				expect(Object.keys(getAllInstancesStub.args[ 0 ][ 0 ]).length).to.equal(2);
			});
		});

		describe("with a valid ID", function () {
			var result;
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ {
						id    : VALID_INSTANCE_ID,
						ami   : "ami-d05e75b8",
						type  : "t2.micro",
						state : "pending",
						uri   : ""
					} ]
				));

				return new Request("GET", "/v1/instances?id=" + VALID_INSTANCE_ID)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an instance with requested id", function () {
				var payload;

				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(1);
				expect(payload.instances[ 0 ].id).to.equal(VALID_INSTANCE_ID);
				expect(getAllInstancesStub.args[ 0 ][ 0 ].id).to.equal(VALID_INSTANCE_ID);
				expect(Object.keys(getAllInstancesStub.args[ 0 ][ 0 ]).length).to.equal(1);
			});
		});

		describe("with a valid AMI", function () {
			var result;
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ {
						id    : VALID_INSTANCE_ID,
						ami   : "ami-d05e75b8",
						type  : "t2.micro",
						state : "pending",
						uri   : ""
					} ]
				));

				return new Request("GET", "/v1/instances?ami=" + VALID_AMI)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an array of instances with requested ami", function () {
				expect(getAllInstancesStub.args[ 0 ][ 0 ].ami).to.equal(VALID_AMI);
				expect(Object.keys(getAllInstancesStub.args[ 0 ][ 0 ]).length).to.equal(1);
				expect(result.statusCode,"status").to.equal(200);
			});
		});

		describe("with state=pending", function () {
			var result;
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ {
						id    : VALID_INSTANCE_ID,
						ami   : "ami-d05e75b8",
						type  : "t2.micro",
						state : "pending",
						uri   : ""
					} ]
				));

				return new Request("GET", "/v1/instances?state=pending")
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an array of instances which are in a pending state", function () {
				expect(getAllInstancesStub.args[ 0 ][ 0 ].state).to.equal("pending");
				expect(Object.keys(getAllInstancesStub.args[ 0 ][ 0 ]).length).to.equal(1);
				expect(result.statusCode,"status").to.equal(200);
			});
		});

		describe("with invalid URI", function () {
			var result;
			var getAllInstancesStub;

			before(function () {
				getAllInstancesStub = Sinon.stub(instanceAdapter, "getAllInstances")
				.returns(Bluebird.resolve([ ]));

				return new Request("GET", "/v1/instances?uri=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				getAllInstancesStub.restore();
			});

			it("returns an empty array of intsances", function () {
				var payload;
				expect(getAllInstancesStub.args[ 0 ][ 0 ].uri).to.equal(INVALID_QUERY);
				expect(Object.keys(getAllInstancesStub.args[ 0 ][ 0 ]).length).to.equal(1);
				expect(result.statusCode,"status").to.equal(200);
				payload = JSON.parse(result.payload);
				expect(payload.instances.length).equal(0);
			});
		});

		describe("with multiple values for a parameter", function () {
			var result;

			before(function () {

				return new Request("GET", "/v1/instances?ami=" + INVALID_QUERY + "&ami=" + INVALID_QUERY)
				.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("fails and returns a Bad Request", function () {
				expect(result.statusCode,"status").to.equal(400);
			});
		});
	});

	describe("encountering an internal error", function () {
		var server    = new Hapi.Server();
		var instances = new InstanceAdapter();

		before(function () {
			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instances
				}
			});
		});

		after(function () {
			return server.stopAsync();
		});

		describe("failing to find an instance for specified instanceId", function () {
			var result;

			before(function () {
				Sinon.stub(instances, "getInstance").rejects(new Error("Simulated Failure"));

				return new Request("GET", "/v1/instances/foo-bar-baz").inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				instances.getInstance.restore();
			});

			it("fails", function () {
				expect(result.statusCode).to.equal(500);
			});
		});

		describe("failing to find all instances", function () {
			var result;

			before(function () {
				Sinon.stub(instances, "getAllInstances", function () {
					return Bluebird.reject(new Error("Simulated Failure."));
				});
				return new Request("GET", "/v1/instances?id=" + VALID_INSTANCE_ID).inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				instances.getAllInstances.restore();
			});

			it("fails", function () {
				expect(result.statusCode).to.equal(500);
			});
		});
	});
});