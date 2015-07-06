"use strict";

var Instance = require("../../../lib/services/services-db");
var _ = require("lodash");
var expect   = require("chai").expect;
var Genesis = require("genesis");
var Sinon = require("sinon");
var Bluebird = require("bluebird");

describe("the Services ", function () {
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

	describeCreate ("with default parameters", { }, false);

//	describeCreate ("with extra parameters", { ami : "ami-d05e75b8", type : "pending", extra : "extra" }, true);

	describeCreate ("with ami and type", { ami : "ami-test", type : "pending" }, true);

//	describeCreate ("with an invalid parameter", { extra : "ami-test" }, true);

//	describeCreate ("with ami and an invalid parameter", { extra : "ami-test", ami : "ami-test" }, true);

//	describeCreate ("with type and an invalid parameter", { extra : "ami-test", type : "pending" }, true);

	describeCreate ("with type and an invalid ami", { ami : [ "ami-test" ], type : "pending" }, true);

	describeCreate ("with ami and invalid type", { ami : "ami-test", type : [ "something" ] }, true);

	describe("when the mapper fails to create a new model", function () {
		var result;
		var mapperStub;
		var parameter = { ami : "ami-d05e75b8", type : "pending" };

		before(function () {
			var mapper = new Genesis.MemoryMapper();

			mapperStub = Sinon.stub(mapper, "create")
				.returns(Bluebird.resolve(new Error("Simulated Failure")));

			var instances = new Instance(mapper);
			return instances.createInstance(parameter.ami, parameter.type)
			.then(function (err) {
				result = err;
			});
		});

		after(function () {
			mapperStub.restore();
		});

		it("throws an error", function () {
			console.log(result);
			expect(result, "error").to.be.an.instanceOf(Error);
			expect(result.message, "error message").to.equal("Simulated Failure");
		});
	});

});
