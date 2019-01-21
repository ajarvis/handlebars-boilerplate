var gulp          = require('gulp'),
    handlebars    = require('gulp-compile-handlebars'),
    browserSync   = require('browser-sync'),
    prefix        = require('gulp-autoprefixer'),
    cleanCSS      = require('gulp-clean-css'),
    notify        = require('gulp-notify'),
    plumber       = require('gulp-plumber'),
    rename        = require('gulp-rename'),
    sass          = require('gulp-sass'),
    sourcemaps    = require('gulp-sourcemaps'),
    runSequence   = require('run-sequence'),
    reload        = browserSync.reload,
    concat        = require('gulp-concat'),
    sassGlob      = require('gulp-sass-bulk-import'),
    babel         = require('gulp-babel'),
    uglify        = require('gulp-uglify');

var paths = {
  src: { root: 'src' },
  dist: { root: 'dist' },
  init: function() {
    this.src.sass        = this.src.root + '/scss/main.scss';
    this.src.templates   = this.src.root + '/**/*.hbs';
    this.src.javascript  = [this.src.root + '/js/**/*.js', '!' + this.src.root + '/js/libs/*.js'];
    this.src.libs        = this.src.root + '/js/libs/*.js';
    this.src.images      = this.src.root + '/images/**/*.{jpg,jpeg,svg,png,gif}';
    this.src.files       = this.src.root + '/*.{html,txt}';

    this.dist.css        = this.dist.root + '/css';
    this.dist.images     = this.dist.root + '/images';
    this.dist.javascript = this.dist.root + '/js';
    this.dist.libs       = this.dist.root + '/js/libs';

    return this;
  },
}.init();

// ERROR HANDLING
// ---------------
var onError = function(err) {
  notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Basso"
  })(err);
  this.emit('end');
};


// BUILD ALL SUBTASKS
// ---------------
gulp.task('serve', () => {
  browserSync.init({
    server: paths.dist.root,
    open: true,
    notify: false,
    online: false,
  });
});

/* Import Bootstrap */
gulp.task('bootstrap', function() {
  gulp.src(['node_modules/bootstrap/scss/bootstrap.scss'])
  .pipe(sass())
  .pipe(gulp.dest("dist/css"))
});

/* Glob SCSS Imports, generate sourcemaps, and compile CSS */
gulp.task('styles', function() {
  gulp.src([paths.src.sass])
    .pipe(sassGlob())
    .pipe(plumber({errorHandler: onError}))
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['src/scss'],
      outputStyle: 'expanded'
    }))
    .pipe(prefix('last 2 versions'))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(reload({stream:true}))

    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dist.css))
});

/* Compile Handlebars/Partials into HTML */
gulp.task('templates', () => {
  var opts = {
    ignorePartials: true,
    batch: ['src/partials'],
  };

  gulp.src([paths.src.root + '/*.hbs'])
    .pipe(handlebars(null, opts))
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      extname: '.html',
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.root))
    .pipe(browserSync.reload({stream: true}));
});

/* Bundle all javascript */
gulp.task('scripts', () => {
  gulp.src(paths.src.javascript)
    .pipe(babel({
      presets: ['es2015'],
    }))
    .pipe(concat('bundle.js'))
    .pipe(plumber({errorHandler: onError}))
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(browserSync.reload({stream: true}));

  /* Minify JS and move to distribution folder */
  gulp.src([paths.src.libs])
    .pipe(uglify())
    .pipe(plumber({errorHandler: onError}))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(plumber({errorHandler: onError}))
    .pipe(gulp.dest(paths.dist.libs))
    .pipe(browserSync.reload({stream: true}));
});

/* Copy images to dist folder */
gulp.task('images', () => {
  gulp.src([paths.src.images])
    .pipe(gulp.dest(paths.dist.images));
});

/* Copy files to dist folder */
gulp.task('files', () => {
  gulp.src([paths.src.files])
    .pipe(gulp.dest(paths.dist.root));
});

gulp.task('watch', () => {
  gulp.watch('src/scss/**/*.scss', ['styles']);
  gulp.watch(paths.src.javascript, ['scripts']);
  gulp.watch(paths.src.templates, ['templates']);
});

// BUILD TASKS
// ---------------
gulp.task('default', function(done) {
  runSequence('bootstrap', 'watch', 'serve', 'images', 'files', 'styles', 'scripts', 'templates', done);
});