"use strict";

var AwsAdapter = require("../../../lib/services/awsAdapter");
var expect     = require("chai").expect;
var Bluebird   = require("bluebird");
var Sinon      = require("sinon");
require("sinon-as-promised")(Bluebird);

describe("The AwsAdapter class ", function () {
	var DEFAULT_IMAGE_ID      = "ami-d05e75b8";
	var DEFAULT_INSTANCE_TYPE = "t2.micro";

	var INVALID_IMAGE_ID      = "ami-invalid";
	var INVALID_INSTANCE_TYPE = "t2.invalid";

	describe("creating a new instance with valid ami, type", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : DEFAULT_IMAGE_ID,
			type : DEFAULT_INSTANCE_TYPE
		});

		before(function () {
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

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});

	});

	describe("creating a new instance with a invalid ami", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : INVALID_IMAGE_ID,
			type : DEFAULT_INSTANCE_TYPE
		});

		before(function () {
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

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});

	});

	describe("creating a new instance with an invalid type", function () {
		var awsAdapterStub;
		var result;
		var awsAdapter = new AwsAdapter({
			id   : DEFAULT_IMAGE_ID,
			type : INVALID_INSTANCE_TYPE
		});

		before(function () {
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

		it("returns a new instance with the ami and type provided", function () {
			expect(result, "response").to.equal("test");
		});

	});

});
