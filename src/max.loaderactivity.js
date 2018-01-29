/*global _MAXUI_Activity */
//
// Loader function for max.uichat.js
//
// The timeout is set to assure that the code will be invoked at the end of the file load
// This snippet also assures that maxui will be instantiated only once.
// This snippet assumes that a _MAXUI.onReady function is defined by the api consumer and calls it as a final step
// of async loading of the maxui main file.
// In the example.js file lives the code that the api consumer has to insert in the host application
//
'use strict';
window.setTimeout(function() {
    if (window._MAXUI_Activity && window._MAXUI_Activity.onReady && !window._MAXUI_Activity.hasRun) {
        window._MAXUI_Activity.hasRun = true;
        _MAXUI_Activity.onReady();
    }
}, 0);
