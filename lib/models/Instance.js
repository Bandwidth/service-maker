"use strict";

var Genesis = require("genesis");
var Joi     = require("joi");

module.exports = Genesis.create("instance", {
	index  : "id",
	schema : Joi.object().keys({
		id    : Joi.string().required(),
		type  : Joi.string().optional().default("t2.micro"),
		ami   : Joi.string().optional().default("ami-d05e75b8"),
		state : Joi.string().regex(/\bfailed\b|\bready\b|\bpending\b/).optional().default("pending"),
		uri   : Joi.string().uri().optional().allow(null).default(null)
	})
});
