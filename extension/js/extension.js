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
        var sentenceList = [];

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
                        $("#detail").slideUp();
                        $("#sentences").hide();

                        $(".productName").text(val.site.toUpperCase());

                        var categories = val.categories;

                        for (var i = 0; i < categories.length; i++) {

                            //console.log("cat: " + categories[i].category +  " score: " + categories[i].score);

                            var category = categories[i].category;
                            var score = parseFloat(categories[i].score);
                            var colorClass = "";
                            var sentences = "";


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
                            for (var j = 0; j < categories[i].bad.length; j++) {
                                sentences += "<li class=\"red\">" + categories[i].bad[j] + "</li>";
                                //console.log(categories[i].bad[j]);
                            }
                            for (var j = 0; j < categories[i].good.length; j++) {
                                sentences += "<li class=\"green\">" + categories[i].good[j] + "</li>";
                                //console.log(categories[i].good[j]);
                            }
                            for (var j = 0; j < categories[i].neutral.length; j++) {
                                sentences += "<li class=\"neutral\">" + categories[i].neutral[j] + "</li>";
                                //console.log(categories[i].neutral[j]);
                            }

                            sentenceList.push(
                                {
                                    "Id": catId,
                                    "sentences": sentences
                                }
                            );

                        }

                        $("div.score").text(val.score);

                        //$("#scoringWidget").slideDown(600);

                        $("html").height(320);
                        $("body").height(320);

                        break;
                    }
                    else{
                        //msg = "no sites found...";
                    }
                }

                //renderStatus(msg);

                $("div.bar").mouseenter(function () {
                    //Reset all div.bar styles
                    $("div.bar").css({
                        "background-color": "#dddddd",
                        "border": "solid 0px red",
                        "border-bottom": "dotted 1px white"
                    });
                    //$("#sentences").empty();
                    //$("#sentences").hide();


                    //Highlight current car
                    $(this).css({
                        "cursor": "pointer",
                        "background-color": "white",
                        "border": "solid 1px red"
                    });

                    $("#categoryExplanation").empty();
                    var id = $(this).attr("id");
                    var text = getCategoryDescription(id);

                    $("#categoryExplanation").append(text);

                    $("div.bar").mouseleave(function () {
                        $(this).css({
                            "cursor": "pointer",
                            "background-color": "#dddddd",
                            "border": "solid 0px red",
                            "border-bottom": "dotted 1px white"
                        });

                        $("#categoryExplanation").empty();
                        $("#sentences").empty();
                        $("#sentences").hide();


                    });


                });


                $("div.bar").click(function () {

                    var id = $(this).attr("id");

                    $("#sentences").empty();
                    $("#sentences").show();
                    //$("#sentences").slideDown();
                    $("#detail").slideDown();

                    var text = "<ul>";
                    for (var i = 0; i < sentenceList.length; i++) {
                        if (id == sentenceList[i].Id) {
                            text += sentenceList[i].sentences;
                        }
                    }
                    text += "</ul>";

                    $("#sentences").append(text);

                    $("div.bar").off("mouseleave");

                });

            }
        };

        xhr.send();

    });


});


function getCategoryDescription(id) {

    var description = "";
    var categories = [
        {
            "category": "firstpartycollectionuse",
            "description": "First Party Collection/Use"
        },
        {
            "category": "userchoicecontrol",
            "description": "User Choice/Control"
        },
        {
            "category": "useraccesseditanddeletion",
            "description": "User Access, Edit and Deletion"
        },
        {
            "category": "dataretention",
            "description": "Data Retention"
        },
        {
            "category": "datasecurity",
            "description": "Data Security"
        },
        {
            "category": "donottrack",
            "description": "Do Not Track"
        },
        {
            "category": "internationalandspecificaudiences",
            "description": "Specific audiences mentioned in the company/organization’s privacy policy, such as children or international users, for which the company/organization may provide special provisions."
        },
        {
            "category": "other",
            "description": "Aspects not covered in the other categories."
        }
    ];

    for (var i = 0; i < categories.length; i++) {
        if (categories[i].category == id) {
            description = categories[i].description;
            break;
        }
    }

    return description;
}

