var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var frontMatter = require('gulp-front-matter');
var nunjucks = require('nunjucks');
var marked = require('gulp-marked');
var plumber = require('gulp-plumber');
var fs = require('fs');
var extend = require('xtend/mutable');


nunjucks.configure('template', {
	watch: false
});

//get base.html template to use as a wrapper for pages
var tpl = nunjucks.compile(fs.readFileSync('./template/base.html', {
	encoding: 'utf8'
}));


gulp.task('default', function () {
	/** Export all static pages */
	gulp.src('./content/*.md')
		//catch errors
		// .pipe(plumber({
		// 	errorHandler: function (e) {
		// 		console.error(e);
		// 	}
		// }))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//transform markdown to html
		.pipe(marked({
		}))

		//render base template
		.pipe(map(function (file, cb) {
			file.contents = new Buffer(
				tpl.render(
					extend({
						content: nunjucks.renderString(
							file.contents.toString(),
							file['data']
						)
					}, file['data'])
				)
			);

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