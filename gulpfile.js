"use strict"

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash').assign;
var uglify = require('gulp-uglify');

var customOpts = {
  entries: ['./app/app.js'],
  debug: true
};

var opts = assign({}, watchify.args, customOpts);
var b = browserify(opts).transform("brfs").transform("babelify", {presets: ["es2015"]});

gulp.task('bundle', bundle);
gulp.task('watch', watch);

function bundle() {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('jsgames.js'))
    .pipe(buffer())
	  .pipe(uglify())
    .on('error', function(err){
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('./dist'))
    .once('end', function(){
      console.log("Done");
      process.exit(0);
    });
}

var w = watchify(b);
w.on('update', watch);
w.on('log', gutil.log);
function watch() {
  return w.bundle()
  .on('error', gutil.log.bind(gutil, 'Browserify Error'))
  .pipe(source('jsgames.js'))
  .pipe(gulp.dest('./dist'));
}
