/**
 * Site builder, instead of metalsmiths etc.
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var map = require('map-stream');
var frontMatter = require('gulp-front-matter');
var plumber = require('gulp-plumber');
var fs = require('fs');
var extend = require('xtend/mutable');
var changed = require('gulp-changed');
var clone = require('clone');
var path = require('path');
var i18n = require('i18n');



/**
 * Base template to use as a wrapper for pages
 */
var nunjucks, marked, renderer;


/** Paths */
var paths = {
	html: './template/*',
	dest: '_site',
	js: './index.js',
	css: './index.css',
	locale: './locale'
};


/** Project metadata/env. Everything in there will be accessible while rendering */
var metadata = {
	root: '_site',
	locale: 'ru',
	locales: ['en', 'ru' ,'fr'],
	title: 'To theater',
	description: 'A collection of the best theatrical plays'
};


/** Return absolute url from the  */
metadata.getThumbnailUrl = function (item, url) {
	if (!item.config) return;

	var thumbUrl = url || item.config.thumbnail;

	return path.normalize('/' + metadata.root + '/' + item.config.slug + '/' + thumbUrl);
};

/** Return item url */
metadata.getItemUrl = function (item) {
	if (!item.config) return '/' + metadata.root + '/';

	return '/' + metadata.root + '/' + item.config.slug;
};

/** Return absolute url */
metadata.getUrl = function (path) {
	if (path[0] === '/') path = path.slice(1);
	return '/' + metadata.root + '/' + path;
};


/** Get translation for the current locale */
i18n.configure({
	locales: metadata.locales,
	defaultLocale: metadata.locale,
	directory: paths.locale
});
metadata._ = function () {
	return i18n.__.apply(this, arguments);
};
metadata._n = function () {
	return i18n.__n.apply(this, arguments);
};



/** Defaultly build production */
gulp.task('default', function () {
	metadata.root = require('./package.json').name;
	gulp.start([
		'build-js',
		'build-css',
		'build-html'
	]);
});


/** Build html files */
gulp.task('build-html', function () {
	nunjucks = require('nunjucks');
	marked = require('marked');
	renderer = new marked.Renderer();
	renderer.code = function (inp) { return inp; };

	nunjucks.configure('./template', {
		watch: false
	});

	//NOTE: not used to let debugging go faster
	//FIXME: use in production
	// tpl = nunjucks.compile(fs.readFileSync('./template/base.html', {
	// 	encoding: 'utf8'
	// }));

	gulp.start([
		'build-static-pages',
		'build-items'
	]);
});


/** Export all static pages */
gulp.task('build-static-pages', ['build-ia'], function () {
	return gulp.src('./content/*.md')

		//ignore unchanged files
		// .pipe(changed(paths.dest))

		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e);
			}
		}))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//render base template
		.pipe(map(
			function (file, cb) {
				file.contents = new Buffer(renderMdFile(file));
				cb(null, file);
			})
		)

		//rename files to be served as index.html in directories
		.pipe(rename(function (file) {
			if (file.basename !== 'index') {
				file.dirname += '/' + file.basename;
				file.basename = 'index';
			}
			file.extname = '.html';
		}))

		//finally write to the output dir
		.pipe(gulp.dest(paths.dest));
});


/** Build plays in the dest dir */
gulp.task('build-ia', function () {
	//set metadata global collections
	metadata.genres = {};
	metadata.performances = [];
	metadata.venues = [];

	//for each play collect genre, group by genres
	return gulp.src('./content/*/index.md')
		// .pipe(changed(paths.dest))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: false,
			property: 'data'
		}))


		//for each file - collect data
		.pipe(map(function (file, cb) {
			//get play config info, append to .config property
			var config = getConfig(file.path);

			file.data.config = config;

			//collect genres for plays
			if (file.data.type === 'performance') {
				//save global genres
				var playGenres = file.data.genre || file.data.genres;
				if (!Array.isArray(playGenres)) playGenres = [playGenres];
				playGenres.forEach(function (genre) {
					if (!metadata.genres[genre]) metadata.genres[genre] = [];

					metadata.genres[genre].push(file.data);
				});

				//save global plays
				metadata.performances.push(file.data);
			}

			//collect venues
			else if (file.data.type === 'place') {
				//save global plays
				metadata.venues.push(file.data);
			}

			cb(null, file);
		}));
});


