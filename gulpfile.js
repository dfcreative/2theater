var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var through = require('through2');
var frontMatter = require('gulp-front-matter');
var nunjucks = require('nunjucks');
var marked = require('gulp-marked');
var plumber = require('gulp-plumber');
var fs = require('fs');
var extend = require('xtend/mutable');
var changed = require('gulp-changed');
var clone = require('clone');


nunjucks.configure('template', {
	watch: false
});

/**
 * get base template to use as a wrapper for pages
 */
var tpl = nunjucks.compile(fs.readFileSync('./index.html', {
	encoding: 'utf8'
}));


/** Destination folder */
var DEST = '_site';


/** Project metadata */
var metadata = {
};


/** Defaultly build all */
gulp.task('default', [
	'collect-images',
	'build-static-pages',
	'build-plays'
]);


/** Export all static pages */
gulp.task('build-static-pages', ['collect-genres'], function () {
	return gulp.src('./content/*.md')

		//ignore unchanged files
		.pipe(changed(DEST))

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
			var data = extend( clone(metadata), file['data'] );
			data.content = nunjucks.renderString(
				file.contents.toString(),
				data
			);

			file.contents = new Buffer(
				tpl.render(data)
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
		.pipe(gulp.dest(DEST));
});


/** Collect and structurize data related to navigation */
gulp.task('collect-genres', function () {
	//set genres global property
	metadata.genres = {};

	//for each play collect genre, group by genres
	return gulp.src('./content/play/**/index.md')
		.pipe(changed(DEST))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: false,
			property: 'data'
		}))

		//for each file - collect data
		.pipe(through.obj(function (file, enc, cb) {
			var playGenres = file.data.genre || file.data.genres;
			if (!Array.isArray(playGenres)) playGenres = [playGenres];
			playGenres.forEach(function (genre) {
				if (!metadata.genres[genre]) metadata.genres[genre] = [];

				metadata.genres[genre].push(file.data);
			});

			cb(null, file);
		}));
});


/** Build plays list */
gulp.task('build-plays', ['collect-genres'], function () {
});


/** Collect images by files to public folder */
gulp.task('collect-images', function () {

});