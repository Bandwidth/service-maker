module.exports = [
  {
    method: 'POST'
  , path: '/v1/instances/{instanceId}/tags'
  , handler: function(request, reply) {
      var payload = request.payload;

      // Use the schema to validate a payload.
      var validated = Joi.validate(request.payload, Schemas.TAG_SCHEMA);
      if (validated.error) {
        reply(Boom.badRequest(validated.error.message));
      } else {
        reply().code(200);
      }
    }
  }
];
