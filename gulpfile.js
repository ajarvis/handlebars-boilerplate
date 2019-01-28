// Load plugins
var babel         = require('gulp-babel');
var browsersync   = require('browser-sync');
var concat        = require('gulp-concat');
var cleanCSS      = require('gulp-clean-css');
var del           = require('del');
var gulp          = require('gulp');
var handlebars    = require('gulp-compile-handlebars');
var htmlmin       = require('gulp-htmlmin');
var imagemin      = require('gulp-imagemin');
var notify        = require('gulp-notify');
var plumber       = require('gulp-plumber');
var prefix        = require('gulp-autoprefixer');
var purgecss      = require('gulp-purgecss');
var rename        = require('gulp-rename');
var sass          = require('gulp-sass');
var sassGlob      = require('gulp-sass-glob');
var sourcemaps    = require('gulp-sourcemaps');
var tildeImporter = require('node-sass-tilde-importer');
var uglify        = require('gulp-uglify');


// Define Paths
const paths = {
  src: {
    root: 'src',
    sass: 'src/scss/main.scss',
    templates: 'src/**/*.hbs',
    partials: 'src/partials',
    javascript: 'src/js/**/*.js',
    libs: 'src/js/libs/*.js',
    images: 'src/images/**/*.{jpg,jpeg,svg,png,gif}',
    files: 'src/*.{html,txt}'
  },
  dist: {
    root: 'dist',
    css: 'dist/css',
    images: 'dist/images',
    javascript: 'dist/js',
    libs: 'dist/libs'
  }
};


// Error Messaging
var onError = function(err) {
  notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Basso"
  })(err);
  this.emit('end');
};


// Clean Dist
function cleanDist() {
  return del(paths.dist.root);
}


// Start Server
function runBrowsersync(done) {
  browsersync.init({
    server: {
      baseDir: paths.dist.root
    },
    port: 3000,
    notify: true
  });
  done();
}


// Import Bootstrap
// TODO: JavaScript Copy Task
function bootstrap(done) {
  gulp
    .src(['node_modules/bootstrap/scss/bootstrap.scss'])
    .pipe(sass())
    .pipe(gulp.dest(paths.dist.css))

  gulp
    .src(['node_modules/bootstrap/dist/js/bootstrap.js'])
    .pipe(gulp.dest("src/js"))
  done();
}


// Compile Handlebars into HTML
function html() {
  var opts = {
    ignorePartials: true,
    batch: [paths.src.partials],
  };

 return gulp
    .src([paths.src.root + '/*.hbs'])
    .pipe(handlebars(null, opts))
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      extname: '.html',
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.dist.root))
    .pipe(browsersync.stream());
}


// Glob SCSS Imports, Generate Sourcemaps, and Compile to CSS
var sassOptions = {
  outputStyle: 'expanded',
  importer: tildeImporter
};
var prefixerOptions = {
  browsers: ['last 2 versions']
};

function styles(done) {
  gulp
    .src([paths.src.sass])
    .pipe(sassGlob())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(purgecss({
      content: [paths.src.root + "/*.hbs", paths.src.root + "/**/*.hbs"]
    }))
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions))
    .pipe(prefix(prefixerOptions))
    .pipe(cleanCSS({ compatibility: '*' }))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browsersync.stream())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browsersync.stream());
  done();
}


// Bundle and Minify JS
function scripts(done) {

  gulp
    .src(paths.src.javascript)
    .pipe(babel({
      presets: ['@babel/env'],
    }))
    .pipe(concat('bundle.js'))
    .pipe(plumber({errorHandler: onError}))
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(browsersync.stream());

  gulp
    .src([paths.src.libs])
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.libs))
    .pipe(browsersync.stream());

  done();
}


// Copy Images to Dist
function images(done) {
  gulp
    .src([paths.src.images])
    .pipe(imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5
    }))
    .pipe(gulp.dest(paths.dist.images))
    .pipe(browsersync.stream());
  done();
}


// Copy Files to Dist
function files(done) {
  gulp
    .src([paths.src.files])
    .pipe(gulp.dest(paths.dist.root));
  done();
}


// Watch Folders
function watchFiles() {
  gulp.watch(paths.src.sass, styles);
  gulp.watch(paths.src.javascript, scripts);
  gulp.watch(paths.src.templates, gulp.parallel(html, styles));
}


// Build Tasks
gulp.task('default', gulp.series(cleanDist, html, scripts, images, files, bootstrap, styles, gulp.parallel(watchFiles, runBrowsersync), function (done) {
  done();
}));