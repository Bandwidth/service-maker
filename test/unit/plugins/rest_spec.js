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
var Environment     = require("apparition").Environment;

require("sinon-as-promised");

Bluebird.promisifyAll(Hapi);

describe("The Rest plugin", function () {
	var VALID_INSTANCE_ID = "da14fbf2-5404-4f92-b55f-a961578204ed";
	var VALID_AMI         = "ami-d05e75b8";
	var VALID_TYPE        = "t2.micro";
	var VALID_SEC_GROUP   = "default-group";
	var ID_REGEX          = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
	var VALID_IP_ADDRESS  = "127.0.0.1";

	var INVALID_AMI       = [ "ami-default" ];
	var INVALID_QUERY     = "clumsy-cheetah";

	var location          = /\/v1\/instances\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	it("is a Hapi plugin", function () {
		expect(Rest, "attributes").to.have.property("register")
		.that.is.a("function")
		.and.that.has.property("attributes")
		.that.has.property("name", "rest");
	});

	describe("when registered", function () {
		var server      = new Hapi.Server();

		before(function () {
			server.connection();
			return server.registerAsync(Rest);
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
			server.connection();
			server.registerAsync({
				register : Rest,
				options  : {
					awsAdapter : awsAdapter
				}
			});
		});

		describe("with valid parameters passed - excluding a security group", function () {
			var result;

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

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("creates the instance with the parameters passed", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal("service-maker");
			});

			it("returns the canonical uri with appropriate an statusCode", function () {
				expect(result.statusCode, "status").to.equal(201);
				expect(result.headers.location, "location").to.match(location);
			});
		});

		describe("with valid parameters passed - including a security group", function () {
			var result;

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

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami           : VALID_AMI,
					type          : VALID_TYPE,
					securityGroup : VALID_SEC_GROUP
				});
				return request.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("creates the instance with the parameters passed", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal(VALID_SEC_GROUP);
			});

			it("returns the canonical uri with appropriate an statusCode", function () {
				expect(result.statusCode, "status").to.equal(201);
				expect(result.headers.location, "location").to.match(location);
			});
		});

		describe("with no parameters passed", function () {
			var result;

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

				var request = new Request("POST", "/v1/instances");
				return request.inject(server)
				.then(function (response) {
					result = response;
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("creates the instance with the parameters passed", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal("service-maker");
			});

			it("returns the canonical uri with appropriate an statusCode", function () {
				expect(result.statusCode, "status").to.equal(201);
				expect(result.headers.location, "location").to.match(location);
			});
		});

		describe("with invalid parameter(s) passed", function () {

			var error;

			before(function () {

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : INVALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					error = JSON.parse(response.payload);
				});
			});

			it("returns an error with statusCode 400", function () {
				expect(error.statusCode, "status").to.equal(400);
				expect(error.message)
				.to.equal("Bad Request: Please check the parameters passed.");
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

		describe("when the credentials aren't properly configured", function () {

			var result;

			before(function () {
				var AuthError  = new Error();
				AuthError.name = "AuthFailure";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(AuthError);

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					result = JSON.parse(response.payload);
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("returns an error with statusCode 500", function () {
				expect(result.statusCode, "status").to.equal(500);
				expect(result.message)
				.to.equal("An internal server error occurred");
			});
		});

		describe("with an ami that doesn't exist", function () {

			var result;

			before(function () {
				var AMIError  = new Error();
				AMIError.name = "InvalidAMIID.Malformed";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(AMIError);

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : "ami-invalid",
					type : VALID_TYPE
				});
				return request.inject(server)
				.then(function (response) {
					result = JSON.parse(response.payload);
				});
			});

			after(function () {
				runInstancesStub.restore();
			});

			it("runInstances is called with the correct parameters", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal("ami-invalid");
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal("service-maker");
			});

			it("returns an error with statusCode 400", function () {
				expect(result.statusCode, "status").to.equal(400);
				expect(result.message)
				.to.equal("The AMI entered does not exist. Ensure it is of the form ami-xxxxxx.");
			});
		});

		describe("with a type that doesn't exist", function () {

			var result;

			before(function () {
				var TypeError     = new Error();
				TypeError.name    = "InvalidParameterValue";
				TypeError.message = "The Type entered does not exist. Ensure it is a valid EC2 type.";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(TypeError);

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami  : VALID_AMI,
					type : "t2.notExist"
				});
				return request.inject(server)
				.then(function (response) {
					result = JSON.parse(response.payload);
				});

			});

			after(function () {
				runInstancesStub.restore();
			});

			it("runInstances is called with the correct parameters", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal("t2.notExist");
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal("service-maker");
			});

			it("returns an error with statusCode 400", function () {
				expect(result.statusCode, "status").to.equal(400);
				expect(result.message)
				.to.equal("The Type entered does not exist. Ensure it is a valid EC2 type.");
			});
		});

		describe("with a reserved security group name", function () {

			var result;

			before(function () {
				var SecurityGroupError     = new Error();
				SecurityGroupError.name    = "InvalidParameterValue";
				SecurityGroupError.message = "The security group name entered is reserved";

				runInstancesStub = Sinon.stub(awsAdapter, "runInstances")
				.rejects(SecurityGroupError);

				var request = new Request("POST", "/v1/instances").mime("application/json").payload({
					ami           : VALID_AMI,
					type          : "t2.micro",
					securityGroup : "reserved-group"
				});

				return request.inject(server)
				.then(function (response) {
					result = JSON.parse(response.payload);
				});

			});

			after(function () {
				runInstancesStub.restore();
			});

			it("runInstances is called with the correct parameters", function () {
				expect(runInstancesStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(runInstancesStub.firstCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(runInstancesStub.firstCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(runInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
				expect(runInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
				expect(runInstancesStub.firstCall.args[ 1 ]).to.equal("reserved-group");
			});

			it("returns an error with statusCode 400", function () {
				expect(result.statusCode, "status").to.equal(400);
				expect(result.message)
				.to.equal("The security group name entered is reserved");
			});
		});

	});

	describe("when there is a problem with the database connection", function () {
		var mapper      = new MemoryMapper();
		var server      = new Hapi.Server();
		var environment = new Environment();

		before(function () {
			Sinon.stub(mapper, "create").rejects(new Error("Simulated Failure."));
			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					mapper : mapper
				}
			});
		});

		after(function () {
			environment.restore();
			mapper.create.restore();
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

		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();
		var environment     = new Environment();
		before(function () {

			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instanceAdapter
				}
			});
		});

		after(function () {
			environment.restore();
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
		var environment     = new Environment();

		before(function () {

			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();

			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instanceAdapter
				}
			});
		});

		after(function () {
			environment.restore();
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
		var server      = new Hapi.Server();
		var instances   = new InstanceAdapter();
		var environment = new Environment();
		before(function () {
			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances : instances
				}
			});
		});

		after(function () {
			environment.restore();
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

		var server      = new Hapi.Server();
		var instances   = new InstanceAdapter();
		var awsAdapter  = new AwsAdapter();
		var environment = new Environment();
		before(function () {

			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances  : instances,
					awsAdapter : awsAdapter
				}
			});
		});

		after(function () {
			environment.restore();
		});

		describe("setting the state of a created instance to terminated", function () {

			var instanceID;
			var revision;
			var responseCode;
			var updatedInstance;
			var terminateInstancesStub;

			describe("when the instance is valid", function () {
				before(function (done) {

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
							.then(function () {
								done();
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

				it("terminateInstances is called with the correct parameters", function () {
					expect(terminateInstancesStub.args[ 0 ][ 0 ]).to.equal(updatedInstance.id);
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

				before(function (done) {
					return instances.createInstance()
					.then(function (instance) {
						//revision reflects the document is updated twice when terminateInstances() is successful.
						terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {

							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "terminated",
								uri      : instance.uri,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							});
						});
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

			describe("when there is an AWS error", function () {

				var terminateInstancesStub;
				var instanceID;
				var response;

				before(function () {
					terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances")
					.rejects(new Error("AWS Error"));

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

				it("terminateInstances is called with the instance ID", function () {
					expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
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

			describe("when the connection to the database fails", function () {

				var result;
				var updateStub;
				var server    = new Hapi.Server();
				var instances = new InstanceAdapter();

				before(function () {
					updateStub = Sinon.stub(instances, "updateInstance")
					.rejects(new Error("Connection to database failed."));

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

			describe("when the database completely fails after terminateInstances has run", function () {

				var result;
				var updateStub;
				var terminateInstancesStub;
				var server     = new Hapi.Server();
				var instances  = new InstanceAdapter();
				var awsAdapter = new AwsAdapter();
				before(function (done) {

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
						terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "terminated",
								uri      : instance.uri,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							});
						});

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

				it("terminateInstances is called with the instance ID", function () {
					expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(terminating)", function () {
					expect(updateStub.callCount).to.equal(2);
					expect(result.state).to.equal("terminating");
				});
			});

			describe("when the database fails after terminateInstances has run, but then recovers", function () {

				var result;
				var updateStub;
				var getStub;
				var terminateInstancesStub;
				var server     = new Hapi.Server();
				var instances  = new InstanceAdapter();
				var awsAdapter = new AwsAdapter();
				before(function (done) {

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

						updateStub.onCall(1).rejects(new Error("Simulated Error"));

						updateStub.onCall(2).returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "failed",
								uri      : instance.uri,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							})
						);
						//revision reflects the document is updated twice when terminateInstances() is successful.
						terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "terminated",
								uri      : instance.uri,
								revision : instance.revision + 2
							});
						});

						getStub = Sinon.stub(instances, "getInstance").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : instance.state,
								uri      : instance.uri,
								revision : instance.revision
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
					getStub.restore();
				});

				it("terminateInstances is called with the instance ID", function () {
					expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("updateInstance is called with the correct parameters the second time", function () {
					expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.secondCall.args[ 0 ].state).to.equal("terminated");
					expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
				});

				it("updateInstance is called with the correct parameters the third time", function () {
					expect(updateStub.thirdCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.thirdCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.thirdCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.thirdCall.args[ 0 ].state).to.equal("failed");
					expect(updateStub.thirdCall.args[ 0 ].uri).to.equal(null);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("changes the state to failed", function () {
					expect(getStub.callCount).to.equal(1);
					expect(updateStub.callCount).to.equal(3);
					//This is returned to the user before the rest of the function is executed
					expect(result.state).to.equal("terminating");
				});
			});

			describe("when the getInstance fails after the second updateInstance fails", function () {

				var result;
				var updateStub;
				var getStub;
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
						updateStub.onCall(1).rejects(new Error("Simulated error"));

						getStub = Sinon.stub(instances, "getInstance")
						.rejects(new Error("Connection to the database has failed."));

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
					getStub.restore();
				});

				it("terminateInstances is called with the instance ID", function () {
					expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("updateInstance is called with the correct parameters the second time", function () {
					expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.secondCall.args[ 0 ].state).to.equal("terminated");
					expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(stopping)", function () {
					expect(getStub.callCount).to.equal(1);
					expect(updateStub.callCount).to.equal(2);
					//This is returned to the user before the rest of the function executes
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
						getStub = Sinon.stub(instances, "getInstance")
						.rejects(new Error("Connection to the database fails."));

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

				it("terminateInstances is called with the instance ID", function () {
					expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(terminating)", function () {
					expect(response.result.state).to.equal("terminating");
					expect(response.statusCode).to.equal(200);
				});
			});

		});

		describe("setting the state of a created instance to stopped", function () {

			var instanceID;
			var revision;
			var responseCode;
			var updatedInstance;
			var stopInstancesStub;

			describe("when the instance is valid", function () {

				before(function (done) {

					return instances.createInstance()
					.then(function (instance) {
						instanceID = instance.id;
						revision   = instance.revision;
						//revision reflects the document is updated twice when stopInstances() is successful.
						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances", function () {
							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopped",
								uri      : null,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							});

						});

						updatedInstance = new Instance({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "stopped",
							uri      : null,
							revision : instance.revision + 2
						});
						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : instance.uri,
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (response) {
						responseCode = response.statusCode;
					});
				});

				after(function () {
					stopInstancesStub.restore();
				});

				it("stopInstances is called with the correct parameters", function () {
					expect(stopInstancesStub.args[ 0 ][ 0 ]).to.equal(updatedInstance.id);
				});

				it("the status is set to stopped", function () {
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
						state    : "stopping",
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
							state    : "stopping",
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
				var stopInstancesStub;

				before(function (done) {
					return instances.createInstance()
					.then(function (instance) {
						//revision reflects the document is updated twice when stopInstances() is successful.
						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances", function () {

							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopped",
								uri      : instance.uri,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							});
						});
						return instances.getInstance({ id : instance.id });
					})
					.then(function (instance) {
						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : null,
							state    : "stopping",
							revision : instance.revision
						});

						return Bluebird.join(request.inject(server), request.inject(server));
					})
					.then(function (results) {
						responses = results;
					});

				});

				after(function () {
					stopInstancesStub.restore();
				});

				it("one succeeds while the other fails", function () {
					var failed = _.some(responses, function (responses) {
						return responses.statusCode === 409;
					});

					expect (failed, "concurrency").to.be.true;
				});
			});

			describe("when there is an AWS error", function () {

				var stopInstancesStub;
				var instanceID;
				var response;

				before(function () {
					stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances").rejects(new Error("AWS Error"));
					return instances.createInstance()
					.then(function (instance) {
						instanceID = instance.id;
						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : instance.uri,
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (result) {
						response = result;
					});
				});

				after(function () {
					stopInstancesStub.restore();
				});

				it("returns the instance with state set to stopping", function () {
					expect(response.result.id).to.equal(instanceID);
					expect(response.result.state).to.equal("stopping");
					expect(response.statusCode).to.equal(200);
				});

				it("then updates the instance state set to failed", function () {
					return instances.getInstance({ id : instanceID })
					.then(function (response) {
						expect(response.id).to.equal(instanceID);
						expect(response.state).to.equal("failed");
						expect(response.uri).to.equal(null);
					});

				});
			});

			describe("when the connection to the database fails", function () {

				var result;
				var updateStub;
				var server    = new Hapi.Server();
				var instances = new InstanceAdapter();

				before(function () {
					updateStub = Sinon.stub(instances, "updateInstance")
					.rejects(new Error("Connection to database failed."));

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
							state    : "stopping",
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

			describe("when the database completely fails after stopInstances has run", function () {

				var result;
				var updateStub;
				var stopInstancesStub;
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
								state    : "stopping",
								uri      : instance.uri,
								revision : instance.revision + 1
							})
						);
						updateStub.onCall(1).rejects(new Error("Connection to the database fails."));

						//revision reflects the document is updated twice when stopInstances() is successful.
						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopped",
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
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (response) {
						result = response.result;
					});
				});

				after(function () {
					stopInstancesStub.restore();
					updateStub.restore();
				});

				it("updateInstance is called with the correct parameters the second time", function () {
					expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.secondCall.args[ 0 ].state).to.equal("stopped");
					expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
				});

				it("stopInstances is called with the instance ID", function () {
					expect(stopInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(stopping)", function () {
					expect(updateStub.callCount).to.equal(2);
					expect(result.state).to.equal("stopping");
				});
			});

			describe("when the database fails after stopInstances has run, but then recovers", function () {

				var result;
				var updateStub;
				var getStub;
				var stopInstancesStub;
				var server     = new Hapi.Server();
				var instances  = new InstanceAdapter();
				var awsAdapter = new AwsAdapter();
				before(function (done) {

					return instances.createInstance()
					.then(function (instance) {
						updateStub = Sinon.stub(instances, "updateInstance").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopping",
								uri      : instance.uri,
								revision : instance.revision + 1
							})
						);
						updateStub.onCall(1).rejects(new Error("Simulated error"));

						updateStub.onCall(2).returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "failed",
								uri      : instance.uri,
								revision : instance.revision + 2
							})
							.then(function () {
								done();
							})
						);

						getStub = Sinon.stub(instances, "getInstance").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : instance.state,
								uri      : instance.uri,
								revision : instance.revision
							})
						);

						//revision reflects the document is updated twice when terminateInstances() is successful.
						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopped",
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
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (response) {
						result = response.result;
					});
				});

				after(function () {
					stopInstancesStub.restore();
					updateStub.restore();
					getStub.restore();
				});

				it("stopInstances is called with the instance ID", function () {
					expect(stopInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("updateInstance is called with the correct parameters the second time", function () {
					expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.secondCall.args[ 0 ].state).to.equal("stopped");
					expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
				});

				it("updateInstance is called with the correct parameters the third time", function () {
					expect(updateStub.thirdCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.thirdCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.thirdCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.thirdCall.args[ 0 ].state).to.equal("failed");
					expect(updateStub.thirdCall.args[ 0 ].uri).to.equal(null);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(stopping)", function () {
					expect(getStub.callCount).to.equal(1);
					expect(updateStub.callCount).to.equal(3);
					//This is returned to the user before the rest of the function executes
					expect(result.state).to.equal("stopping");
				});
			});

			describe("when the getInstance fails after the second updateInstance fails", function () {

				var result;
				var updateStub;
				var getStub;
				var stopInstancesStub;
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
								state    : "stopping",
								uri      : instance.uri,
								revision : instance.revision + 1
							})
						);
						updateStub.onCall(1).rejects(new Error("Simulated error"));

						getStub = Sinon.stub(instances, "getInstance")
						.rejects(new Error("Connection to the database has failed."));

						//revision reflects the document is updated twice when terminateInstances() is successful.
						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances").returns(
							Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "stopped",
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
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (response) {
						result = response.result;
					});
				});

				after(function () {
					stopInstancesStub.restore();
					updateStub.restore();
					getStub.restore();
				});

				it("updateInstance is called with the correct parameters the second time", function () {
					expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
					expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
					expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
					expect(updateStub.secondCall.args[ 0 ].state).to.equal("stopped");
					expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
				});

				it("stopInstances is called with the instance ID", function () {
					expect(stopInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(stopping)", function () {
					expect(getStub.callCount).to.equal(1);
					expect(updateStub.callCount).to.equal(2);
					//This is returned to the user before the rest of the function executes
					expect(result.state).to.equal("stopping");
				});
			});

			describe("when the database and stopInstances completely fail", function () {

				var response;
				var getStub;
				var stopInstancesStub;
				var server     = new Hapi.Server();
				var instances  = new InstanceAdapter();
				var awsAdapter = new AwsAdapter();
				before(function () {

					return instances.createInstance()
					.then(function (instance) {
						getStub = Sinon.stub(instances, "getInstance")
						.rejects(new Error("Connection to the database fails."));

						stopInstancesStub = Sinon.stub(awsAdapter, "stopInstances")
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
							state    : "stopping",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (result) {
						response = result;
					});
				});

				after(function () {
					stopInstancesStub.restore();
					getStub.restore();
				});

				it("stopInstances is called with the instance ID", function () {
					expect(stopInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
				});

				it("getInstance is called with the correct parameters the second time", function () {
					expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
				});

				it("leaves the state unchanged(stopping)", function () {
					expect(response.result.state).to.equal("stopping");
					expect(response.statusCode).to.equal(200);
				});
			});
		});

		describe("starting a previously stopped instance", function () {

			var instanceID;
			var revision;
			var responseCode;
			var updatedInstance;
			var startInstancesStub;

			describe("when the instance is valid", function () {

				before(function (done) {

					return instances.createInstance()
					.then(function (instance) {
						instanceID = instance.id;
						revision   = instance.revision;
						//revision reflects the document is updated twice when startInstances() is successful.
						startInstancesStub = Sinon.stub(awsAdapter, "startInstances", function () {
							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "running",
								uri      : "https://" + VALID_IP_ADDRESS,
								revision : instance.revision + 2
							})
							.then(function (result) {
								done();
								return result;
							});

						});

						updatedInstance = new Instance({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "running",
							uri      : "https://" + VALID_IP_ADDRESS,
							revision : instance.revision + 2
						});

						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : instance.uri,
							state    : "pending",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (response) {
						responseCode = response.statusCode;
					});
				});

				after(function () {
					startInstancesStub.restore();
				});

				it("startInstances is called with the correct parameters", function () {
					expect(startInstancesStub.firstCall.args[ 0 ].id).to.equal(updatedInstance.id);
					expect(startInstancesStub.firstCall.args[ 0 ].ami).to.equal(updatedInstance.ami);
					expect(startInstancesStub.firstCall.args[ 0 ].type).to.equal(updatedInstance.type);
					expect(startInstancesStub.firstCall.args[ 0 ].state).to.equal("pending");
					expect(startInstancesStub.firstCall.args[ 0 ].uri).to.equal(null);
					expect(startInstancesStub.firstCall.args[ 0 ].revision).to.equal(revision + 1);
				});

				it("a reply with 200 OK is sent", function () {
					expect(responseCode).to.equal(200);
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
						state    : "pending",
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
							state    : "pending",
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
				var startInstancesStub;

				before(function (done) {
					return instances.createInstance()
					.then(function (instance) {
						//revision reflects the document is updated twice when startInstances() is successful.
						startInstancesStub = Sinon.stub(awsAdapter, "startInstances", function () {

							return Bluebird.resolve({
								id       : instance.id,
								ami      : instance.ami,
								type     : instance.type,
								state    : "running",
								uri      : "https://" + VALID_IP_ADDRESS,
								revision : instance.revision + 2
							})
							.then(function (result) {
								done();
								return result;
							});
						});
						return instances.getInstance({ id : instance.id });
					})
					.then(function (instance) {
						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : null,
							state    : "pending",
							revision : instance.revision
						});

						return Bluebird.join(request.inject(server), request.inject(server));
					})
					.then(function (results) {
						responses = results;
					});

				});

				after(function () {
					startInstancesStub.restore();
				});

				it("one succeeds while the other fails", function () {
					var failed = _.some(responses, function (responses) {
						return responses.statusCode === 409;
					});

					expect (failed, "concurrency").to.be.true;
				});
			});

			describe("when there is an AWS error", function () {

				var startInstancesStub;
				var instanceID;
				var response;
				var updatedInstance;

				before(function () {
					startInstancesStub = Sinon.stub(awsAdapter, "startInstances").rejects(new Error("AWS Error"));
					return instances.createInstance()
					.then(function (instance) {
						instanceID = instance.id;

						updatedInstance = new Instance({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "pending",
							uri      : null,
							revision : instance.revision + 1
						});

						var request = new Request("PUT", "/v1/instances/" + instance.id).mime("application/json")
						.payload({
							ami      : instance.ami,
							type     : instance.type,
							uri      : instance.uri,
							state    : "pending",
							revision : instance.revision
						});
						return request.inject(server);
					})
					.then(function (result) {
						response = result;
					});
				});

				after(function () {
					startInstancesStub.restore();
				});

				it("startInstances is called with the correct parameters", function () {
					expect(startInstancesStub.firstCall.args[ 0 ]).to.deep.equal(updatedInstance);
				});

				it("returns the instance with state set to pending", function () {
					expect(response.result.id).to.equal(instanceID);
					expect(response.result.state).to.equal("pending");
					expect(response.statusCode).to.equal(200);
				});

			});

			describe("when the connection to the database fails", function () {

				var result;
				var updateStub;
				var server    = new Hapi.Server();
				var instances = new InstanceAdapter();

				before(function () {
					updateStub = Sinon.stub(instances, "updateInstance")
					.rejects(new Error("Connection to database failed."));

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
							state    : "pending",
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

	});

	describe("creating awsAdapter object when the options passed are invalid", function () {
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

	describe("Deleting an instance", function () {
		var server          = new Hapi.Server();
		var instanceAdapter = new InstanceAdapter();
		var awsAdapter      = new AwsAdapter();
		var environment     = new Environment();
		before(function () {
			environment.set("AWS_DEFAULT_SECURITY_GROUP", VALID_SEC_GROUP);

			server.connection();
			return server.registerAsync({
				register : Rest,
				options  : {
					instances  : instanceAdapter,
					awsAdapter : awsAdapter
				}
			});
		});

		after(function () {
			environment.restore();
		});

		describe("with an invalid instance id", function () {
			var result;
			var getInstanceStub;

			before(function () {

				getInstanceStub = Sinon.stub(instanceAdapter, "getInstance")
				.returns(Bluebird.resolve(null));

				return new Request("DELETE", "/v1/instances/" + INVALID_QUERY).inject(server)
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

		describe("with a valid instance id", function () {
			var result;
			var terminateInstancesStub;
			var newInstance;
			var responseCode;

			before(function (done) {
				//revision reflects the document is updated twice when terminateInstances() is successful.
				terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
					return Bluebird.resolve()
					.then(function () {
						done();
					});
				});

				return instanceAdapter.createInstance()
				.then(function (instance) {
					newInstance = instance;
					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = JSON.parse(response.payload);
					responseCode = response.statusCode;
					return Bluebird.resolve();
				});
			});

			after(function () {
				terminateInstancesStub.restore();
			});

			it("returns the instance state with state set to terminating", function () {
				expect(responseCode).to.equal(200);
				expect(result.state).to.equal("terminating");
			});

			it("status is updated to terminated", function () {
				return instanceAdapter.getInstance({ id : newInstance.id })
				.then(function (response) {
					expect(terminateInstancesStub.called).to.be.true;
					expect(response.id).to.equal(newInstance.id);
					expect(response.ami).to.equal(newInstance.ami);
					expect(response.type).to.equal(newInstance.type);
					expect(response.state).to.equal("terminated");
					expect(response.uri).to.equal(newInstance.uri);
					expect(response.revision).to.be.above(newInstance.revision);
				});
			});
		});

		describe("when there is a AWS error ", function () {
			var result;
			var terminateInstancesStub;
			var newInstance;
			var responseCode;

			before(function () {
				terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
					return Bluebird.reject(new Error("Simulated Failure"));
				});

				return instanceAdapter.createInstance()
				.then(function (instance) {
					newInstance = instance;
					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = JSON.parse(response.payload);
					responseCode = response.statusCode;
					return Bluebird.resolve();
				});
			});

			after(function () {
				terminateInstancesStub.restore();
			});

			it("returns the instance state with state set to terminating", function () {
				expect(result.state).to.equal("terminating");
				expect(responseCode).to.equal(200);
			});

			it("then updates the instance state set to failed", function () {
				return instanceAdapter.getInstance({ id : newInstance.id })
				.then(function (response) {
					expect(terminateInstancesStub.called).to.be.true;
					expect(response.id).to.equal(newInstance.id);
					expect(response.ami).to.equal(newInstance.ami);
					expect(response.type).to.equal(newInstance.type);
					expect(response.state).to.equal("failed");
					expect(response.uri).to.equal(null);
					expect(response.revision).to.be.above(newInstance.revision);
				});
			});
		});

		describe("when the connection to the database fails", function () {
			var result;
			var updateStub;

			before(function () {
				updateStub = Sinon.stub(instanceAdapter, "updateInstance")
				.rejects(new Error("Database connection failed."));

				return instanceAdapter.createInstance()
				.then(function (instance) {
					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = response.result;
				});
			});

			after(function () {
				updateStub.restore();
			});

			it("returns a 500 error", function () {
				expect(result.statusCode).to.equal(500);
			});
		});

		describe("when the database fails after terminateInstances has run", function () {
			var result;
			var updateStub;
			var terminateInstancesStub;

			before(function (done) {
				return instanceAdapter.createInstance()
				.then(function (instance) {
					updateStub = Sinon.stub(instanceAdapter, "updateInstance").returns(
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

					terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
						return Bluebird.resolve()
						.then(function () {
							done();
						});
					});

					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = response.result;
				});
			});

			after(function () {
				updateStub.restore();
				terminateInstancesStub.restore();
			});

			it("terminateInstances is called with instance id", function () {
				expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
			});

			it("leaves the state unchanged (terminating)", function () {
				expect(updateStub.callCount).to.equal(2);
				expect(result.state).to.equal("terminating");
			});
		});

		describe("when the database fails after terminateInstances has run, but then recovers", function () {
			var result;
			var updateStub;
			var getStub;
			var terminateInstancesStub;

			before(function (done) {
				return instanceAdapter.createInstance()
				.then(function (instance) {
					updateStub = Sinon.stub(instanceAdapter,"updateInstance").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "terminating",
							uri      : instance.uri,
							revision : instance.revision + 1
						})
					);

					updateStub.onCall(1).rejects(new Error("Simulated Error"));
					updateStub.onCall(2).returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "failed",
							uri      : instance.uri,
							revision : instance.revision + 2
						})
						.then(function () {
							done();
						})
					);

					terminateInstancesStub = Sinon.stub(awsAdapter, "terminateInstances", function () {
						return Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "terminated",
							uri      : instance.uri,
							revision : instance.revision + 2
						});
					});

					getStub = Sinon.stub(instanceAdapter, "getInstance").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : instance.state,
							uri      : instance.uri,
							revision : instance.revision
						})
					);

					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = response.result;
				});
			});

			after(function () {
				terminateInstancesStub.restore();
				updateStub.restore();
				getStub.restore();
			});

			it("terminateInstances is called with the instance ID", function () {
				expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
			});

			it("updateInstance is called with the correct parameters the second time", function () {
				expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(updateStub.secondCall.args[ 0 ].state).to.equal("terminated");
				expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
			});

			it("updateInstance is called with the correct parameters the third time", function () {
				expect(updateStub.thirdCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(updateStub.thirdCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(updateStub.thirdCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(updateStub.thirdCall.args[ 0 ].state).to.equal("failed");
				expect(updateStub.thirdCall.args[ 0 ].uri).to.equal(null);
			});

			it("getInstance is called with the correct parameters the second time", function () {
				expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
			});

			it("changes the state to failed", function () {
				expect(getStub.callCount).to.equal(2);
				expect(updateStub.callCount).to.equal(3);
				//This is returned to the user before the rest of the function is executed
				expect(result.state).to.equal("terminating");
			});
		});

		describe("when the getInstance fails after the second updateInstance fails", function () {
			var result;
			var updateStub;
			var getStub;
			var terminateInstancesStub;

			before(function () {
				return instanceAdapter.createInstance()
				.then(function (instance) {
					updateStub = Sinon.stub(instanceAdapter, "updateInstance").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : "terminating",
							uri      : instance.uri,
							revision : instance.revision + 1
						})
					);
					updateStub.onCall(1).rejects(new Error("Simulated error"));

					getStub = Sinon.stub(instanceAdapter, "getInstance").returns(
						Bluebird.resolve({
							id       : instance.id,
							ami      : instance.ami,
							type     : instance.type,
							state    : instance.state,
							uri      : instance.uri,
							revision : instance.revision
						})
					);

					getStub.onCall(1).rejects(new Error("Connection to database has failed"));

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

					var request = new Request("DELETE", "/v1/instances/" + instance.id);
					return request.inject(server);
				})
				.then(function (response) {
					result = response.result;
				});
			});

			after(function () {
				terminateInstancesStub.restore();
				updateStub.restore();
				getStub.restore();
			});

			it("terminateInstances is called with the instance ID", function () {
				expect(terminateInstancesStub.firstCall.args[ 0 ]).to.match(ID_REGEX);
			});

			it("updateInstance is called with the correct parameters the second time", function () {
				expect(updateStub.secondCall.args[ 0 ].id).to.match(ID_REGEX);
				expect(updateStub.secondCall.args[ 0 ].ami).to.equal(VALID_AMI);
				expect(updateStub.secondCall.args[ 0 ].type).to.equal(VALID_TYPE);
				expect(updateStub.secondCall.args[ 0 ].state).to.equal("terminated");
				expect(updateStub.secondCall.args[ 0 ].uri).to.equal(null);
			});

			it("getInstance is called with the correct parameters", function () {
				expect(getStub.firstCall.args[ 0 ].id).to.match(ID_REGEX);
			});

			it("leaves the state unchanged(stopping)", function () {
				expect(getStub.callCount).to.equal(2);
				expect(updateStub.callCount).to.equal(2);
				//This is returned to the user before the rest of the function executes
				expect(result.state).to.equal("terminating");
			});
		});
	});
});
