"use strict";

var Request         = require("apparition").Request;
var Bluebird        = require("bluebird");
var Hapi            = require("hapi");
var Rest            = require("../../../lib/plugins/rest");
var MemoryMapper    = require("genesis").MemoryMapper;
var expect          = require("chai").expect;
var InstanceAdapter = require("../../../lib/services/instanceAdapter");
var Instance        = require("../../../lib/models/Instance");
var AwsAdapter      = require("../../../lib/services/awsAdapter");
var Sinon           = require("sinon");
var _               = require("lodash");

require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_INSTANCE_ID = "da14fbf2-5404-4f92-b55f-a961578204ed";
	var VALID_AMI         = "ami-d05e75b8";
	var VALID_TYPE        = "t2.micro";
	var ID_REGEX          = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	var INVALID_AMI       = [ "ami-defualt" ];
	var INVALID_QUERY     = "clumsy-cheetah";

	var location          = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

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
		var server = new Hapi.Server();
		var runInstancesStub;

		var awsAdapter = new AwsAdapter();

		before(function () {

			runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
			.returns(Bluebird.resolve({
				id       : "0373ee03-ac16-42ec-b81c-37986d4bcb01",
				ami      : "ami-d05e75b8",
				type     : "t2.micro",
				revision : 0,
				state    : "pending",
				uri      : null
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
			runInstancesStub.restore();
			return server.stopAsync();
		});

		describe("with valid parameters passed", function () {
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
				});
			});
		});

		describe("with no parameters passed", function () {
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

		describe("with invalid parameter(s) passed", function () {
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

	});

	describe("fails in creating a new instance", function () {
		var server = new Hapi.Server();
		var runInstancesStub;

		var awsAdapter = new AwsAdapter();

		before(function () {

			server.connection();

			return server.registerAsync({
				register : Rest,
				options  : {
					awsAdapter : awsAdapter
				}
			});
		});

		after(function () {
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

	describe("updating a created instance", function () {

		var server     = new Hapi.Server();
		var instances  = new InstanceAdapter();
		var awsAdapter = new AwsAdapter();

		before(function () {

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances  : instances,
					awsAdapter : awsAdapter
				}
			});
		});

		describe("setting the status of a created instance to terminated", function () {

			var instanceID;
			var revision;
			var responseCode;
			var updatedInstance;
			var terminateInstancesStub;

			before(function () {

				return instances.createInstance()
				.then(function (instance) {
					instanceID = instance.id;
					revision   = instance.revision;
					//revision reflects the document is updated twice when terminateInstances() is successful.
					terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "terminated",
							uri      : null,
							revision : instance.revision + 2
						})
					);

					updatedInstance = new Instance({
						id       : instance.id,
						ami      : instance.ami,
						type     : instance.type,
						state    : "terminated",
						uri      : null,
						revision : instance.revision + 2
					});
					var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
					.payload({
						ami      : instance.ami,
						type     : instance.type,
						uri      : instance.uri,
						state    : "terminating",
						revision : instance.revision
					});
					return request.inject(server);
				})
				.then(function (response) {
					responseCode = response.statusCode;
				});
			});

			after(function () {
				terminateInstancesStub.restore();
			});

			it("the status is set to terminated", function () {
				return instances.getInstance({ id : instanceID })
				.then(function (response) {
					expect(response.id).to.equal(updatedInstance.id);
					expect(response.ami).to.equal(updatedInstance.ami);
					expect(response.type).to.equal(updatedInstance.type);
					expect(response.state).to.equal(updatedInstance.state);
					expect(response.uri).to.equal(updatedInstance.uri);
					expect(response.revision).to.be.above(revision);
					expect(responseCode).to.equal(200);
				});
			});
		});

		describe("when the instance ID doesn't exist", function () {

			var result;

			before(function () {
				var request = new Request("PUT", "/v1/instances/" + INVALID_QUERY).mime("application/json")
				.payload({
					ami      : "ami-d05e75b8",
					type     : "t2.micro",
					uri      : null,
					state    : "terminating",
					revision : 0
				});

				return request.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			it("a 404 error is thrown", function () {
				expect(result.statusCode).to.equal(404);
			});
		});

		describe("when the payload is malformed", function () {

			var result;

			before(function () {
				return instances.createInstance()
				.then(function (instance) {
					var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
					.payload({
						ami      : [ "ami-d05e75b8" ],
						type     : "t2.micro",
						uri      : null,
						state    : "terminating",
						revision : instance.revision
					});
					return request.inject(server);
				})
				.then(function (response) {
					result = response;
				});
			});

			it("a 400 error is thrown", function () {
				expect(result.statusCode).to.equal(400);
			});
		});

		describe("when two requests are made simultaneously", function () {

			var responses;
			var terminateInstancesStub;

			before(function () {
				return instances.createInstance()
				.then(function (instance) {
					//revision reflects the document is updated twice when terminateInstances() is successful.
					terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "terminated",
							uri      : instance.uri,
							revision : instance.revision + 2
						})
					);
					return instances.getInstance({ id : instance.id });
				})
				.then(function (instance) {
					var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
					.payload({
						ami      : instance.ami,
						type     : instance.type,
						uri      : null,
						state    : "terminating",
						revision : instance.revision
					});

					return Bluebird.join(request.inject(server), request.inject(server));
				})
				.then(function (results) {
					responses = results;
				});

			});

			after(function () {
				terminateInstancesStub.restore();
			});

			it("one succeeds while the other fails", function () {
				var failed = _.some(responses, function (responses) {
					return responses.statusCode === 409;
				});

				expect (failed, "concurrency").to.be.true;
			});
		});

		describe("setting the status of an instance to a state not handled by update", function () {

			var instanceID;
			var responseCode;
			var originalInstance;

			before(function () {

				return instances.createInstance()
				.then(function (instance) {
					instanceID = instance.id;
					originalInstance = instance;

					var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
					.payload({
						ami      : instance.ami,
						type     : instance.type,
						uri      : instance.uri,
						state    : "failed",
						revision : instance.revision
					});
					return request.inject(server);
				})
				.then(function (response) {
					responseCode = response.statusCode;
				});
			});

			it("throws an error", function () {
				expect(responseCode).to.equal(400);
			});

			it("leaves the instance unmodified", function () {
				return instances.getInstance({ id : instanceID })
				.then(function (response) {
					expect(response).to.deep.equal(originalInstance);
				});
			});
		});

		describe("when there is an AWS error", function () {

			var terminateInstancesStub;
			var instanceID;
			var response;

			before(function () {
				terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances").rejects(new Error("AWS Error"));
				return instances.createInstance()
				.then(function (instance) {
					instanceID = instance.id;
					var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
					.payload({
						ami      : instance.ami,
						type     : instance.type,
						uri      : instance.uri,
						state    : "terminating",
						revision : instance.revision
					});
					return request.inject(server);
				})
				.then(function (result) {
					response = result;
				});
			});

			after(function () {
				terminateInstancesStub.restore();
			});

			it("returns the instance with state set to terminating", function () {
				expect(response.result.id).to.equal(instanceID);
				expect(response.result.state).to.equal("terminating");
				expect(response.statusCode).to.equal(200);
			});

			it("returns the instance with state set to failed", function () {
				return instances.getInstance({ id : instanceID })
				.then(function (response) {
					expect(response.id).to.equal(instanceID);
					expect(response.state).to.equal("failed");
					expect(response.uri).to.equal(null);
				});

			});
		});

	});

	describe("update when the connection to the database fails", function () {

		var result;
		var updateStub;
		var server    = new Hapi.Server();
		var instances = new InstanceAdapter();

		before(function () {
			updateStub = Sinon.stub(instances, "updateInstance").rejects(new Error("Connection to database failed."));
			server.connection();
			server.registerAsync({
				register : Rest,
				options  : {
					instances : instances
				}
			});
			return instances.createInstance()
			.then(function (instance) {
				return instances.getInstance({ id : instance.id });
			})
			.then(function (instance) {
				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "terminating",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (response) {
				result = response.result;
			});
		});

		after(function () {
			updateStub.restore();
		});

		it("throws a 500 error", function () {
			expect(result.statusCode).to.equal(500);
		});
	});
	describe("when the database fails after terminateInstances has run", function () {

		var result;
		var updateStub;
		var terminateInstancesStub;
		var server     = new Hapi.Server();
		var instances  = new InstanceAdapter();
		var awsAdapter = new AwsAdapter();
		before(function () {

			return instances.createInstance()
			.then(function (instance) {
				updateStub = Sinon.stub(instances, "updateInstance").returns(
					Bluebird.resolve({
						id       : instance.id,
						ami      : instance.ami,
						type     : instance.type,
						state    : "terminating",
						uri      : instance.uri,
						revision : instance.revision + 1
					})
				);
				updateStub.onCall(1).rejects(new Error("Connection to the database fails."));

				//revision reflects the document is updated twice when terminateInstances() is successful.
				terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances").returns(
					Bluebird.resolve({
						id       : instance.id,
						ami      : instance.ami,
						type     : instance.type,
						state    : "terminated",
						uri      : instance.uri,
						revision : instance.revision + 2
					})
				);

				server.connection();
				server.registerAsync({
					register : Rest,
					options  : {
						instances  : instances,
						awsAdapter : awsAdapter
					}
				});

				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "terminating",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (response) {
				result = response.result;
			});
		});

		after(function () {
			terminateInstancesStub.restore();
			updateStub.restore();
		});

		it("leaves the state unchanged(terminating)", function () {
			expect(updateStub.callCount).to.equal(2);
			expect(result.state).to.equal("terminating");
		});
	});

	describe("when the database and terminateInstances fail", function () {

		var response;
		var getStub;
		var terminateInstancesStub;
		var server     = new Hapi.Server();
		var instances  = new InstanceAdapter();
		var awsAdapter = new AwsAdapter();
		before(function () {

			return instances.createInstance()
			.then(function (instance) {
				getStub = Sinon.stub(instances, "getInstance").rejects(new Error("Connection to the database fails."));
				terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances")
				.rejects(new Error("AWS Error"));

				server.connection();
				server.registerAsync({
					register : Rest,
					options  : {
						instances  : instances,
						awsAdapter : awsAdapter
					}
				});

				var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
				.payload({
					ami      : instance.ami,
					type     : instance.type,
					uri      : instance.uri,
					state    : "terminating",
					revision : instance.revision
				});
				return request.inject(server);
			})
			.then(function (result) {
				response = result;
			});
		});

		after(function () {
			terminateInstancesStub.restore();
			getStub.restore();
		});

		it("leaves the state unchanged(terminating)", function () {
			expect(response.result.state).to.equal("terminating");
			expect(response.statusCode).to.equal(200);
		});
	});

	describe("creating awsAdapter object", function () {
		var server     = new Hapi.Server();
		var awsAdapter = {};
		var result;
		awsAdapter.serverLog = function () { };

		before(function () {

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : "wrongthing"
				}
			})
			.catch(function (err) {
				result = err;
			});
		});

		it("fails", function () {
			expect(result).to.be.an.instanceof(Error);
			expect(result.message).to.contain("child \"instances\" fails");
		});
	});
});
