"use strict";

var Genesis = require("genesis");
var Joi     = require("joi");

module.exports = Genesis.create("instance", {
	index  : "id",
	schema : Joi.object().keys({
		id    : Joi.string().required(),                                             // a unique ID
		type  : Joi.string().optional().default("t2.micro"),                         // the EC2 instance type
		ami   : Joi.string().optional().default("ami-d05e75b8"),                     // the AMI ID for the instance.
		state : Joi.string().regex(/pending|ready/).optional().default("pending"),   // the state of the instance
		uri   : Joi.string().uri().optional().allow(null).default(null)              // the uri location of the server
	})
});
