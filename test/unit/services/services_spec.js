"use strict";

var Services = require("../../../lib/services/services-db");
var _ = require("lodash");
var expect   = require("chai").expect;
var Genesis = require("genesis");

describe("the Services ", function () {
	it("is frozen", function () {
		expect(Object.isFrozen(Services), "frozen").to.be.true;
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
			var services = new Services();

			var mapper = new Genesis.MemoryMapper();
			var services2 = new Services(mapper);
			if (!fails) {
				it("returns a new instance", function () {
					var result;
					services.create(optionsToPass)
					.then(function (model) {
						result = model;

						expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
						expect(result.type).to.equal(expectedOptions.type);
						expect(result.ami).to.equal(expectedOptions.ami);
						expect(result.state).to.equal("pending");
						expect(result.uri).to.equal(null);
					});
					services2.create(optionsToPass)
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
					expect(function () { return new services.create(optionsToPass); }, "throws").to.throw;
				});
			}
		});
	}

	describeCreate ("with default parameters", {}, false);

	describeCreate ("with extra parameters", { ami : "ami-d05e75b8", type : "pending", extra : "extra" }, true);

	describeCreate ("with ami and type", { ami : "ami-test", type : "pending" }, true);

	describeCreate ("with an invalid parameter", { extra : "ami-test" }, true);

	describeCreate ("with ami and an invalid parameter", { extra : "ami-test", ami : "ami-test" }, true);

	describeCreate ("with type and an invalid parameter", { extra : "ami-test", type : "pending" }, true);
/*
	describe("is creating a new instance with no parameters", function () {

		var result;
		before(function () {
			var services = new Services();
			return services.create()
			.then(function (model) {
				result = model;
			});
		});

		it("returns instance with default parameters", function () {
			expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
			expect(result.type).to.equal("t2.micro");
			expect(result.ami).to.equal("ami-d05e75b8");
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
		});

	});

	describe("is creating a new instance with ami and type", function () {

		var result;
		var VALID_TYPE = "t2.mini";
		var VALID_AMI = "ami-testami";
		before(function () {
			var services = new Services();
			return services.create(VALID_AMI, VALID_TYPE)
			.then(function (model) {
				result = model;
			});
		});

		it("returns instance with the ami and type specified", function () {
			expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
			expect(result.type).to.equal(VALID_TYPE);
			expect(result.ami).to.equal(VALID_AMI);
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
		});

	});

	describe("is creating a new instance with only ami specified", function () {

		var result;
		var VALID_AMI = "ami-testami";
		before(function () {
			var services = new Services();
			return services.create(VALID_AMI)
			.then(function (model) {
				result = model;
			});
		});

		it("returns instance with the specified ami and the other parameters are default", function () {
			expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
			expect(result.type).to.equal("t2.micro");
			expect(result.ami).to.equal(VALID_AMI);
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
		});

	});

	describe("is creating a new instance with an extra parameter specified", function () {

		var result;
		var VALID_TYPE = "t2.micro";
		var VALID_AMI = "ami-d05e75b8";
		before(function () {
			var services = new Services();
			return services.create(VALID_AMI, VALID_TYPE, "extra parameter")
			.then(function (model) {
				result = model;
			});
		});

		it("returns instance and ignores the extra parameter", function () {
			expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
			expect(result.type).to.equal(VALID_TYPE);
			expect(result.ami).to.equal("ami-d05e75b8");
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
		});

		describe("is creating a new instance with an extra parameter specified", function () {

		var result;
		var VALID_TYPE = "t2.micro";
		var INVALID_AMI = ["ami-d05e75b8"];
		before(function () {
			var services = new Services();
			return services.create(INVALID_AMI, VALID_TYPE)
			.then(function (model) {
				result = model;
			});
		});

		it("returns instance and ignores the extra parameter", function () {
			expect(result.id).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
			expect(result.type).to.equal(VALID_TYPE);
			expect(result.ami).to.equal("ami-d05e75b8");
			expect(result.state).to.equal("pending");
			expect(result.uri).to.equal(null);
		});

	});*/

});
