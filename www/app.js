var app = (function(){
  // Application object.
  var app = {};

  var UUID = 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0';

  var FOREGROUND = true;

  var historyStorage = 'historyStorage';

  // Specify your beacon UUIDs here.
  var regions =
  [
    {uuid: UUID}
  ];

  // Dictionary of beacons.
  var beacons = {};

  // Timer that displays list of beacons.
  var updateTimer = null;

  app.initialize = function(){
    document.addEventListener('deviceready', onDeviceReady, false);
    document.addEventListener('pause',function(){ FOREGROUND=false; },false);
    document.addEventListener('resume',function(){ FOREGROUND=true;},false);
  };

  function onDeviceReady(){

    // Specify a shortcut for the location manager holding the iBeacon functions.
    window.locationManager = cordova.plugins.locationManager;

    window.plugin.notification.local.onclick = function (id, state, json) {
      //TODO: Roll the message list to current message with id
    };

    if (window.locationManager.isRangingAvailable()){
      // Start tracking beacons!
      startScan();

      // Show saved message history
      showMessageList();

      // Display refresh timer.
      updateTimer = setInterval(displayBeaconList, 500);
    }else{
      alert('Упс! Ваше устройство не поддерживается :(');
    }

  };

  function startScan(){
    // The delegate object holds the iBeacon callback functions
    // specified below.
    var delegate = new locationManager.Delegate();

    // Called continuously when ranging beacons.
    delegate.didRangeBeaconsInRegion = function(pluginResult){
      //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
      for (var i in pluginResult.beacons){
        // Insert beacon into table of found beacons.
        var beacon = pluginResult.beacons[i];
        beacon.timeStamp = Date.now();
        var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
        beacons[key] = beacon;
      }
    };

      // Called when starting to monitor a region.
      // (Not used in this example, included as a reference.)
    delegate.didStartMonitoringForRegion = function(pluginResult){
        //console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
    };

      // Called when monitoring and the state of a region changes.
      // (Not used in this example, included as a reference.)
    delegate.didDetermineStateForRegion = function(pluginResult){
        //console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
        //alert(JSON.stringify(pluginResult));
        /*
        if(pluginResult.state === "CLRegionStateInside"){
          alert('INSIDE');
        } else if(pluginResult.state === "CLRegionStateOutside"){
          alert('OUTSIDE');
        }else {
          alert('UNKNOWN');
        }
        */

    };

      // Set the delegate object to use.
    locationManager.setDelegate(delegate);

      // Request permission from user to access location info.
      // This is needed on iOS 8.
    locationManager.requestAlwaysAuthorization();

      // Start monitoring and ranging beacons.
    for (var i in regions){
        var beaconRegion = new locationManager.BeaconRegion(i + 1, regions[i].uuid);

        // Start ranging.
        locationManager.startRangingBeaconsInRegion(beaconRegion).fail(console.error).done();

        // Start monitoring.
        // (Not used in this example, included as a reference.)
        locationManager.startMonitoringForRegion(beaconRegion).fail(console.error).done();
    }
  }

  function displayBeaconList(){
    // Clear beacon list.
    $('#found-beacons').empty();

    var timeNow = Date.now();

    // Update beacon list.
    $.each(beacons, function(key, beacon){
      // Only show beacons that are updated during the last 60 seconds.
      if (beacon.timeStamp + 60000 > timeNow){
          // Map the RSSI value to a width in percent for the indicator.
          var rssiWidth = 1; // Used when RSSI is zero or greater.
          if (beacon.rssi < -100) { rssiWidth = 100; }
          else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }
            // Create tag to display beacon data.
            var element = $(
                '<li>'
              +   '<a href="#" class="item-link item-content">'
              +     '<div class="item-inner">'
              +       '<div class="item-title-row">'
              +         '<div class="item-title">'+beacon.uuid+'</div>'
              +         '<div class="item-after">'+beacon.major+':'+beacon.minor+'</div>'
              +       '</div>'
              +       '<div class="item-subtitle">'+beacon.proximity+'</div>'
              +       '<div class="item-text">'
              +	        'RSSI: ' + beacon.rssi + '<br />'
              + 	      '<div style="background:rgb(255,128,64);height:20px;width:'+ rssiWidth + '%;"></div>'
              +       '</div>'
              +     '</div>'
              +   '</a>'
              + '</li>'
            );
            $('#found-beacons').append(element);
            processScenario(beacon);
      }
    });
  }

  function processScenario(beacon){
    //console.log('------------- PROCESS BEACON -------------');
    var timeNow = Date.now();
    var place = (beacon.uuid+':'+beacon.major+':'+beacon.minor).toUpperCase();
    var history = localStorage[place] ? JSON.parse(localStorage[place]) : {};
    if (!history.disabledUntil || (history.disabledUntil < timeNow)){
        //console.log('------------- PROCESS SCENARIO -------------');
        history.disabledUntil=timeNow + 10000;
        localStorage[place]=JSON.stringify(history);

        var proximity = beacon.proximity.toUpperCase().replace("PROXIMITY","");
        $.ajax({
          dataType: "jsonp",
          url: "http://sleepy-scrubland-4869.herokuapp.com/mobile/message/"+beacon.uuid.toUpperCase()+"/"+beacon.major+"/"+beacon.minor+"/"+proximity
        })
        .done(function(data) {
          //console.log('------------- RECEIVE DATA -------------');
          if (console && console.log) {
            console.log(JSON.stringify(data));
          }
          if (data){
            data.ts = timeNow;
            // showMessage(data); // temporary disabled
            //Add event to history
            history.events = history.events || [];
            history.events.push(data);
            history.disabledUntil=timeNow + (parseInt(data.frequency)*1000);
            localStorage[place]=JSON.stringify(history);
            //Increase event counter for place
            var places = localStorage[UUID] ? JSON.parse(localStorage[UUID]) : {};
            var count = places[place] || 1;
            places[place] = count + 1;
            localStorage[UUID]=JSON.stringify(places);
            // new
            var messageHistory = localStorage[historyStorage] ? JSON.parse(localStorage[historyStorage]) : [];
            var curMessageIndex = -1;
            messageHistory.every(function (element, index, array) {
              if (element._id == data._id) {
                curMessageIndex = index;
                return false;
              } else {
                return true;
              };
            });
            if (curMessageIndex < 0) {
              messageHistory.push(data);
            } else {
              messageHistory[curMessageIndex] = data;
            };
            messageHistory = _.sortBy(messageHistory, function(element) { return -element.ts; });
            localStorage[historyStorage] = JSON.stringify(messageHistory);
            showMessageList();
            showLocalNotification(data);
          }
        });
    }

  }

  function showMessageList() {
    var messageHistory = localStorage[historyStorage] ? JSON.parse(localStorage[historyStorage]) : [];
    var messageHTML = '';
    var messageTemplate = _.template($('#messageTemplate').html());
    _.each(messageHistory, function (element, index, list) {
      if (element.messagetype == '10') {
        messageHTML += messageTemplate(element);
      };
    });
    if (messageHTML != '')
      $('#message').html(messageHTML);
  }

  function showMessage(m){
    // Compiled message template
    var messageTemplate = _.template($('#messageTemplate').html());

    //console.log('------------- SHOW MESSAGE -------------');
    if (m.messagetype=='10'){
      /*
      $('#message').html(
        '<div style="width: 100%; height: 50%; background-image: url('+m.image.url+'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>'
        + '<div class="content-block-title">'+m.header+'</div>'
        + '<div class="content-block">'+m.text+'<br/>'+m.ts+'</div>'
      );
      */
      $('#message').html(messageTemplate(m));

    }else if (m.messagetype=='20'){
      $('#message').html("<iframe width='100%'' height='100%' src='"+m.url+"' frameborder='0' allowfullscreen></iframe>");
    }else{
      console.log('Unknown message type in message: '+JSON.stringify(m));
    }
    if (m.coupon){
      $('#couponLink').html('<a href="#" class="link" onclick="window.open(\''+m.coupon+'\', \'_system\');"><span>Скачать купон</span></a>');
    }
  }

  function showLocalNotification (message) {
    if (!FOREGROUND){
      window.plugin.notification.local.add({
        id: message._id,
        title:   message.header,
        message: message.text,
        json: message,
        autoCancel: true
      });
    }else{
      //TODO: Do somethig else when app in foreground
    }
  };

  return app;
})();

app.initialize();
