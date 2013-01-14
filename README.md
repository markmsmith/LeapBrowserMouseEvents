LeapBrowserMouseEvents
======================

Library to allow using leap to generate mouse move, click and scroll events.

Currently relies on version 0.6.6 of the SDK and the built-in Websocket server.
Update to the 0.7.x SDK is planned, but I intend to turn this into a browser extension first.

To use the bookmarklet
----------------------
Plugin and start the Leap client.
Create a bookmark with the following address:

    javascript:(function(){var script=document.createElement('script');script.src='https://raw.github.com/markmsmith/LeapBrowserMouseEvents/master/leapify.js';document.body.appendChild(script);return void(0);})();

Now when you click the bookmark, the current page will popup an alert to let you know leapify has been loaded and you can use 1-finger to click and drag on things.  Two fingers cause the page to scroll.

The circles that appear represent up to two finger tips.  The inner circle represents the depth of your finger tip, the larger the radius, the further forward your finger is.
When your finger is far enough forward to be considered touching the page, the inner circle will be as large as the outer one and will turn green.
The idea is that the outer circle vs in the inner circle gives you feedback on if you're close enough or not for a touch.

When you first start touching, a mouse down event is fired.  If you move while touching, mouse move events are fired.
When you stop touching, a mouse up event is fired and (if you're over the same page element as when you first touched), a click event is fired.  This allows drag & drop, as well as cancelling a click by moving off something, just like you can do with a mouse.

For two-finger scrolling, when two (or more) fingers are seen and one or more are far enough forward to be 'touching' the screen, the position of the last finger is used to scroll the visible area of the page.
