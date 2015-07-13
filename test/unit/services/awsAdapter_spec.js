"use strict";

var AwsAdapter = require("../../../lib/services/awsAdapter");
var expect     = require("chai").expect;
var Bluebird   = require("bluebird");
var Sinon      = require("sinon");
require("sinon-as-promised")(Bluebird);

describe("The AwsAdapter class ", function () {
	var DEFAULT_IMAGE_ID      = "ami-d05e75b8";
	var DEFAULT_INSTANCE_TYPE = "t2.micro";

	describe("creating a new instance", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : DEFAULT_IMAGE_ID,
			type : DEFAULT_INSTANCE_TYPE
		});

		before(function () {
			//awsAdapter.runInstances();
			awsAdapterStub = Sinon.stub(awsAdapter, "runInstances").onFirstCall()
			.returns(Bluebird.resolve("test"));

			awsAdapter.runInstances()
			.then(function (response) {
				result = response;
			});

		});

		after(function () {
			//awsAdapterStub.restore();
		});

		it("returns a new instance with default values", function () {
			console.log(awsAdapterStub);
			expect(result, "response").to.equal("test");
		});

	});

});
