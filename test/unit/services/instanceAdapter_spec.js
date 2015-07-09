"use strict";

var InstanceAdapter = require("../../../lib/services/instanceAdapter");
var Instance        = require("../../../lib/models/Instance");
var expect          = require("chai").expect;
var Genesis         = require("genesis");
var Bluebird        = require("bluebird");
var Sinon           = require("sinon");
require("sinon-as-promised")(Bluebird);

describe("The InstanceAdapter class ", function () {
	it("is immutable", function () {
		expect(Object.isFrozen(InstanceAdapter), "frozen").to.be.true;
	});

	describe("creating a new instance", function () {
		it("returns a new instance with default values", function () {
			var DEFAULT_TYPE = "t2.micro";
			var DEFAULT_AMI  = "ami-d05e75b8";
			var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
			var instances    = new InstanceAdapter();

			instances.createInstance()
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
			var DEFAULT_TYPE = "t2.micro";
			var DEFAULT_AMI  = "ami-d05e75b8";
			var ID_REGEX     = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
			var instances    = new InstanceAdapter();

			instances.createInstance(DEFAULT_AMI, DEFAULT_TYPE)
			.then(function (result) {
				expect(result).to.be.an.instanceOf(Instance);
				expect(result.id).to.match(ID_REGEX);
				expect(result.type).to.equal(DEFAULT_TYPE);
				expect(result.ami).to.equal(DEFAULT_AMI);
			});
		});

	});

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

});
