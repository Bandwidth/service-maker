"use strict";

var Instance = require("../../../lib/services/services-db");
var _        = require("lodash");
var expect   = require("chai").expect;
var Genesis  = require("genesis");
var Bluebird = require("bluebird");
var Sinon    = require("sinon");
require("sinon-as-promised")(Bluebird);

describe("the Adapter class ", function () {
	it("is frozen", function () {
		expect(Object.isFrozen(Instance), "frozen").to.be.true;
	});

	function describeCreate (description, options, fails) {
		var optionsToPass = JSON.parse(JSON.stringify(options));
		var expectedOptions = _.defaults(
			options,
			{
				id    : undefined,
				type  : "t2.micro",
				ami   : "ami-d05e75b8",
				state : "pending",
				uri   : null
			}
		);

		describe("is creating a new instance " + description, function () {
			var instances = new Instance();

			if (!fails) {
				it("returns a new instance", function () {
					var result;
					instances.createInstance(optionsToPass.ami, optionsToPass.type)
					.then(function (model) {
						result = model;
						expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
						expect(result.type).to.equal(expectedOptions.type);
						expect(result.ami).to.equal(expectedOptions.ami);
						expect(result.state).to.equal("pending");
						expect(result.uri).to.equal(null);
					});
				});
			}
			else {
				it("fails", function () {
					expect(function () { return new instances.createInstance(optionsToPass.ami, optionsToPass.type);
					}, "throws").to.throw;
				});
			}
		});
	}

	describe("with default parameters", function () {
		var DEFAULT_TYPE = "t2.micro";
		var DEFAULT_AMI  = "ami-d05e75b8";
		var instances    = new Instance();
		var result;
		it("returns a new instance with default values", function () {
			instances.createInstance()
			.then(function (model) {
				result = model;
				expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
				expect(result.type).to.equal(DEFAULT_TYPE);
				expect(result.ami).to.equal(DEFAULT_AMI);
				expect(result.state).to.equal("pending");
				expect(result.uri).to.equal(null);

			});
		});

	});

	describe("with an extra parameter", function () {
		var DEFAULT_TYPE = "t2.micro";
		var DEFAULT_AMI  = "ami-d05e75b8";
		var instances    = new Instance();
		it("fails", function () {
			expect(function () {
				return new instances.createInstance(DEFAULT_AMI, DEFAULT_TYPE, "extra parameter");
			}).to.throw(Error).to.match(/Extra parameter present/);
		});

	});

	describeCreate ("with ami and type", { ami : "ami-test", type : "pending" }, true);

	describeCreate ("with type and an invalid ami", { ami : [ "ami-test" ], type : "pending" }, true);

	describeCreate ("with ami and invalid type", { ami : "ami-test", type : [ "something" ] }, true);

	describe("when the mapper fails to create a new model", function () {
		var result;
		var mapperStub;
		var parameter = { ami : "ami-d05e75b8", type : "pending" };

		before(function () {
			var mapper = new Genesis.MemoryMapper();
			var instances = new Instance(mapper);

			mapperStub = Sinon.stub(mapper, "create")
				.rejects(new Error("Simulated Failure"));

			return instances.createInstance(parameter.ami, parameter.type)
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