/** Return config for an .md file */
function getConfig(filePath) {
	var fileDir = path.dirname(filePath);

	try {

		//get play config info, append to .config property
		var config = fs.readFileSync(fileDir + '/config.json', {
			encoding: 'utf8'
		});
		config = JSON.parse(config);

		//ensure config slug
		if (!config.slug) config.slug = path.basename(fileDir);
	} catch (e) {
		config = {slug: path.basename(fileDir)};
	}

	return config;
}

/** Return rendered markdown string */
function renderMdFile(file) {
	//prerender content before markdown parser
	var res = file.contents.toString('utf8').trim();

	//provide pre-markdown rendering context
	var data = clone(metadata);

	//pass item object to items template
	if (file.data.type) {
		data = extend(data, {
			item: file.data
		});
	}

	res = nunjucks.renderString(res, data);

	//render markdown
	res = marked(res, {
		renderer: renderer
	});

	//provide html rendering context
	data.content = res;

	//default template for single items is single.html, otherwise declare it
	var tpl = ( data.item && data.item.config && data.item.config.template )
		|| ( data.item && data.item.template )
		|| data.template
		|| ( data.item && data.item.type ? 'single.html' : 'base.html' );

	res = nunjucks.render(tpl, data);

	return res;
}


/** Build plays pages */
gulp.task('build-items', ['build-ia'], function () {

	//find each md, render it and place to folder
	return gulp.src('./content/*/index.md')
		// .pipe(changed(paths.dest))

		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e);
			}
		}))

		//parse front matter per file, write to data-attribute
		.pipe(frontMatter({
			remove: true,
			property: 'data'
		}))

		//for each file - collect data
		.pipe(map(function (file, cb) {
			var config = getConfig(file.path);

			file.data.config = config;

			file.contents = new Buffer(renderMdFile(file));

			cb(null, file);
		}))

		//rename files to be served as index.html in directories
		.pipe(rename(function (file) {
			var config = getConfig('./content/' + file.dirname + '/config.json');

			file.extname = '.html';
			file.dirname = config.slug;
		}))

		.pipe(gulp.dest(paths.dest));
});


/** Build images */
gulp.task('build-images', function () {
	var imgo = require('gulp-imagemin');
	var resize = require('gulp-image-resize');

	gulp.src('./content/*/image/*')
		.pipe(changed(paths.dest))

		.pipe(rename(function (file) {
			var configPath = './content/' + path.dirname(file.dirname) + '/config.json';

			config = getConfig(configPath);

			file.dirname = config.slug + '/image';
		}))

		//resize
		.pipe(resize({
			width : 800,
			height : 510,
			crop : true,
			upscale : true
		}))

		//optimize image
		.pipe(imgo({
			progressive: true,
			optimizationLevel: 7
		}))

		.pipe(gulp.dest(paths.dest));
});


/** Build js */
gulp.task('build-js', function () {
	var browserify = require('browserify');
	var b = browserify(paths.js);
	b.bundle().pipe(
		fs.createWriteStream(paths.dest + '/index.js')
	);
});


/** Build css */
gulp.task('build-css', function () {
	var postcss = require('gulp-postcss');

	gulp.src(paths.css)
		.pipe(plumber({
			errorHandler: function (e) {
				console.log(e)
			}
		}))
		.pipe(postcss([
			require('postcss-import')()
			, require('autoprefixer')()
		]))
		.pipe(gulp.dest(paths.dest));
});


/** Rerun the task when a file changes */
gulp.task('watch', function () {
	gulp.start(['build-js', 'build-css']);

	gulp.watch([paths.html, './content/**/*'], ['build-ia', 'build-static-pages', 'build-items']);
	gulp.watch(paths.js, ['build-js']);
	gulp.watch(paths.css, ['build-css']);
});