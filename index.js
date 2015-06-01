var Swiper = require('swiper');
var q = require('queried');
var on = require('emmy/on');
var Dialog = require('dialog-component');


/** Init menu */
var menuLink = q('.page-logo');
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


/** Init swiper instances */
var swiperEls = q.all('.swiper-container');

swiperEls.forEach(function (swiperEl) {
	var swiper = new Swiper(swiperEl, {
		effect: 'fade',
		loop: true,
		autoplay: 1500,
		speed: 400,
		mousewheelControl: false,
		autoplayDisableOnInteraction: true,
		simulateTouch: false,
		preventClicks: false
	});

	swiper.stopAutoplay();

	on(swiperEl, 'mouseenter', function () {
		swiper.startAutoplay();
	});
	on(swiperEl, 'mouseleave', function () {
		swiper.stopAutoplay();
		swiper.slideTo(1);
	});
});

