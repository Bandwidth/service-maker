module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  , jshint: {
      files: ['Gruntfile.js', '*.js', 'test/*.js', 'lib/*.js']
    , options: {
        laxcomma: true
      }
    }
  , jscs: {
      files: [ '*.js', 'lib/*.js', 'test/*.js' ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('default', ['jshint', 'jscs']);
};
