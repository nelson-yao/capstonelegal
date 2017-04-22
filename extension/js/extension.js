// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });

    // Most methods of the Chrome extension APIs are asynchronous. This means that
    // you CANNOT do something like this:
    //
    // var url;
    // chrome.tabs.query(queryInfo, function(tabs) {
    //   url = tabs[0].url;
    // });
    // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}


function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function () {
    getCurrentTabUrl(function (url) {

        //renderStatus('Current URL is ' + url);
        var msg = "";

        url = url.toLocaleLowerCase();

        var xhr = new XMLHttpRequest;
        xhr.open("GET", chrome.runtime.getURL("all_scores.json"), false);

        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {

                var scores = JSON.parse(xhr.responseText);
                var sites = "";

                for(var i=0;i<scores.length;i++){

                    var site = scores[i].site.toLocaleLowerCase();

                    //renderStatus(url + "\n" + site);
                    if(url.indexOf(site)>0){
                        //msg = site + " is found!";

                        var val = scores[i];

                        $("div.labels").empty();
                        $("div.bars").empty();

                        $(".productName").text(val.site.toUpperCase());

                        var categories = val.categories;

                        for (var i = 0; i < categories.length; i++) {

                            //console.log("cat: " + categories[i].category +  " score: " + categories[i].score);

                            var category = categories[i].category;
                            var score = parseFloat(categories[i].score);
                            var colorClass = "";


                            if (score >= 0.75) {
                                colorClass = "scoreGreen";
                            }
                            else if (score >= 0.5 && score < 0.75) {
                                colorClass = "scoreYellow";
                            }
                            else {
                                colorClass = "scoreRed";
                            }

                            $("div.labels").append("<div class=\"sclabel\">" + category + "</div>");

                            var catId = category.replace(/\W/g, '').toLowerCase();

                            var barText = "<div class=\"bar\" id=\"" + catId + "\"><div class=\"segments\">";
                            var barLength = Math.round(110 * parseFloat(score));
                            //console.log(barLength + "px");

                            barText += "<div class=\"segment " + colorClass + "\" style=\"width: " + barLength + "px\"></div>";
                            barText += "</div></div>";
                            $("div.bars").append(barText);

                            //msg += category + "\n";
                        }

                        $("div.score").text(val.score);

                        //$("#scoringWidget").slideDown(600);

                        break;
                    }
                    else{
                        //msg = "no sites found...";
                    }
                }

                //renderStatus(msg);
            }
        };

        xhr.send();

    });


});
