module.exports = function(grunt) {
  // Configure
  grunt.initConfig({
    // The less task.
    less: {
      // This is the target's name "production".
      // You can run this task like this:
      //   grunt less:production
      production: {
        options: {
          // Set the option to compress the resulting css.
          yuicompress: false,
          sourceMap: true,
          sourceMapFilename: 'css/max.ui.css.map',
          sourceMapRootpath: "../",
          sourceMapURL: 'http://localhost:8081/maxui-dev/css/max.ui.css.map'
        },
        files: {
          // Create a file called "public/css/site.css" from "less/site.less".
          // Note: If the directory public/css does not exist, it will be
          // created by the task.
          "css/max.ui.css": "less/maxui.less"
        }
      }
    },

    watch: {
      // This task is for detecting changes on *.less files, and execute less compiler
      styles: {
        // The path 'less/**/*.less' will expand to match every less file in
        // the less directory.
        files: [ 'less/*.less' , 'font/maxicons.less', 'less/classes/*.less'],
        // The tasks to run
        tasks: [ 'less' ]
      },
      // This task is for detecting changes in compiled .css files, and signal livereload on the browser
      livereload: {
        options: { livereload: true },
        files: ['css/*.css']
      }

    },

    // Minify less-compiled css
    cssmin: {
      minify: {
        expand: true,
        cwd: 'css/',
        src: ['max.ui.css'],
        dest: 'css/',
        ext: '.min.css'
      }
    },

    // Download Fontello fonts based on local configuration
    // A session ID is stored in .fontello-session to be able to
    // download fonts afer a session save on the web
    fontello: {
      dist: {
        options: {
            config  : 'font/config.json',
            zip     : 'tmp',
            fonts   : 'font',
            styles  : 'font',
            force   : true,
            sass    : true
        }
      }
    },

    concat: {
      options: {
          separator: '\n\n;\n\n',
          stripBanners: true,
      },
      dist: {
          src: [
              'libs/hogan-2.0.0.js',
              'libs/jquery.easydate-0.2.4.js',
              'libs/jquery.iecors.js',
              'libs/jquery.mousewheel-3.1.9.js',
              'libs/sockjs-0.3.min.js',
              'libs/json2.js',
              'libs/sockjs-0.3.4.js',
              'libs/stomp-2.3.1.js',
              'max.templates.js',
              'max.literals.js',
              'max.utils.js',
              'max.client.js',
              'max.ui.js',
              'max.loader.js'
          ],
          dest: 'dist/built.js',
      },
    },

  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-fontello');
  grunt.loadNpmTasks('grunt-contrib-concat');
};

