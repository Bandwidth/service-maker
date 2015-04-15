var Helper = {};

Helper.disableLogging = function() {
  console.log = function() {}
}

Helper.enableLogging = function() {
  delete console.log; // Weird syntax, right?
}

module.exports = Helper;
