var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

// Get one .styl file and render
gulp.task('stylus', function(){
  return gulp.src('./stylus/main.styl')
  .pipe($.stylus({pretty:true}))
  .pipe(gulp.dest('./public/css'));
});


// Transpile ES6 source files into JavaScript
gulp.task('build', ['views', 'public'], function() {
	'use strict';

	return gulp.src(['src/**/*.js'])
		.pipe($.babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('views', function() {
	'use strict';
	return gulp.src(['src/views/**/*.jade'])
		.pipe(gulp.dest('dist/views/'));
});

gulp.task('public', function() {
	'use strict';
	return gulp.src(['public/**'])
		.pipe(gulp.dest('dist/public'));
});

// Run Hapi server and realod on changes
gulp.task('serve', function() {
	'use strict';
  gulp.watch('./src/**/*.js', ['build']);
  gulp.watch('./stylus/**/*.styl', ['stylus']);
  $.nodemon({
    script: 'dist/server.js'
//    exec: './node_modules/.bin/babel-node',
//    ignore: ['gulpfile.js', 'node_modules', 'test']
  });
});

// Run lab tests
gulp.task('test', function() {
	'use strict';
	return gulp.src(['test/**/*.js', 'test/mocks/*.js'])
		.pipe($.lab('-T node_modules/lab-babel'));
});

// Run tests and watch for changes to keep tests running
gulp.task('tdd', ['test'], function() {
	'use strict';
	gulp.watch('{src,test}/**/*.js', ['test']);
});

// Clean built directory
gulp.task('clean', function (callback) {
	'use strict';

	var del = require('del');
	del(['dist'], callback);
});

gulp.task('default', ['build']);
