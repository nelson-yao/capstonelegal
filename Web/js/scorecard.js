/**
 * Created by Jun on 4/8/17.
 */

$( document ).ready(function() {

    $("#scoringWidget").hide();


});

$("#analyze").click(function() {

    $(this).blur();

    $("#scoringWidget").hide();
    var url = $("#url").val();

    $.getJSON( "http://localhost:8000/scoredb.json", function( data ) {

        $.each( data, function( key, val ) {
            //console.log(key, val)

            if(val.site.indexOf(url) >=0){
                //console.log("found " + val.score);
                $("div.labels").empty();
                $("div.bars").empty();

                var siteTitle = val.site + " Privacy Policy Score:";
                $(".productName").text(siteTitle);

                var categories = val.categories;
                for(var i=0;i<categories.length;i++){
                    //console.log("cat: " + categories[i].category +  " score: " + categories[i].score);

                    var category = categories[i].category;
                    var score = parseFloat(categories[i].score);
                    var colorClass = "";

                    if(score>=0.9){
                        colorClass = "scoreGreen";
                    }
                    else if(score >=0.75 && score <0.9){
                        colorClass = "scoreYellow";
                    }
                    else{
                        colorClass = "scoreRed";
                    }

                    $("div.labels").append("<div class=\"sclabel\">" + category +"</div>");

                    var barText = "<div class=\"bar\"><div class=\"segments\">";
                    var barLength = Math.round( 280 * parseFloat(score));
                    //console.log(barLength + "px");

                    barText += "<div class=\"segment " + colorClass + "\" style=\"width: " + barLength + "px\"></div>";
                    barText += "</div></div>";
                    $("div.bars").append(barText);
                }

                $("div.score").text(val.score);
                $("#scoringWidget").slideDown(600);
            }
        });

    });

});