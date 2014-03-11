(function(jQuery)
{
    /*

    Trimmed down to only the necessary bits

     * jQuery EasyDate 0.2.4 (jQueryRev: 54 jQuery)
     * Copyright (c) 2009 Parsha Pourkhomami (parshap@gmail.com)
     * Licensed under the MIT license.
     */

    jQuery.easydate = { };
    jQuery.easydate.locales = { };
    jQuery.easydate.locales.en = {
        "future_format": "%s %t",
        "past_format": "%t %s",
        "second": "second",
        "seconds": "seconds",
        "minute": "minute",
        "minutes": "minutes",
        "hour": "hour",
        "hours": "hours",
        "day": "day",
        "days": "days",
        "week": "week",
        "weeks": "weeks",
        "month": "month",
        "months": "months",
        "year": "year",
        "years": "years",
        "yesterday": "yesterday",
        "tomorrow": "tomorrow",
        "now": "just now",
        "ago": "ago",
        "in": "in"
    };

    jQuery.easydate.locales.ca = {
        "future_format": "%s %t",
        "past_format": "%s %t",
        "second": "segon",
        "seconds": "segons",
        "minute": "minut",
        "minutes": "minuts",
        "hour": "hora",
        "hours": "hores",
        "day": "dia",
        "days": "dies",
        "week": "setmana",
        "weeks": "setmanes",
        "month": "mes",
        "months": "mesos",
        "year": "any",
        "years": "anys",
        "yesterday": "ahir",
        "tomorrow": "demà",
        "now": "fa un moment",
        "ago": "fa",
        "in": "en"
    };


    jQuery.easydate.locales.es= {
        "future_format": "%s %t",
        "past_format": "%s %t",
        "second": "segundo",
        "seconds": "segundos",
        "minute": "minuto",
        "minutes": "minutos",
        "hour": "hora",
        "hours": "horas",
        "day": "dia",
        "days": "dias",
        "week": "semana",
        "weeks": "semanas",
        "month": "mes",
        "months": "meses",
        "year": "año",
        "years": "años",
        "yesterday": "ayer",
        "tomorrow": "mañana",
        "now": "hace un instante",
        "ago": "hace",
        "in": "en"
    };

    var defaults = {
        live: true,
        set_title: true,
        format_future: true,
        format_past: true,
        units: [
            { name: "now", limit: 5 },
            { name: "second", limit: 60, in_seconds: 1 },
            { name: "minute", limit: 3600, in_seconds: 60 },
            { name: "hour", limit: 86400, in_seconds: 3600  },
            { name: "yesterday", limit: 172800, past_only: true },
            { name: "tomorrow", limit: 172800, future_only: true },
            { name: "day", limit: 604800, in_seconds: 86400 },
            { name: "week", limit: 2629743, in_seconds: 604800  },
            { name: "month", limit: 31556926, in_seconds: 2629743 },
            { name: "year", limit: Infinity, in_seconds: 31556926 }
        ],
        uneasy_format: function(date)
        {
            return date.toLocaleDateString();
        },
        locale: jQuery.easydate.locales.en
    };

    function __(str, value, settings)
    {
        if(!isNaN(value) && value != 1)
            str = str + "s";
        return settings.locale[str] || str;
    }



    // Makes all future time calculations relative to the given date argument
    // instead of the system clock. The date argument can be a JavaScript Date
    // object or a RFC 1123 valid timestamp string. This is useful for
    // synchronizing the user's clock with a server-side clock.

    // Formats a Date object to a human-readable localized string.
    jQuery.easydate.format_date = function(date, language)
    {
        var settings = jQuery.extend({}, defaults);
        settings.locale = jQuery.easydate.locales[language]
        var now = new Date();
        var diff = (( now.getTime() - date.getTime()) / 1000);
        var diff_abs = Math.abs(diff);

        if(isNaN(diff))
          {

            return;

           }
        // Return if we shouldn't format this date because it is in the past
        // or future and our setting does not allow it.
        if((!settings.format_future && diff < 0) ||
            (!settings.format_past && diff > 0))
            return;

        for(var i in settings.units)
        {
            var unit = settings.units[i];

            // Skip this unit if it's for past dates only and this is a future
            // date, or if it's for future dates only and this is a past date.
            if((unit.past_only && diff < 0) || (unit.future_only && diff > 0))
                continue;

            if(diff_abs < unit.limit)
            {
                // Case for units that are not really measurement units - e.g.,
                // "yesterday" or "now".
                if(isNaN(unit.in_seconds))
                    return __(unit.name, NaN, settings);

                var val = diff_abs / unit.in_seconds;
                val = Math.round(val);
                var format_string;
                if(diff < 0)
                    format_string = __("future_format", NaN, settings)
                        .replace("%s", __("in", NaN, settings))
                else
                    format_string = __("past_format", NaN, settings)
                        .replace("%s", __("ago", NaN, settings))
                return format_string
                    .replace("%t", val + " " + __(unit.name, val, settings));
            }
        }

        // The date does not fall into any units' limits - use uneasy format.
        return settings.uneasy_format(date);
    }

})(jQuery);
