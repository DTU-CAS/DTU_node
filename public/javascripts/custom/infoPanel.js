/*
 * Makes a geojson show a table of attributes on click
 * Author: NIRAS - Casper Fibæk
 */

 function editPanel(feature){
   console.log(feature);
   $("#interface").prepend("<div class='infoEdit'><table id='infoTable'></table></div>");
   var tr = $("<table class='attributes'></table>");
   for (var key in feature.properties) {
     if (feature.properties.hasOwnProperty(key)) {
       // What should be editable
       if(key === "Type" ||
          key === "Navn" ||
          key === "Status"){
         $("#infoTable").append("<tr><td type='key' ref='"+ key + "'>" + key + "</td><td type='attribute' contenteditable='true'>" + String(feature.properties[key] + "</td></tr>"));
       }
     }
   }
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
        table += addRow(key, obj[key]);
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
