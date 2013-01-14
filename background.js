(function () {
    var leapify = {

        toggleOnOff: (function () {

            var activated = false;

            var refreshTab = function () {
                chrome.tabs.getSelected(null, function (tab) {
                    chrome.tabs.sendMessage(tab.id, {refresh:true});
                });
            };

            var toggleOnOff = function () {
                if (activated) {
                    activated = false;
                    // chrome.browserAction.setIcon({path:"icon_off.png"});
                } else {
                    activated = true;
                    // chrome.browserAction.setIcon({path:"icon_on.png"});
                }
                refreshTab();
            };

            chrome.extension.onMessage.addListener(
                function (request, sender, sendResponse) {
                    if (request.checkActivated) {
                        sendResponse({
                            isActivated: activated
                        });
                    }
                }
            );

            return toggleOnOff;

        })()

    };

    chrome.browserAction.onClicked.addListener(leapify.toggleOnOff);

})();

