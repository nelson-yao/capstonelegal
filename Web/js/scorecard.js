/**
 * Created by Jun on 4/8/17.
 */

$(document).ready(function () {

    $("#scoringWidget").hide();
    $("#categoryExplanation").empty();
    $("#sentences").empty();
    $("#sentences").hide();

    //Press enter to search
    $("#url").keypress(function (e) {
        if (e.which == 13) {
            //prevent refreshing page when ENTER is pressed
            e.preventDefault();
            //Simulate click
            $('#analyze').click();
        }
    });

    //Load score DB to local storage if it had not been loaded
    loadScore();

});


$("#analyze").click(function () {

    $(this).blur();

    $("#scoringWidget").hide();

    var url = $("#url").val().toLowerCase();
    var data = JSON.parse(LZString.decompress(localStorage.getItem("scoreDB")));

    //$.getJSON("http://people.ischool.berkeley.edu/~jun.luo/capstone/All_scores.json", function (data) {
    //$.getJSON("http://localhost:8000/All_scores.json", function (data) {

    var sentenceList = [];

    $.each(data, function (key, val) {
        //console.log(key, val)

        var site = val.site.toLowerCase();

        if (site.indexOf(url) >= 0) {

            //console.log("found " + val.score);
            $("div.labels").empty();
            $("div.bars").empty();

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
                var barLength = Math.round(280 * parseFloat(score));
                //console.log(barLength + "px");

                barText += "<div class=\"segment " + colorClass + "\" style=\"width: " + barLength + "px\"></div>";
                barText += "</div></div>";
                $("div.bars").append(barText);


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
            $("#scoringWidget").slideDown(600);

            $("#sentences").empty();
            $("#sentences").hide();
            $("#categoryExplanation").empty();

            //break out of $.each loop once a matching site is found
            return false;
        }
    });


    $("div.bar").mouseenter(function () {
        //Reset all div.bar styles
        $("div.bar").css({
            "background-color": "#dddddd",
            "border": "solid 0px red",
            "border-bottom": "dotted 1px white"
        });
        $("#sentences").empty();
        $("#sentences").hide();


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


        var demoRowClass = $("#demo-search").attr('class');
        if(demoRowClass == "col-md-12"){
            $("#demo-search").removeClass().addClass("col-md-6");
            $("#demo-sentences").removeClass().addClass("col-md-6");
        }


        var id = $(this).attr("id");

        $("#sentences").empty();
        $("#sentences").slideDown();

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

    //});

});

function getCategoryDescription(id) {

    var description = "";
    var categories = [
        {
            "category": "firstpartycollectionuse",
            "description": "Privacy practice describing data collection or data use by the company/organization owning the website or mobile app."
        },
        {
            "category": "userchoicecontrol",
            "description": "Practice that describes general choices and control options available to users."
        },
        {
            "category": "useraccesseditanddeletion",
            "description": "Privacy practice that allows users to access, edit or delete the data that the company/organization has about them."
        },
        {
            "category": "dataretention",
            "description": "Privacy practice specifying the retention period for collected user information."
        },
        {
            "category": "datasecurity",
            "description": "Practice that describes how users’ information is secured and protected, e.g., from confidentiality, integrity, or availability breaches. Common practices include the encryption of stored data and online communications."
        },
        {
            "category": "donottrack",
            "description": "Practices that explain if and how Do Not Track signals (DNT) for online tracking and advertising are honored."
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


function loadScore() {
    var scoreData = localStorage.getItem("scoreDB");
    var scoredSites = [];

    if (scoreData) {
        //console.log("found in local storage!");

        //Get the list of sites and add "autocomplete" to the search box
        var data = JSON.parse(LZString.decompress(scoreData));
        $.each(data, function (k, v) {
            scoredSites.push(v.site);
        });

    }
    else {

        var jsonUrl = location.href + "all_scores.json";
        //console.log(jsonUrl);
        //console.log('No results locally, make a ajax call...');

        //$.getJSON("http://people.ischool.berkeley.edu/~jun.luo/capstone/All_scores.json", function (data) {
        $.getJSON(jsonUrl, function (data) {

            $.each(data, function (k, v) {
                scoredSites.push(v.site);
            });


            var localData = JSON.stringify(data);

            //console.log("before " + localData.length);
            //var t_start = new Date().getTime();

            var localDataCompressed = LZString.compress(localData);
            //console.log("after " + localDataCompressed.length);
            //var t_end = new Date().getTime();
            //console.log("compression time " + (t_end-t_start));

            localStorage.setItem("scoreDB", localDataCompressed);
            //console.log("set local scoreDB " + localDataCompressed.length);
        });
    }

    $("#url").autocomplete({
        source: scoredSites
    });
}