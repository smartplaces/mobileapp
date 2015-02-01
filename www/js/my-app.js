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

var historySlider = myApp.slider('#history-slider-container', {pagination: '.slider-pagination', onSlideChangeEnd: function(slider) {myApp.showTab('#place' + (slider.activeSlideIndex + 1));}})

moment.locale('ru');

$$('#message').on('scroll resize DOMSubtreeModified', function () {

  // #message top padding
  var topOffset = parseInt($('#message').css('padding-top').substring(0, $('#message').css('padding-top').indexOf('p')));
  var hasFakeTitle = false;
  var $fakeTitle = $('#message-fake-content-block-title');

  $('#message .content-block-wrapper').each(function(index, element) {
    var titleHeight = $(element).find('.content-block-title').eq(0).outerHeight(true);
    var elementTop = $(element).position().top;
    var elementHeight = $(element).outerHeight(true);
    $(element).find('.content-block-title-filler').css('height', titleHeight);
    if ((elementTop + elementHeight - topOffset) <= titleHeight) {
      $(element).addClass('hidden-title');
      $(element).removeClass('float-title');
    } else if (elementTop <= topOffset) {
      $(element).addClass('float-title');
      $(element).removeClass('hidden-title');
      $fakeTitle.empty();
      $fakeTitle.css('top', topOffset + 'px');
      $(element).find('.content-block-title').eq(0).clone().appendTo($fakeTitle);
      hasFakeTitle = true;
    } else {
      $(element).removeClass('float-title');
      $(element).removeClass('hidden-title');
    };
  });

  if (! hasFakeTitle) {
    $fakeTitle.empty();
  };

});
