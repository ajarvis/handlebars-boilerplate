// Load plugins
var babel           = require('gulp-babel');
var browsersync     = require('browser-sync');
var concat          = require('gulp-concat');
var cleanCSS        = require('gulp-clean-css');
var del             = require('del');
var gulp            = require('gulp');
var handlebars      = require('gulp-compile-handlebars');
var handlebarsData  = require("./src/hbs/data/data.json");
var htmlmin         = require('gulp-htmlmin');
var imagemin        = require('gulp-imagemin');
var notify          = require('gulp-notify');
var plumber         = require('gulp-plumber');
var prefix          = require('gulp-autoprefixer');
var purgecss        = require('gulp-purgecss');
var rename          = require('gulp-rename');
var sass            = require('gulp-sass');
var sassGlob        = require('gulp-sass-glob');
var sourcemaps      = require('gulp-sourcemaps');
var stylelint       = require('gulp-stylelint');
var tildeImporter   = require('node-sass-tilde-importer');
var uglify          = require('gulp-uglify');


// Define Paths
const paths = {
  src: {
    root: 'src',
    hbs: 'src/hbs/**/*.hbs',
    pages: 'src/hbs/*.hbs',
    partials: 'src/hbs/partials/',
    sass: 'src/scss/',

    javascript: 'src/js/**/*.js',
    libs: 'src/libs/**/*',
    images: 'src/images/**/*.{jpg,jpeg,svg,png,gif}',
    files: 'src/*.{html,txt}'
  },
  dist: {
    root: 'docs',
    css: 'docs/css',
    images: 'docs/images',
    javascript: 'docs/js',
    libs: 'docs/libs'
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


// Import Libraries
function importLibraries(done) {
  gulp
    .src([
      'node_modules/bulma/sass/**/*'
    ])
    .pipe(gulp.dest(paths.src.sass+"bulma"))
    
  gulp
    .src([
      'node_modules/jquery/dist/jquery.js'
    ])
    .pipe(babel({
      presets: ['@babel/env'],
    }))
    .pipe(concat('libraries.js'))
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(plumber({errorHandler: onError}))

  done();
}


// Compile Handlebars into HTML
function html() {
  return gulp
    .src(paths.src.pages)
    .pipe(handlebars(handlebarsData, {
      ignorePartials: true,
      batch: [paths.src.partials]
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      extname: '.html'
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.dist.root))
    .pipe(browsersync.reload({ stream:true }));
};


// Glob SCSS Imports, Generate Sourcemaps, and Compile to CSS
var sassOptions = {
  outputStyle: 'expanded',
  importer: tildeImporter
};
var prefixerOptions = {
  browsers: ['last 2 versions']
};

function styles() {
  return gulp
    .src([paths.src.sass+'main.scss'])
    .pipe(sassGlob())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(purgecss({
      content: [paths.src.root + "/hbs/**/*.hbs"]
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
}

function runStylelint() {
  return gulp
    .src([paths.src.sass+'**/*.scss'])
    .pipe(stylelint({
      failAfterError: false,
      reportOutputDir: 'reports/lint',
      reporters: [
        {formatter: 'verbose', console: true}
      ],
      debug: true
    }))
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
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(browsersync.stream());

  gulp
    .src([paths.src.libs])
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(concat('bundle.js'))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.libs))
    .pipe(browsersync.stream());

  done();
}


// Copy Images to Dist
function images() {
  return gulp
    .src([paths.src.images])
    .pipe(imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5
    }))
    .pipe(gulp.dest(paths.dist.images))
    .pipe(browsersync.stream());
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
  gulp.watch(paths.src.sass, gulp.series(styles, runStylelint));
  gulp.watch(paths.src.javascript, scripts);
  gulp.watch(paths.src.images, images);
  gulp.watch(paths.src.hbs, gulp.parallel(html, styles));
}


// Build Tasks
gulp.task('default', gulp.series(cleanDist, runStylelint, importLibraries, html, scripts, images, files, styles, gulp.parallel(watchFiles, runBrowsersync), function (done) {
  done();
}));