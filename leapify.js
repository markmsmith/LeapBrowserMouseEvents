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
    }

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

    // trial and error determined range of values
    var minX = -200;
    var maxX = 200;

    var minY = 30;
    var maxY = 300;

    var minZ = -100;
    var maxZ = 200;

    var depth = 300;

    var motionScale = 2.0;

    var minR = 5;
    var maxR = 15;

    function FingerMarker(paper){
        this.x = 100;
        this.y = 75;
        this.z = 0;

        this.fingerOutline = paper.circle(this.x, this.y, maxR);
        this.fingerOutline.attr("stroke", fingerOutlineColor);

        this.fingerCenter = paper.circle(this.x, this.y, minR);
        this.fingerCenter.attr("fill", fingerCenterColor);

        this.touching = false;
    }

    FingerMarker.prototype.setPosition = function(x, y, z){
      this.x = x;
      this.y = y;
      this.z = z;

      this.fingerOutline.attr("cx", x);
      this.fingerOutline.attr("cy", y);

      this.fingerCenter.attr("cx", x);
      this.fingerCenter.attr("cy", y);

      var r = scaleValue(z * motionScale, 0, maxZ, maxR, minR);
      this.fingerCenter.attr("r", r);

      var touching = z < touchDepth;
      if(this.touching != touching){
        this.setTouching(touching);
      }

      return this.touching;
    };

    FingerMarker.prototype.updateState = function(){

      var pos = {
          x: this.x,
          y: this.y
      };

      // now touching
      if(this.touching){
        if(this.touchStart){
            // was previously touching
            fireMouseMove(pos, window);
        }
        else{
            // start of a new touch
            this.onTouch(pos);
        }
      }
      else if(this.touchStart){
        // was previously touching
        this.onTouchUp(pos);
      }
    };

    FingerMarker.prototype.setTouching = function(touching) {
        var newOutlineColor;
        var newCenterColor;
        if(touching){
            newOutlineColor = fingerOutlineTouchingColor;
            newCenterColor = fingerCenterTouchingColor;
        }
        else{
            newOutlineColor = fingerOutlineColor;
            newCenterColor = fingerCenterColor;
        }

        this.fingerOutline.attr("stroke", newOutlineColor);
        this.fingerCenter.attr("fill", newCenterColor);

        this.touching = touching;
    };

    FingerMarker.prototype.onTouch = function(pos){
      this.touchStart = pos;
      this.touchStartEl = document.elementFromPoint(pos.x, pos.y);
      if(this.touchStartEl){
        var offset = $(this.touchStartEl).offset();
        this.touchStartClient = {
            x: this.touchStart.x - offset.x,
            y: this.touchStart.y - offset.y
        };
     }
     else{
        this.touchStartEl = window;
        this.touchStartClient = this.touchStart;
     }

      fireMouseDown(this.touchStartClient, this.touchStartEl);
    };

    FingerMarker.prototype.clearTouchInfo = function(){
      this.touchStart = null;
      this.touchStartEl = null;
      this.touchStartClient = null;
    };

    FingerMarker.prototype.onTouchUp = function(pos){
      var touchEndClient;
      var touchEndEl = document.elementFromPoint(pos.x, pos.y);
      if(touchEndEl){
        var offset = $(touchEndEl).offset();
        touchEndClient = {
            x: pos.x - offset.x,
            y: pos.y - offset.y
        };
      }
      else{
        touchEndEl = window;
        touchEndClient = pos;
      }

      fireMouseUp(touchEndClient, touchEndEl);
      if(touchEndEl === this.touchStartEl){
        fireMouseClick(touchEndClient, touchEndEl);
      }

      this.clearTouchInfo();
    };

    FingerMarker.prototype.hide = function() {
        this.fingerOutline.hide();
        this.fingerCenter.hide();
    };

    FingerMarker.prototype.show = function() {
        this.fingerOutline.show();
        this.fingerCenter.show();
    };

    FingerMarker.prototype.reset = function(){
      this.hide();
      this.setTouching(false);
      this.clearTouchInfo();
    };

    var fingerMarkers = [];

    // values less than this are considered touching
    var touchDepth = 0;

    // position of where a touch event started in screen coordinates (or null if not touching)
    var touchStart = null;
    // position of where a touch event started in element parent coordinates (or null if not touching)
    var touchStartClient = null;

    // The element that was touched, if any
    var touchStartEl = null;

    function createMouseEvent(pos, type, detail){
      var bubbles = true;
      var cancellable = true;
      var mouseEvent = document.createEvent("MouseEvent");
      mouseEvent.initMouseEvent(type, bubbles, cancellable, window,
                                detail,
                                0, 0,
                                pos.x, pos.y,
                                false, false, false, false, // modifier keys ctrl, alt, shift, meta
                                0, null);
      return mouseEvent;
    }

    function fireMouseClick(pos, element){
      var numberOfClicks = 1;
      var clickEvent = createMouseEvent(pos, 'click', numberOfClicks);
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
    }

    function fireMouseDown(pos, element){
      var buttonPressed = 0; // left
      var downEvent = createMouseEvent(pos, 'mousedown', buttonPressed);
      element.dispatchEvent(downEvent);
    }

    function fireMouseUp(pos, element){
      var buttonPressed = 0; // left
      var upEvent = createMouseEvent(pos, 'mouseup', buttonPressed);
      element.dispatchEvent(upEvent);
    }

    function fireMouseMove(pos, element){
      var moveEvent = createMouseEvent(pos, 'mousemove', 0);
      element.dispatchEvent(moveEvent);
    }

    function getFingers(leapData){
        var fingers = [];
        if(leapData.hands && leapData.hands.length > 0){
            var hand = leapData.hands[0];
            if(hand.fingers && hand.fingers.length > 0){
                return hand.fingers;
            }
        }

        return fingers;
    }

    var scrollStart = null;

    function processScrollGesture(fingerMarkers, lastTouch){
      // check if currenly scrolling
      if(scrollStart){

        // check if we still have at least one touch
        if(lastTouch){
          // var deltaX = lastTouch.x - scrollStart.x;
          // var deltaY = lastTouch.y - scrollStart.y;
          // window.scrollBy(deltaX, deltaY);
          window.scrollTo(lastTouch.x, lastTouch.y);
          return;
        }
      }
      else if(lastTouch){
        // started scrolling
        scrollStart = {
          x: lastTouch.x,
          y: lastTouch.y
        };
        return;
      }

      scrollStart = null;
    }

    function updateFingers(leapData){

      // redo this every time incase of window resize (TODO add resize listener instead)
      var windowWidth =$(window).width();
      var windowHeight = $(window).height();

      var fingers = getFingers(leapData);
      var noFingers = fingers.length;
      var noMarkers = fingerMarkers.length;

      var lastTouch = null;
      var m = 0;
      for(var f=0; f < noFingers && m < noMarkers; f++, m++){
        var finger = fingers[f];
        var marker = fingerMarkers[m];
        marker.show();

        var leapPos = finger.tip.position;

        var x = scaleValue(leapPos[0] * motionScale, minX, maxX, 0, windowWidth);
        var y = scaleValue(leapPos[1] * motionScale, minY, maxY, windowHeight, 0);
        //console.log("leap y =", leapPos[1], "(",minY,"/",maxY,") ", "scaled y =", y, "(",0,"/",windowHeight,")");

        //var z = scaleValue(leapPos[2] * motionScale, minZ, maxZ, -depth/2, depth/2);
        var z = leapPos[2];

        var touching = marker.setPosition(x, y, z);
        if(touching){
          lastTouch = marker;
        }
      }

      if(noFingers == 1){
        fingerMarkers[0].updateState();
      }
      else if(noFingers > 1){
        processScrollGesture(fingerMarkers, lastTouch);
      }

      // reset any unmatched markers
      for(; m < noMarkers; m++){
        fingerMarkers[m].reset();
      }
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

       var processMessage = true;

      // On message received
      ws.onmessage = function(event) {
        if(processMessage){
            var obj = JSON.parse(event.data);
            var str = JSON.stringify(obj, undefined, 2);
            updateFingers(obj);
        }
        // do this so we only process every 2nd message to rate limit a bit
        processMessage = !processMessage;
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

      // support up to 2 fingers for now
      var noFingers = 2;
      for(var i=0; i < noFingers; i++){
        fingerMarkers.push( new FingerMarker(paper) );
      }
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
