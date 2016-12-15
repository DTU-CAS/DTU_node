/*
 * Makes a geojson show a table of attributes on click
 * Author: NIRAS - Casper Fibæk
 */

 function editPanel(feature){
   console.log(feature);
   $("#interface").prepend("<div class='infoEdit'><table id='infoTable'></table></div>");

// change this to a show/hide function
   var tr = $("<table class='attributes'></table>");
   for (var key in feature.properties) {
     if (feature.properties.hasOwnProperty(key)) {
       // What should be editable
       if(key === "Type" ||
          key === "Status"){
         $("#infoTable").append("<tr class='editRow hoverPointer'><td type='key' ref='"+ key + "'>" + key + "</td><td type='attribute' contenteditable='false'>" + String(feature.properties[key] + "</td></tr>"));
       } else if (
          key === "Navn"
       ){
         $("#infoTable").append("<tr class='editRow'><td type='key' ref='"+ key + "'>" + key + "</td><td type='attribute' contenteditable='true'>" + String(feature.properties[key] + "</td></tr>"));
       }
     }
   }

   $(".editRow").each(function(){
     var row = $(this).children();
     for(var i = 0; i < row.length; i++){
       if($(row[i]).attr("ref") === "Status"){
         $(row[i]).siblings().click(function(){
           $("#interface").prepend("<div class='slide-menu'><ul></ul></div>");

           $(".slide-menu > ul").append(
             "<li>Igangsat</li>" +
             "<li>Afsluttet</li>"
           );

           var toChange = $(this);

           $(".slide-menu > ul > li").click(function(){
             var text = $(this).text();
             $(toChange).text(text);
           });

         });
       } else if ($(row[i]).attr("ref") === "Type"){
         $(row[i]).siblings().click(function(){
           $("#interface").prepend("<div class='slide-menu'><ul></ul></div>");

           $(".slide-menu > ul").append(
             "<li>Byggeri</li>" +
             "<li>Parkering</li>" +
             "<li>Kina</li>" +
             "<li>Trump</li>"
           );

           var toChange = $(this);

           $(".slide-menu > ul > li").click(function(){
             var text = $(this).text();
             $(toChange).text(text);
           });

         });
       }
     }
   });

 }

 function addRow(key, attribute){
   return "<tr class='table-row'>" +
          "<td class='rowName'>" + key + "</td>" +
          "<td>" + attribute + "</td>" + "</tr>";
 }

function infoPanel(obj, edit){
  var table = "<div id='objTable'>" + "<table class='table'>";

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if(key !== "CG_ID" &&
         key !== "ProjektID" &&
         key.indexOf("label") === -1 &&
         key.indexOf("Label") === -1){

          // if(key !== "P_pladser" && (obj[key] === null || obj[key] === 'null')){
            table += addRow(key, obj[key]);
          // }
      }
    }
  }

  if(edit === false){
    table +=
    "</table>" + "<div id='popup-button-wrap'>" +
        "<div id='copyGeom' class='disabled-edit unselectable-text'><p>Kopier<i class='fa fa-copy table-edit' aria-hidden='true'></i></p></div>" +
    "</div>";
  } else {
      table +=
      "</table>" + "<div id='popup-button-wrap'>" +
          "<div id='editGeom' class='disabled-edit unselectable-text'><p>Rediger<i class='fa fa-pencil table-edit' aria-hidden='true'></i></p></div>" +
          "<div id='deleteGeom' class='disabled-edit unselectable-text'><p>Slet<i class='fa fa-trash table-delete' aria-hidden='true'></i></p></div>" +
      "</div>";
  }

  return table;
}
