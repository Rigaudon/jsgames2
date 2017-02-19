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
var b = watchify(browserify(opts).transform("brfs")); 

gulp.task('bundle', bundle);
b.on('update', bundle); 
b.on('log', gutil.log); 

function bundle() {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('static/js/jsgames.js'))
    .pipe(buffer())
	.pipe(uglify())
    .pipe(gulp.dest('./'));
}