var gulp          = require('gulp'),
    handlebars    = require('gulp-compile-handlebars'),
    browserSync   = require('browser-sync'),
    prefix        = require('gulp-autoprefixer'),
    cleanCSS      = require('gulp-clean-css'),
    notify        = require('gulp-notify'),
    plumber       = require('gulp-plumber'),
    minimist      = require('minimist'),
    rename        = require('gulp-rename'),
    sass          = require('gulp-sass'),
    sourcemaps    = require('gulp-sourcemaps'),
    runSequence   = require('run-sequence'),
    reload        = browserSync.reload,
    del           = require('del'),
    vinylPaths    = require('vinyl-paths'),
    colors        = require('colors'),
    util          = require('gulp-util'),
    concat        = require('gulp-concat'),
    sassGlob      = require('gulp-sass-bulk-import'),
    watch         = require('gulp-watch'),
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


// BUILD ALL SUBTASKS
// ---------------
gulp.task('serve', () => {
  browserSync.init({
    server: paths.dist.root,
    open: true,
    notify: false,
    online: false, // Whether to listen on external
  });
});

gulp.task('styles', () => {
  gulp.src([paths.src.sass])
    .pipe(sassGlob())
    .pipe(cleanCSS())
    .on('error', util.log)
    .pipe(sass({
      includePaths: ['src/scss'],
    }))
    .on('error', util.log)
    .pipe(prefix('last 2 versions'))
    .on('error', util.log)
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.reload({stream: true}));
});

/* Compile Handlebars/Partials into HTML */
gulp.task('templates', () => {
  var opts = {
    ignorePartials: true,
    batch: ['src/partials'],
  };

  gulp.src([paths.src.root + '/*.hbs'])
    .pipe(handlebars(null, opts))
    .on('error', util.log)
    .pipe(rename({
      extname: '.html',
    }))
    .on('error', util.log)
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
    .on('error', util.log)
    .pipe(uglify())
    .on('error', util.log)
    .pipe(gulp.dest(paths.dist.javascript))
    .pipe(browserSync.reload({stream: true}));

  /* Minify JS and move to distribution folder */
  gulp.src([paths.src.libs])
    .pipe(uglify())
    .on('error', util.log)
    .pipe(rename({
      suffix: '.min',
    }))
    .on('error', util.log)
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
  runSequence('watch', 'serve', 'images', 'files', 'styles', 'scripts', 'templates', done);
});