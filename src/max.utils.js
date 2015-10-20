/**
 * @fileoverview Provides support functions not directly
 *               related to UI construction
 **/
'use strict';
var max = max || {};
max.utils = function() {
    var settings = {};
    return {
        setSettings: function(maxui_settings) {
            settings = maxui_settings;
        },
        /**
         *    Stops propagation of an event, to avoid arrows, esc, enter keys
         *    bubbling to an input, Used in conjunction with the users prediction box
         *
         *    @param {Event} e       The DOM event we want to freeze
         **/
        freezeEvent: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            return false;
        },
        /**  Strips whitespace at the beggining and end of a string and optionaly between
         *
         *    @param {String} s       A text that may contain whitespaces
         *    @param {Boolean} multi  If true, reduces multiple consecutive whitespaces to one
         **/
        normalizeWhiteSpace: function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        },
        /**  Searches for urls and hashtags in text and transforms to hyperlinks
         *    @param {String} text     String containing 0 or more valid links embedded with any other text
         **/
        formatText: function(text) {
            if (text) {
                // Format hyperlinks
                text = text.replace(/((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, function(url) {
                    var full_url = url;
                    if (!full_url.match('^https?:\/\/')) {
                        full_url = 'http://' + full_url;
                    }
                    return '<a href="' + full_url + '">' + url + '</a>';
                });
                // Format hashtags links
                text = text.replace(/(\s|^)#{1}(\w+)/gi, function() {
                    var pre = arguments[1];
                    var tag = arguments[2];
                    return '<a class="maxui-hashtag" href="#" value="' + tag + '">' + pre + '#' + tag + '</a>';
                });
                // Format line breaks
                text = text.replace(/\r?\n/gi, '<br/>');
            }
            return text;
        },
        /**  Identifies cors funcionalities and returns a boolean
         indicating wheter the browser is or isn't CORS capable
    **/
        isCORSCapable: function() {
            var xhrObject = new XMLHttpRequest();
            //check if the XHR tobject has CORS functionalities
            if (xhrObject.withCredentials !== undefined) {
                return true;
            } else {
                return false;
            }
        },
        /**  Removes elements from array by value
         **/
        removeValueFrom: function(arr) {
            var what, a = arguments,
                L = a.length,
                ax;
            while (L > 1 && arr.length) {
                what = a[--L];
                while ((ax = arr.indexOf(what)) !== -1) {
                    arr.splice(ax, 1);
                }
            }
            return arr;
        },
        /**  Returns the numner of milliseconds since epoch
         **/
        timestamp: function() {
            var date = new Date();
            return date / 1;
        },
        /**  Returns current Date & Time in rfc339 format
         **/
        now: function() {
            var now = new Date();
            return now;
        },
        /**  Formats a date in rfc3339 format
         **/
        rfc3339: function(date) {
            function pad(n) {
                return n < 10 ? '0' + n : n;
            }
            return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) + 'T' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + 'Z';
        },
        /**  Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
         *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
         **/
        formatDate: function(timestamp, lang) {
            var today = new Date();
            var formatted = '';
            var prefix = '';
            var thisdate = new Date();
            var match = timestamp.match("^([-+]?)(\\d{4,})(?:-?(\\d{2})(?:-?(\\d{2})" + "(?:[Tt ](\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:\\.(\\d{1,3})(?:\\d+)?)?)?)?" + "(?:[Zz]|(?:([-+])(\\d{2})(?::?(\\d{2}))?)?)?)?)?)?$");
            if (match) {
                for (var ints = [2, 3, 4, 5, 6, 7, 8, 10, 11], i = ints.length - 1; i >= 0; --i) {
                    match[ints[i]] = (typeof match[ints[i]] !== "undefined" && match[ints[i]].length > 0) ? parseInt(match[ints[i]], 10) : 0;
                }
                if (match[1] === '-') { // BC/AD
                    match[2] *= -1;
                }
                var ms = Date.UTC(match[2], // Y
                    match[3] - 1, // M
                    match[4], // D
                    match[5], // h
                    match[6], // m
                    match[7], // s
                    match[8] // ms
                );
                if (typeof match[9] !== "undefined" && match[9].length > 0) { // offset
                    ms += (match[9] === '+' ? -1 : 1) * (match[10] * 3600 * 1000 + match[11] * 60 * 1000); // oh om
                }
                if (match[2] >= 0 && match[2] <= 99) { // 1-99 AD
                    ms -= 59958144000000;
                }
                var a_day = 1000 * 60 * 60 * 24; // ms * seconds * minutes * hours
                var three_days = a_day * 3;
                var a_year = a_day * 365;
                thisdate.setTime(ms);
                // Dates in the last three days get a humanized date
                if ((today.getTime() - ms) < three_days) {
                    formatted = jQuery.easydate.format_date(thisdate, lang);
                    // Dates between 3 days and a year, get a 'X of MMMMM', localized
                    // into its language
                } else {
                    if (lang === 'en') {
                        formatted = '{0} {1}'.format(match[4], settings.literals.months[match[3] - 1]);
                    } else if (lang === 'es') {
                        formatted = '{0} de {1}'.format(match[4], settings.literals.months[match[3] - 1]);
                    } else if (lang === 'ca') {
                        prefix = 'de ';
                        if (match[3] === 4 || match[3] === 8 || match[3] === 10) {
                            prefix = "d'";
                        }
                        formatted = '{0} {2}{1}'.format(match[4], settings.literals.months[match[3] - 1], prefix);
                    }
                    // Finally, show dd/mm/yyy if post is more than one year old
                    if ((today.getTime() - ms) > a_year) {
                        formatted = '{0}/{1}/{2}'.format(match[4], match[3], match[2]);
                    }
                }
                return formatted;
            } else {
                return null;
            }
        },
        /**  Returns an utf8 decoded string
         *    @param {String} str_data    an utf-8 String
         **/
        utf8_decode: function(str_data) {
            // Converts a UTF-8 encoded string to ISO-8859-1
            //
            // version: 1109.2015
            // discuss at: http://phpjs.org/functions/utf8_decode
            // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
            // +      input by: Aman Gupta
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +   improved by: Norman "zEh" Fuchs
            // +   bugfixed by: hitwork
            // +   bugfixed by: Onno Marsman
            // +      input by: Brett Zamir (http://brett-zamir.me)
            // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // *     example 1: utf8_decode('Kevin van Zonneveld');
            // *     returns 1: 'Kevin van Zonneveld'
            var tmp_arr = [],
                i = 0,
                ac = 0,
                c1 = 0,
                c2 = 0,
                c3 = 0;
            str_data += '';
            while (i < str_data.length) {
                c1 = str_data.charCodeAt(i);
                if (c1 < 128) {
                    tmp_arr[ac++] = String.fromCharCode(c1);
                    i++;
                } else if (c1 > 191 && c1 < 224) {
                    c2 = str_data.charCodeAt(i + 1);
                    tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = str_data.charCodeAt(i + 1);
                    c3 = str_data.charCodeAt(i + 2);
                    tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return tmp_arr.join('');
        },
        sha1: function(msg) {
            function rotate_left(n, s) {
                var t4 = (n << s) | (n >>> (32 - s));
                return t4;
            }

            function cvt_hex(val) {
                var str = "";
                var i;
                var v;
                for (i = 7; i >= 0; i--) {
                    v = (val >>> (i * 4)) & 0x0f;
                    str += v.toString(16);
                }
                return str;
            }

            function utf8Encode(string) {
                string = string.replace(/\r\n/g, "\n");
                var utftext = "";
                for (var n = 0; n < string.length; n++) {
                    var c = string.charCodeAt(n);
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    } else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            }
            var blockstart;
            var i, j;
            var W = new Array(80);
            var H0 = 0x67452301;
            var H1 = 0xEFCDAB89;
            var H2 = 0x98BADCFE;
            var H3 = 0x10325476;
            var H4 = 0xC3D2E1F0;
            var A, B, C, D, E;
            var temp;
            msg = utf8Encode(msg);
            var msg_len = msg.length;
            var word_array = [];
            for (i = 0; i < msg_len - 3; i += 4) {
                j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 | msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
                word_array.push(j);
            }
            switch (msg_len % 4) {
                case 0:
                    i = 0x080000000;
                    break;
                case 1:
                    i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
                    break;
                case 2:
                    i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
                    break;
                case 3:
                    i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
                    break;
            }
            word_array.push(i);
            while ((word_array.length % 16) !== 14) {
                word_array.push(0);
            }
            word_array.push(msg_len >>> 29);
            word_array.push((msg_len << 3) & 0x0ffffffff);
            for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
                for (i = 0; i < 16; i++) {
                    W[i] = word_array[blockstart + i];
                }
                for (i = 16; i <= 79; i++) {
                    W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
                }
                A = H0;
                B = H1;
                C = H2;
                D = H3;
                E = H4;
                for (i = 0; i <= 19; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 20; i <= 39; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 40; i <= 59; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 60; i <= 79; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                H0 = (H0 + A) & 0x0ffffffff;
                H1 = (H1 + B) & 0x0ffffffff;
                H2 = (H2 + C) & 0x0ffffffff;
                H3 = (H3 + D) & 0x0ffffffff;
                H4 = (H4 + E) & 0x0ffffffff;
            }
            temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
            return temp.toLowerCase();
        }
    };
};
