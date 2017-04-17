/**
 * Created by Jun on 4/8/17.
 */

$( document ).ready(function() {

    $("#scoringWidget").hide();
    $("#categoryExplaination").empty();
    $("#sentences").empty();




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

                    var catId = category.replace(/\W/g,'').toLowerCase();

                    var barText = "<div class=\"bar\" id=\"" + catId +"\"><div class=\"segments\">";
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



        $("div.bar").mouseenter(function () {
            //Reset all div.bar styles
            $("div.bar").css( {
                "background-color":"#dddddd",
                "border":"solid 0px red",
                "border-bottom":"dotted 1px white"
            });
            $("#sentences").empty();


            //Highlight current car
            $(this).css( {
                "cursor": "pointer",
                "background-color":"white",
                "border":"solid 1px red"
            });

            $("#categoryExplaination").empty();

            var text = "";
            var id = $(this).attr("id");

            for(var i=0; i<10;i++){
                text +=  id + "---";
            }

            $("#categoryExplaination").append(text);

            $("div.bar").mouseleave(function () {
                $(this).css( {
                    "cursor": "pointer",
                    "background-color":"#dddddd",
                    "border":"solid 0px red",
                    "border-bottom":"dotted 1px white"
                });

                $("#categoryExplaination").empty();
                $("#sentences").empty();

            });


        });




        $("div.bar").click(function(){

            var id = $(this).attr("id");

            $("#sentences").empty();
            var text = "<ul>";

            for(var i=0; i<50;i++){
                text +=  "<li>" + id + "</li>";
            }

            text += "</ul>";

            $("#sentences").append(text);

            $("div.bar").off("mouseleave");

        });

    });

});


