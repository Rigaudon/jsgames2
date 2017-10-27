var watchify = require("watchify");
var browserify = require("browserify");
var gulp = require("gulp");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var gutil = require("gulp-util");
var assign = require("lodash").assign;
var uglify = require("gulp-uglify");
var eslint = require("gulp-eslint");
var gulpIf = require("gulp-if");
var sass = require("gulp-sass");
var childProcess = require("child_process");

var customOpts = {
  entries: ["./app/app.js"],
  debug: true
};

var opts = assign({}, watchify.args, customOpts);
var b = browserify(opts).transform("brfs").transform("babelify", { presets: ["es2015"] });

function bundle() {
  return b.bundle()
    .on("error", gutil.log.bind(gutil, "Browserify Error"))
    .pipe(source("jsgames.js"))
    .pipe(buffer())
	  .pipe(uglify())
    .on("error", function(err){
      gutil.log(gutil.colors.red("[Error]"), err.toString());
    })
    .pipe(gulp.dest("./dist"))
    .once("end", function(){
      console.log("Done");
      process.exit(0);
    });
}

var w = watchify(b);
function watchJs() {
  return w.bundle()
    .on("error", gutil.log.bind(gutil, "Browserify Error"))
    .pipe(source("jsgames.js"))
    .pipe(gulp.dest("./dist"));
}
w.on("update", watchJs);
w.on("log", gutil.log);

function isFixed(file) {
  return file.eslint && typeof file.eslint.output === "string";
}

function lint() {
  return gulp.src(["**/*.js", "!node_modules/**", "!static/**", "!dist/**"])
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest("./")))
    .pipe(eslint.failAfterError());
}

function css() {
  return gulp.src("./app/sass/main.scss")
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(gulp.dest("./dist"));
}

function watchScss(){
  return gulp.watch("./app/sass/**/*.scss", ["sass"]);
}

function webServer(){
  var child = childProcess.exec("node entry.js");
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

gulp.task("bundle", bundle);
gulp.task("watchJs", watchJs);
gulp.task("lint", lint);
gulp.task("sass", css);
gulp.task("watchSass", watchScss);
gulp.task("build", ["bundle", "sass"]);
gulp.task("webserver", webServer);

gulp.task("default", ["watchJs", "watchSass", "webserver"]);
