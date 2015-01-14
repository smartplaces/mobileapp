var app = (function(){
  // Application object.
  var app = {};

  // Specify your beacon UUIDs here.
  var regions =
  [
    {uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0'}
  ];

  // Dictionary of beacons.
  var beacons = {};

  // Timer that displays list of beacons.
  var updateTimer = null;

  app.initialize = function(){
    document.addEventListener('deviceready', onDeviceReady, false);
    //initScenarios();
  };

  function onDeviceReady(){
    // Specify a shortcut for the location manager holding the iBeacon functions.
    window.locationManager = cordova.plugins.locationManager;

    // Start tracking beacons!
    startScan();

    // Display refresh timer.
    updateTimer = setInterval(displayBeaconList, 500);
  }

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
    var id = (beacon.uuid+':'+beacon.major+':'+beacon.minor).toUpperCase();
    var timeNow = Date.now();
    var scenarioString = localStorage[id];
    if (scenarioString){
      var scenario = JSON.parse(scenarioString);
      if (!scenario.disabledUntil || (scenario.disabledUntil < timeNow)){

        var proximity = beacon.proximity.toUpperCase().replace("PROXIMITY","");
        $.ajax({
          dataType: "jsonp",
          url: "http://sleepy-scrubland-4869.herokuapp.com/mobile/message/"+beacon.uuid.toUpperCase()+"/"+beacon.major+"/"+beacon.minor+"/"+proximity
        })
        .done(function(data) {
          if (console && console.log) {
            console.log(JSON.stringify(data));
          }
          if (data){
            data.ts = timeNow;
            showMessage(data);
            scenario.history = scenario.history || [];
            scenario.history.push(data);
          }
          scenario.disabledUntil=timeNow + 60000;
          localStorage[id]=JSON.stringify(scenario);
        });
      }
    }

    /*
    var id = (beacon.uuid+':'+beacon.major+':'+beacon.minor).toUpperCase();
    var timeNow = Date.now();
    var scenarioString = localStorage[id];
    if (scenarioString){
      var scenario = JSON.parse(scenarioString);
      if (!scenario.disabledUntil || (scenario.disabledUntil < timeNow)){
        var proximity = beacon.proximity.toUpperCase().replace("PROXIMITY","");

        if (proximityToNum(proximity)<=proximityToNum(scenario.proximity)){
          scenario.disabledUntil=timeNow + 60000;
          localStorage[id]=JSON.stringify(scenario);
          showMessage(scenario.message);
        }
      }
    }
    */
  }

  function proximityToNum(proximity){
    switch (proximity.toUpperCase()){
      case 'FAR': return 2;
      case 'NEAR': return 1;
      case 'IMMEDIATE': return 0;
      default: return -1;
    }
  }

  function showMessage(m){
    if (m.messagetype=='10'){
      $('#message').html(
        '<div style="width: 100%; height: 50%; background-image: url('+m.image.url+'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>'
        + '<div class="content-block-title">'+m.header+'</div>'
        + '<div class="content-block">'+m.text+'<br/>'+m.ts+'</div>'
      );

    }else if (m.messagetype=='20'){
      $('#message').html("<iframe width='100%'' height='100%' src='"+m.url+"' frameborder='0' allowfullscreen></iframe>");
    }else{
      console.log('Unknown message type in message: '+JSON.stringify(data));
    }
    if (m.coupon){
      $('#couponLink').html('<a href="#" class="link" onclick="window.open(\''+m.coupon+'\', \'_system\');"><span>Скачать купон</span></a>');
    }
  }

  function initScenarios(){
    localStorage['E2C56DB5-DFFB-48D2-B060-D0F5A71096E0:1:1'] = JSON.stringify({
      proximity: 'FAR',
      message: {
        messageType: "10",
        header: "Бар &laquo;Mr. Drunke Bar&raquo;",
        text: "<p>Великий бар — это тот бар, величие и популярность которого держится на атмосфере, создаваемой барменами.</p>",
        image: './img/bg2.jpg'
      }
    });

    localStorage['8DEEFBB9-F738-4297-8040-96668BB44281:1:2967'] = JSON.stringify({
      proximity: 'IMMEDIATE',
      message: {
        messageType: "20",
        url: 'http://www.youtube.com/embed/q6BHHGvhZ0Y'
      }
    });
  }

  return app;
})();

app.initialize();
