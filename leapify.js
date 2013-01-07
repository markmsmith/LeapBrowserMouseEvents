alert("leapify loaded");
(function(){

    var ws;

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    // function drawFinger(leapPos, context){
    //   context.fillStyle = 'blue';
    //   context.strokeStyle = '#0044FF';
    //   context.beginPath();
    //   context.arc(100,75,50,0,  Math.PI * 2, true );
    //   context.stroke();
    //   console.log("drew finger");
    // }

    function scaleValue(val, min, max, rangeMin, rangeMax){
        if(val < min){ val = min; }
        if(val > max ){ val = max; }

        return ((val  - min) / (max - min) ) * (rangeMax - rangeMin) + rangeMin;
    };

    // function setParticlePosition(particle, leapPos){

    //     var x = scaleValue(leapPos.x, minX, maxX, -window.innerWidth, window.innerWidth);
    //     var y = scaleValue(leapPos.y, minY, maxY, -400, window.innerHeight);
    //     var z = scaleValue(leapPos.z, minZ, maxZ, -depth/2, depth/2);

    //     particle.position.set(x,y,z);
    // };

    var fingerOutlineColor = "#0000FF";
    var fingerOutlineTouchingColor = "#00FF00";

    var fingerCenterColor = "#0044FF";
    var fingerCenterTouchingColor = fingerOutlineTouchingColor;

    var minX = -250;
    var maxX = 250;

    var minX = -200;
    var maxX = 200;

    var minY = 20;
    var maxY = 300;

    var minZ = -100;
    var maxZ = 200;

    var depth = 300;

    var motionScale = 2.0;

    var minR = 5;
    var maxR = 15;

    // values less than this are considered touching
    var touchDepth = 0;

    // position of where a touch event started (or null if not touching)
    var touchStart = null;
    var touchStartEl = null;

    function createMouseEvent(x, y, type){
      var mouseEvent = document.createEvent("MouseEvent");
      mouseEvent.initMouseEvent(type, true, true, window, 1, x, y, x, y, false, false, false, false, 0, null);
      return mouseEvent;
    }

    function fireMouseClick(x, y, element){
      var clickEvent = createMouseEvent(x, y, 'click');
      element.dispatchEvent(clickEvent);

      // if (event.initMouseEvent) {     // all browsers except IE before version 9
      //     var clickEvent = document.createEvent ("MouseEvent");
      //     clickEvent.initMouseEvent ("click", true, true, window, 0,
      //                                 event.screenX, event.screenY, event.clientX, event.clientY,
      //                                 event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
      //                                 0, null);
      //     event.target.dispatchEvent (clickEvent);
      // } else {
      //     if (document.createEventObject) {   // IE before version 9
      //         var clickEvent = document.createEventObject (window.event);
      //         clickEvent.button = 1;  // left click
      //         event.srcElement.fireEvent ("onclick", clickEvent);
      //     }
      // }
    };

    function fireMouseDown(x, y, element){
      var downEvent = createMouseEvent(x, y, 'mousedown');
      element.dispatchEvent(downEvent);
    };

    function fireMouseUp(x, y, element){
      var upEvent = createMouseEvent(x, y, 'mouseup');
      element.dispatchEvent(upEvent);
    };

    function onTouch(x, y){
      touchStart = {
              x: x,
              y: y
      };
      touchStartEl = document.elementFromPoint(x, y) || window;
      fireMouseDown(x, y, touchStartEl);
    };

    function onTouchUp(x, y){
      var touchEndEl = document.elementFromPoint(x, y) || window;
      fireMouseUp(x, y, touchEndEl);
      if(touchEndEl === touchStartEl){
        fireMouseClick(x, y, touchStartEl);
      }

      touchStart = null;
      touchStartEl = null;
    };

    function updateFingers(leapData, fingerOutline, fingerCenter){

      // redo this every time incase of window resize TODO add resize listener
      var windowWidth =$(window).width();
      var windowHeight = $(window).height();

      if(leapData.hands && leapData.hands.length > 0){
        var hand = leapData.hands[0];
        if(hand.fingers && hand.fingers.length > 0){
          fingerOutline.show();
          fingerCenter.show();

          var leapPos = hand.fingers[0].tip.position;

          var x = scaleValue(leapPos[0] * motionScale, minX, maxX, 0, windowWidth);
          var y = scaleValue(leapPos[1] * motionScale, minY, maxY, windowHeight, 0);

          //var z = scaleValue(leapPos[2] * motionScale, minZ, maxZ, -depth/2, depth/2);
          var z = leapPos[2];
          var r = scaleValue(z * motionScale, 0, maxZ, maxR, minR);

          //TODO move this to an animation loop, so hides and shows work (unless Leap fixes their socket server)
          fingerOutline.attr("cx", x);
          fingerOutline.attr("cy", y);

          fingerCenter.attr("cx", x);
          fingerCenter.attr("cy", y);
          fingerCenter.attr("r", r);

          if(z < touchDepth){
            fingerOutline.attr("stroke", fingerOutlineTouchingColor);
            fingerCenter.attr("fill", fingerCenterTouchingColor);
            onTouch(x, y);
          }
          else{
            fingerOutline.attr("stroke", fingerOutlineColor);
            fingerCenter.attr("fill", fingerCenterColor);
            onTouchUp(x, y);
          }

          return;
        }
      }

      fingerOutline.hide();
      fingerCenter.hide();
    }

    function main(){
        var fingerOverlay = document.createElement('div');
        fingerOverlay.id = 'fingerOverlay';
        var overlayStyle = fingerOverlay.style;
       overlayStyle.backgroundColor = 'rgba(255,255,255,0.0)';
       overlayStyle.pointerEvents = 'none';
       overlayStyle.position = 'fixed';
       overlayStyle.left = '0px';
       overlayStyle.top = '0px';
       overlayStyle.margin = '0px';
       overlayStyle.padding = '0px';

       document.body.appendChild(fingerOverlay);

       //Create and open the socket
       ws = new WebSocket("ws://localhost:6437/");

       // On successful connection
       ws.onopen = function(event) {
         console.log("WebSocket connection open!");
       };

      // On message received
      ws.onmessage = function(event) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);
        updateFingers(obj, fingerOutline, fingerCenter);
      };

      // On socket close
      ws.onclose = function(event) {
        ws = null;
        console.log("WebSocket connection closed");
      };

      //On socket error
      ws.onerror = function(event) {
        alert("Received error from Leap");
      };

      var width =$(window).width();
      var height = $(window).height();

      var paper = Raphael('fingerOverlay', width, height);
      var fingerOutline = paper.circle(100, 75, maxR);
      fingerOutline.attr("stroke", fingerOutlineColor);
      var fingerCenter = paper.circle(100, 75, minR);
      fingerCenter.attr("fill", fingerCenterColor);
    }

    function loadScript(path, onLoad){
        var script = document.createElement('script');
        script.src = path;
        script.onload = onLoad;
        document.body.appendChild(script);
    }

    function loadScripts(scripts){
       var scriptsToLoad = scripts.length;
       var onLoad = function(){
            scriptsToLoad--;
            if(scriptsToLoad === 0){
                main();
            }
        };

        for(var i=0, l=scripts.length; i < l; i++){
            loadScript(scripts[i], onLoad);
        }
    }

    loadScripts(['https://raw.github.com/markmsmith/LeapBrowserMouseEvents/master/lib/raphael-min.js',
                 'https://raw.github.com/markmsmith/LeapBrowserMouseEvents/master//lib/jquery-1.8.3.min.js']);

})();
