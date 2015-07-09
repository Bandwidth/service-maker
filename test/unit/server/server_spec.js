"use strict";

var Rest        = require("../../../lib/plugins/rest");
var Sinon       = require("sinon");
var expect      = require("chai").expect;

describe("The server", function () {
	var restStub;
	var server;
	before(function () {
		restStub = Sinon.stub(Rest, "register").callsArg(2);
		server   = require("../../../lib/server");
	});

	after(function () {
		restStub.restore();
		return server.stopAsync();
	});

	it("registers the Rest plugin", function () {
		expect(restStub.calledOnce, "registered").to.be.true;
	});
});
