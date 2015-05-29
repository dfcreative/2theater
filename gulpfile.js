var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var frontMatter = require('gulp-front-matter');
var nunjucks = require('nunjucks');
var marked = require('gulp-marked');
var plumber = require('gulp-plumber');


nunjucks.configure('template', {
	watch: false
});


gulp.task('default', function () {
	/** Export all static pages */
	gulp.src('./content/*.md')
		//catch errors
		.pipe(plumber({
			errorHandler: function (e) {
				console.error(e);
			}
		}))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//transform markdown to html
		.pipe(marked({
		}))

		//render resulting template
		.pipe(map(function (file, cb) {
			file.contents = new Buffer(nunjucks.renderString(file.contents.toString(), file['data']));

			cb(null, file);
		}))

		//rename files to be served as index.html in directories
		.pipe(rename(function (file) {
			file.dirname += '/' + file.basename;
			file.basename = 'index';
			file.extname = '.html';
		}))

		//finally write to the output dir
		.pipe(gulp.dest('_site'));
});