var gadgets = gadgets || {};

/**
 * @fileoverview Provides remote content retrieval facilities.
 *     Available to every gadget.
 */


gadgets.util = function() {

function parseUrlParams() {
    // Get settings from url, 'hash' takes precedence over 'search' component
    // don't use document.location.hash due to browser differences.
    var query;
    var l = document.location.href;
    var queryIdx = l.indexOf("?");
    var hashIdx = l.indexOf("#");
    if (hashIdx === -1) {
      query = l.substr(queryIdx + 1);
    } else {
      // essentially replaces "#" with "&"
      query = [l.substr(queryIdx + 1, hashIdx - queryIdx - 1), "&",
               l.substr(hashIdx + 1)].join("");
    }
    return query.split("&");
  }

  return {

          /**
     * Utility function for generating an "enum" from an array.
     *
     * @param {Array.<String>} values The values to generate.
     * @return {Map&lt;String,String&gt;} An object with member fields to handle
     *   the enum.
     *
     * @private Implementation detail.
     */
    makeEnum : function (values) {
      var obj = {};
      for (var i = 0, v; v = values[i]; ++i) {
        obj[v] = v;
      }
      return obj;
    },

    /**
     * Creates a closure that is suitable for passing as a callback.
     * Any number of arguments
     * may be passed to the callback;
     * they will be received in the order they are passed in.
     *
     * @param {Object} scope The execution scope; may be null if there is no
     *     need to associate a specific instance of an object with this
     *     callback
     * @param {Function} callback The callback to invoke when this is run;
     *     any arguments passed in will be passed after your initial arguments
     * @param {Object} var_args Initial arguments to be passed to the callback
     *
     * @member gadgets.util
     * @private Implementation detail.
     */
    makeClosure : function (scope, callback, var_args) {
      // arguments isn't a real array, so we copy it into one.
      var tmpArgs = [];
      for (var i = 2, j = arguments.length; i < j; ++i) {
       tmpArgs.push(arguments[i]);
      }
      return function() {
        // append new arguments.
        for (var i = 0, j = arguments.length; i < j; ++i) {
          tmpArgs.push(arguments[i]);
        }
        return callback.apply(scope, tmpArgs);
      };
    }

  }  // * END return gadgets.util
}();    // * END gadgest.util



/**
 * @static
 * @class Provides remote content retrieval functions.
 * @name gadgets.io
 */

