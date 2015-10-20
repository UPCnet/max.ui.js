/*global _MAXUI */
//
// Loader function for max.ui.js
//
// The timeout is set to assure that the code will be invoked at the end of the file load
// This snippet also assures that maxui will be instantiated only once.
// This snippet assumes that a _MAXUI.onReady function is defined by the api consumer and calls it as a final step
// of async loading of the maxui main file.
// In the example.js file lives the code that the api consumer has to insert in the host application
//
'use strict';
window.setTimeout(function() {
    if (window._MAXUI && window._MAXUI.onReady && !window._MAXUI.hasRun) {
        window._MAXUI.hasRun = true;
        _MAXUI.onReady();
    }
}, 0);
