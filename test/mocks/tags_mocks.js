var Tags = exports;

Tags.applyTags = function(tags, instanceId, callback) {
  callback(instanceId);
};

Tags.removeTags = function(tags, instanceId, done) {
  done(instanceId);
};

Tags.foo = function() {
  return 'this is mocked';
};
