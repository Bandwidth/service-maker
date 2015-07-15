"use strict";

var InstanceAdapter = require("../../../lib/services/instanceAdapter");
var Instance        = require("../../../lib/models/Instance");
var expect          = require("chai").expect;
var Genesis         = require("genesis");
var Bluebird        = require("bluebird");
var Sinon           = require("sinon");
require("sinon-as-promised")(Bluebird);

describe("The InstanceAdapter class ", function () {

	var DEFAULT_TYPE = "t2.micro";
	var DEFAULT_AMI  = "ami-d05e75b8";
	var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
	var VALID_INSTANCE_ID;

	it("is immutable", function () {
		expect(Object.isFrozen(InstanceAdapter), "frozen").to.be.true;
	});

	describe("creating a new instance", function () {
		it("returns a new instance with default values", function () {
			var instances = new InstanceAdapter();

			return instances.createInstance()
			.then(function (result) {
				expect(result).to.be.an.instanceOf(Instance);
				expect(result.id).to.match(ID_REGEX);
				expect(result.type).to.equal(DEFAULT_TYPE);
				expect(result.ami).to.equal(DEFAULT_AMI);
			});
		});

	});

	describe("creating a new instance, passing ami and type", function () {
		it("returns a new instance with default values", function () {
			var instances = new InstanceAdapter();

			return instances.createInstance(DEFAULT_AMI, DEFAULT_TYPE)
			.then(function (result) {
				expect(result).to.be.an.instanceOf(Instance);
				expect(result.id).to.match(ID_REGEX);
				expect(result.type).to.equal(DEFAULT_TYPE);
				expect(result.ami).to.equal(DEFAULT_AMI);
			});
		});

	});

	describe("Getting an instance", function () {
		describe("with a valid instanceId", function () {
<<<<<<< HEAD
			var instances = new InstanceAdapter();

			before(function () {
				return instances.createInstance()
				.then(function (response) {
=======
			var VALID_INSTANCE_ID;
			var DEFAULT_TYPE = "t2.micro";
			var DEFAULT_AMI  = "ami-d05e75b8";
			var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
			var instances    = new InstanceAdapter();

			before(function () {
				instances.createInstance()
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Instance);
					expect(response.id).to.match(ID_REGEX);
					expect(response.type).to.equal(DEFAULT_TYPE);
					expect(response.ami).to.equal(DEFAULT_AMI);
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
					VALID_INSTANCE_ID = response.id;
				});
			});

			it("gets a valid instance", function () {

<<<<<<< HEAD
				return instances.getInstance({ id : VALID_INSTANCE_ID })
=======
				instances.getInstance({ id : VALID_INSTANCE_ID })
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
				.then(function (result) {
					expect(result).to.be.an.instanceOf(Instance);
					expect(result.id).to.match(ID_REGEX);
					expect(result.type).to.equal(DEFAULT_TYPE);
					expect(result.ami).to.equal(DEFAULT_AMI);
				});
			});
		});

<<<<<<< HEAD
		describe("with a non-existent instanceId", function () {
=======
		describe("with an invalid instanceId", function () {
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
			var instances = new InstanceAdapter();

			it("fails", function () {

<<<<<<< HEAD
				return instances.getInstance({ id : "foo-bar-baz" })
=======
				instances.getInstance({ id : "foo-bar-baz" })
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
				.then(function (result) {
					expect(result).to.be.null;
				});
			});
		});
	});

	describe("Querying for instances", function () {
<<<<<<< HEAD
		var instances = new InstanceAdapter();

		before(function () {

			return instances.createInstance()
			.then(function () {
				return instances.createInstance(DEFAULT_AMI, "t2.medium");
=======
		var VALID_INSTANCE_ID;
		var DEFAULT_TYPE = "t2.micro";
		var DEFAULT_AMI  = "ami-d05e75b8";
		var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
		var instances    = new InstanceAdapter();

		before(function () {

			instances.createInstance()
			.then(function (response) {
				expect(response).to.be.an.instanceOf(Instance);
				expect(response.id).to.match(ID_REGEX);
				expect(response.type).to.equal(DEFAULT_TYPE);
				expect(response.ami).to.equal(DEFAULT_AMI);
				VALID_INSTANCE_ID = response.id;
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
			});
		});

		describe("with valid parameters", function () {
			it("receives an array of instances", function () {
<<<<<<< HEAD
				return instances.getAllInstances({ ami : DEFAULT_AMI, type : DEFAULT_TYPE })
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Array);
					expect(response[ 0 ].id).to.match(ID_REGEX);
					expect(response[ 0 ].ami).to.equal(DEFAULT_AMI);
					expect(response[ 0 ].type).to.equal(DEFAULT_TYPE);
					expect(response.length).to.equal(1);
=======
				instances.getAllInstances({ ami : DEFAULT_AMI, type : DEFAULT_TYPE })
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Array);
					expect(response.length).to.be.at.least(1);
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
				});
			});
		});

		describe("with no parameters", function () {
			it("receives an array of all instances", function () {
<<<<<<< HEAD
				return instances.getAllInstances()
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Array);
					expect(response[ 0 ].id).to.match(ID_REGEX);
					expect(response[ 0 ].ami).to.equal(DEFAULT_AMI);
					expect(response[ 0 ].type).to.equal(DEFAULT_TYPE);
					expect(response[ 1 ].id).to.match(ID_REGEX);
					expect(response[ 1 ].ami).to.equal(DEFAULT_AMI);
					expect(response[ 1 ].type).to.equal("t2.medium");
					expect(response.length).to.equal(2);
=======
				instances.getAllInstances()
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Array);
					expect(response.length).to.be.at.least(1);
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
				});
			});
		});

<<<<<<< HEAD
		describe("with a query that doesn't match any instance", function () {
			it("returns an empty array", function () {
				return instances.getAllInstances({ ami : "foo-bar-baz" })
=======
		describe("with invalid parameters", function () {
			it("returns an empty array", function () {
				instances.getAllInstances({ ami : "foo-bar-baz" })
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
				.then(function (response) {
					expect(response).to.be.an.instanceOf(Array);
					expect(response.length).to.be.equal(0);
				});
			});
<<<<<<< HEAD
		});
	});
	describe("The mapper faces an internal error", function () {
		describe("when the mapper fails to create a new model", function () {
			var result;
			var mapperStub;

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "create")
					.rejects(new Error("Simulated Failure"));

				return instances.createInstance(DEFAULT_AMI, DEFAULT_TYPE)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
		});

		describe("when the mapper fails to find an instance", function () {
			var result;
			var mapperStub;

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "findOne")
					.rejects(new Error("Simulated Failure"));

				return instances.getInstance({ id : "foo-bar-baz" })
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
		});

		describe("when the mapper fails to find an instance for the queried parameters", function () {
			var result;
			var mapperStub;

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "find")
					.rejects(new Error("Simulated Failure"));

				return instances.getAllInstances({ id : "foo-bar-baz" })
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
=======
>>>>>>> Big fixes. Changed test cases for rest, added AWSAdapter, test cases for AWSAdapter
		});
	});
	describe("The mapper faces an internal error", function () {
		describe("when the mapper fails to create a new model", function () {
			var result;
			var mapperStub;
			var DEFAULT_TYPE = "t2.micro";
			var DEFAULT_AMI  = "ami-d05e75b8";

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "create")
					.rejects(new Error("Simulated Failure"));

				return instances.createInstance(DEFAULT_AMI, DEFAULT_TYPE)
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
		});

		describe("when the mapper fails to find an instance", function () {
			var result;
			var mapperStub;

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "findOne")
					.rejects(new Error("Simulated Failure"));

				return instances.getInstance({ id : "foo-bar-baz" })
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
		});

		describe("when the mapper fails to find an instance for the queried parameters", function () {
			var result;
			var mapperStub;

			before(function () {
				var mapper = new Genesis.MemoryMapper();
				var instances = new InstanceAdapter(mapper);

				mapperStub = Sinon.stub(mapper, "find")
					.rejects(new Error("Simulated Failure"));

				return instances.getAllInstances({ id : "foo-bar-baz" })
				.catch(function (err) {
					result = err;
				});
			});

			after(function () {
				mapperStub.restore();
			});

			it("throws an error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "error message").to.equal("Simulated Failure");
			});
		});
	});
});
