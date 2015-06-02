var Swiper = require('swiper');
var q = require('queried');
var on = require('emmy/on');
var Dialog = require('dialog-component');
var closest = require('closest');

/** Init menu */

var menuLink = q('.page-menu-link');
var menuEl = q('.page-menu');

if (menuLink) {
	//detach menu
	menuEl.parentNode.removeChild(menuEl);
	menuEl.removeAttribute('hidden');

	//hook up dialog
	var dialog = new Dialog(menuEl);
	dialog
	.closable()
	.effect('fade')
	.overlay()
	.escapable()

	on(menuLink, 'click', function (e) {
		e.preventDefault();
		dialog.show();
	});
}


/** Init swiper instances in feed */

var feedSwiperEls = q.all('.feed-item-preview');

feedSwiperEls.forEach(function (swiperEl) {
	var swiper = new Swiper(swiperEl, {
		effect: 'fade',
		loop: true,
		autoplay: 1300,
		speed: 350,
		mousewheelControl: false,
		autoplayDisableOnInteraction: true,
		simulateTouch: false,
		preventClicks: false
	});

	swiper.stopAutoplay();

	on(closest(swiperEl, '.feed-item'), 'mouseenter', function () {
		swiper.startAutoplay();
	});
	on(closest(swiperEl, '.feed-item'), 'mouseleave', function () {
		swiper.stopAutoplay();
		swiper.slideTo(1);
	});
});


/** Init swiper gallery on single item */

var singleSwiperEls = q.all('.single-preview');

singleSwiperEls.forEach(function (swiperEl) {
	var swiper = new Swiper(swiperEl, {
		effect: 'slide',
		loop: true,
		speed: 350,
		prevButton: '.swiper-button-prev',
		nextButton: '.swiper-button-next'
	});
});