gadgets.io = function() {

 /**
   * Handles XHR callback processing.
   *
   * @param {String} url
   * @param {Function} callback
   * @param {Object} params
   * @param {Object} xobj
   */
  function processResponse(url, callback, params, xobj) {
    if (xobj.readyState !== 4) {
      return;
    }
    if (xobj.status !== 200) {
      // TODO Need to work on standardizing errors
      callback({errors : ["Error " + xobj.status] });
      return;
    }
    var txt = xobj.responseText;
    // remove unparseable cruft.
    // TODO: really remove this by eliminating it. It's not any real security
    //    to begin with, and we can solve this problem by using post requests
    //    and / or passing the url in the http headers.
    txt = txt.substr(UNPARSEABLE_CRUFT.length);
    // We are using eval directly here because the outer response comes from a
    // trusted source, and json parsing is slow in IE.
    var data = eval("(" + txt + ")");
    data = data[url];
    var resp = {
     text: data.body,
     errors: []
    };
    switch (params.CONTENT_TYPE) {
      case "JSON":
      case "FEED":
        resp.data = gadgets.json.parse(resp.text);
        if (!resp.data) {
          resp.errors.push("failed to parse JSON");
          resp.data = null;
        }
        break;
      case "DOM":
        var dom;
        if (window.ActiveXObject) {
          dom = new ActiveXObject("Microsoft.XMLDOM");
          dom.async = false;
          dom.validateOnParse = false;
          dom.resolveExternals = false;
          if (!dom.loadXML(resp.text)) {
            resp.errors.push("failed to parse XML");
          } else {
            resp.data = dom;
          }
        } else {
          var parser = new DOMParser();
          dom = parser.parseFromString(resp.text, "text/xml");
          if ("parsererror" === dom.documentElement.nodeName) {
            resp.errors.push("failed to parse XML");
          } else {
            resp.data = dom;
          }
        }
        break;
      default:
        resp.data = resp.text;
        break;
    }
    callback(resp);
  }

  /**
   * Internal facility to create an xhr request.
   */
  function makeXhr() {
    if (window.XMLHttpRequest) {
      return new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      var x = new ActiveXObject("Msxml2.XMLHTTP");
      if (!x) {
        x = new ActiveXObject("Microsoft.XMLHTTP");
      }
      return x;
    }
  }

  var config = {};
  config.jsonProxyUrl = '/makeRequest';

    return {

    /**
     * Converts an input object into a URL-encoded data string.
     * (key=value&amp;...)
     *
     * @param {Object} fields The post fields you wish to encode
     * @param {Boolean} opt_noEscaping An optional parameter specifying whether
     *     to turn off escaping of the parameters. Defaults to false.
     * @return {String} The processed post data in www-form-urlencoded format.
     *
     * @member gadgets.io
     */
    encodeValues : function (fields, opt_noEscaping) {
      var escape = !opt_noEscaping;
      var buf = [];
      var first = false;
      for (var i in fields) if (fields.hasOwnProperty(i)) {
        if (!first) {
          first = true;
        } else {
          buf.push("&");
        }
        buf.push(escape ? encodeURIComponent(i) : i);
        buf.push("=");
        buf.push(escape ? encodeURIComponent(fields[i]) : fields[i]);
      }
      return buf.join("");

    },
    /**
     * Fetches content from the provided URL and feeds that content into the
     * callback function.
     *
     * Example:
     * <pre>
     * gadgets.io.makeRequest(url, fn,
     *    {contentType: gadgets.io.ContentType.FEED});
     * </pre>
     *
     * @param {String} url The URL where the content is located
     * @param {Function} callback The function to call with the data from the
     *     URL once it is fetched
     * @param {Map.&lt;gadgets.io.RequestParameters, Object&gt;} opt_params
     *     Additional
     *     <a href="gadgets.io.RequestParameters.html">parameters</a>
     *     to pass to the request
     *
     * @member gadgets.io
     */

    setProxyURL : function(url) {
        config.jsonProxyUrl = url;
    },

    makeRequest : function (url, callback, opt_params) {
      // TODO: This method also needs to respect all members of
      // gadgets.io.RequestParameters, and validate them.
      var xhr = makeXhr();
      var params = opt_params || {};

      xhr.open("POST", config.jsonProxyUrl, true);
      if (callback) {
        xhr.onreadystatechange = gadgets.util.makeClosure(
            null, processResponse, url, callback, params, xhr);
      }
      // We always send a POST request; we just hide the details.
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      var headers = params.HEADERS || {};
      if (params.METHOD === "POST" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      var postData = {
        url: url,
        httpMethod : params.METHOD || "GET",
        headers: gadgets.io.encodeValues(headers, false),
        postData : params.POST_DATA || "",
      };
      xhr.send(gadgets.io.encodeValues(postData));
    }

    } // * END return gadgets.io
}();     // * END gadgets.io


gadgets.io.RequestParameters = gadgets.util.makeEnum([
  "METHOD",
  "CONTENT_TYPE",
  "POST_DATA",
  "HEADERS",
  "AUTHORIZATION",
  "NUM_ENTRIES",
  "GET_SUMMARIES",
  "REFRESH_INTERVAL"
]);

// PUT, DELETE, and HEAD not supported currently.
gadgets.io.MethodType = gadgets.util.makeEnum([
  "GET", "POST", "PUT", "DELETE", "HEAD"
]);

gadgets.io.ContentType = gadgets.util.makeEnum([
  "TEXT", "DOM", "JSON", "FEED"
]);

gadgets.io.AuthorizationType = gadgets.util.makeEnum([
  "NONE", "SIGNED", "AUTHENTICATED"
]);

