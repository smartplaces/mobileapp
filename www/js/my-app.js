// Initialize your app
var myApp = new Framework7({
  swipeBackPage: false
});

// Export selectors engine
var $$ = Dom7;

// Add views
var view1 = myApp.addView('#view-1');
var view2 = myApp.addView('#view-2');
var view3 = myApp.addView('#view-3');
var view4 = myApp.addView('#view-4');

var historySlider = myApp.slider('.places-history', {pagination: '.slider-pagination', onSlideChangeEnd: function(slider) {myApp.showTab('#place' + slider.activeSlideIndex);}})
