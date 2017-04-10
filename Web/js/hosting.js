/*
Author       : 
Template Name: 
Version      : 1.0
*/

jQuery(function($) {
	"use strict";

		/*START MENU JS*/
		$(window).on('scroll', function() {
			if ($(".navbar").offset().top > 50) {
				$(".navbar-fixed-top").addClass("top-nav-collapse");
			} else {
				$(".navbar-fixed-top").removeClass("top-nav-collapse");
			}
		});
		
		$('a.page-scroll').on('click', function(event) {
			var $anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $($anchor.attr('href')).offset().top - 10 
			}, 1500, 'easeInOutExpo');
			event.preventDefault();
		});

		/* Closes the Responsive Menu on Menu Item Click*/
		$('.navbar-collapse ul li a').on('click', function() {
			$('.navbar-toggle:visible').click();
		});
		/*END MENU JS*/ 

	  
	/*START WOW ANIMATIONS JS*/ 
		new WOW().init();
	/*END WOW ANIMATIONS JS*/ 
	
	
	function init_navbar() {
	var a = $("#masthead")
		, b = $(a).outerHeight();
	$(".site-header-affix-wrapper").css("height", b);
	var c;
	c = $(".topbar").outerHeight(), $(window).scroll(function () {
		$(window).scrollTop() > c ? $(a).addClass("sticky-bar").addClass("header-dark") : $(a).removeClass("sticky-bar").removeClass("header-dark")
	}), $(window).scrollTop() > c && $(a).addClass("sticky-bar").addClass("header-dark"), $(".nav-menu li a, .site-title a").on("click", function (a) {
		var b = $(this);
		$("html, body").stop().animate({
			scrollTop: $(b.attr("href")).offset().top
		}, 1500, "easeInOutExpo"), a.preventDefault()
	}), $(".nav-menu li").on("click", function () {
		$(".nav-menu li.current-menu-item").removeClass("current-menu-item"), $(this).addClass("current-menu-item")
	})
}


jQuery(window).trigger("resize").trigger("scroll"), init_navbar()
	
	
	
	
  });