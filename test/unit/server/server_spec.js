"use strict";

var Rest    = require("../../../lib/plugins/rest");
var Sinon   = require("sinon");
var expect  = require("chai").expect;
var Genesis = require("genesis");

describe("The server", function () {
	var restStub;
	var server;
	var mongoStub;
	before(function () {
		mongoStub = Sinon.stub(Genesis, "MongoMapper").returns(new Genesis.MemoryMapper());
		restStub  = Sinon.stub(Rest, "register").callsArg(2);
		server    = require("../../../lib/server");
	});

	after(function () {
		restStub.restore();
		mongoStub.restore();
		return server.stopAsync();
	});

	it("registers the Rest plugin", function () {
		expect(restStub.calledOnce, "registered").to.be.true;
	});
});