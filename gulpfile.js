/*
 * - run 6to5
 * - build sourcemaps
 */

var gulp = require('gulp')

var to5 = require('gulp-6to5')
var sourcemaps = require('gulp-sourcemaps')

var buildList = [ 'dagoba.js' ]

gulp.task('build', function () {
  gulp.src(buildList)
    .pipe(sourcemaps.init())
    .pipe(to5())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'))
})

gulp.task('default',['build'])
