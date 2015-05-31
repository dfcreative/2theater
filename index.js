var Swiper = require('swiper');
var q = require('queried');
var on = require('emmy/on');

/** Init swiper instances */
var swiperEls = q.all('.swiper-container');

swiperEls.forEach(function (swiperEl) {
	var swiper = new Swiper(swiperEl, {
		effect: 'fade',
		loop: true,
		autoplay: 1500,
		speed: 400,
		mousewheelControl: false,
		autoplayDisableOnInteraction: true
	});

	swiper.stopAutoplay();

	on(swiperEl, 'mouseenter', function () {
		swiper.slideTo(2);
		swiper.startAutoplay();
	});
	on(swiperEl, 'mouseleave', function () {
		swiper.stopAutoplay();
		swiper.slideTo(1);
	});
});