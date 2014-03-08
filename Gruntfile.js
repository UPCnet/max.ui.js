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
      // Keep an eye on those stylesheets.
      styles: {
        // The path 'less/**/*.less' will expand to match every less file in
        // the less directory.
        files: [ 'less/*.less' , 'font/maxicons.less', 'less/classes/*.less'],
        // The tasks to run
        tasks: [ 'less' ]
      },
      livereload: {
        options: { livereload: true },
        files: ['css/*.css']
      }

    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'css/',
        src: ['max.ui.css'],
        dest: 'css/',
        ext: '.min.css'
      }
    },

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
  }


  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-fontello');
};

