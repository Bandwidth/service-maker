module.exports = function(grunt) {

  var _ = grunt.util._;

  var sourceFiles = [ '*.js', 'config/**/*.js', 'lib/**/*.js', 'travis/**/*.js' ];
  var testFiles = [ 'test/**/*.js' ];
  var allFiles = sourceFiles.concat(testFiles);

  grunt.initConfig({
    jscs: {
      src: allFiles
    , options: {
        config: '.jscsrc'
      }
    }

  , jshint: {
      src: sourceFiles
    , options: {
        laxcomma: true
      , loopfunc: true
      , esnext: true
      , multistr: true
      }
    }

  , mochaIstanbul: {
      coverage: {
        src: 'test'
      , options: {
          recursive: true
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  // Rename tasks
  grunt.task.renameTask('mocha_istanbul', 'mochaIstanbul');

  // Register tasks
  grunt.registerTask('test', [ 'mochaIstanbul:coverage' ]);
  grunt.registerTask('lint', 'Check for common code problems.', [ 'jshint' ]);
  grunt.registerTask('style', 'Check for style conformity.', [ 'jscs' ]);
  grunt.registerTask('default', [ 'lint', 'style', 'test' ]);

};
