var Joi = require('joi');

var Schemas = exports;

Schemas.TAG_SCHEMA = Joi.object().keys({
  Tags: Joi.array().includes({
    Key: Joi.string().required()
  , Value: Joi.string().required()
  })
});
