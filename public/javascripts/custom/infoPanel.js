/*
 * Makes a geojson show a table of attributes on click
 * Author: NIRAS - Casper Fibæk
 */

 function eventJSON(geoJSON, style, highlight, editable){
   var eventLayer = L.geoJSON(geoJSON, {"style": style})
     .on('click', function(e){

       var layer = this.getLayer(e.layer._leaflet_id),
           feature = layer.feature,
           latLng = e.latlng;
           edit = editable;

       map.panTo(latLng);

       function renderList(liItem){
         var list = "";
          for(var i = 0; i < liItem.length; i++){
            list += "<li>" + liItem[i] + "</li>";
          }
          return list;
        }

        var typeList = ["BYR", "BPH", "ANL", "PKH", "AVT", "GSA", "BYO"].sort();

      if(e.originalEvent.ctrlKey === false){
        L.popup({closeButton: false})
        .setLatLng(latLng)
        .setContent(infoPanel(feature.properties, edit, renderList(typeList)))
        .openOn(map);

       if(edit === true){
         if(layer.feature.properties.Type){
           var square1 = $("#objTable > table > tbody > tr:nth-child(2) > td:nth-child(1)");
           var square2 = $("#objTable > table > tbody > tr:nth-child(2) > td:nth-child(2)");
           $(square1).addClass("typeRow");
           $(square2).addClass("dropDown-selector").html(
             "<div class='dropDown unselectable-text'>" + "<p>" + layer.feature.properties.Type +
             "&nbsp;&nbsp;&nbsp;" + "<i class='fa fa-caret-down' aria-hidden='true'></i></p>" +
             "<div class='dropDown-content'><ul>" +
                renderList(typeList) +
             "</ul></div>" +
             "</div>"
           );
         }

         $(".dropDown-selector").click(function(){
           $(".dropDown-content").toggleClass("show");
         });

         $(".dropDown-content > ul > li").click(function(){
           layer.feature.properties.Type = $(this).text();
            $(".dropDown > p").html($(this).text() +
              "&nbsp;&nbsp;&nbsp;" +
              "<i class='fa fa-caret-down' aria-hidden='true'></i></p>"
            );
         });

         $(".leaflet-popup").css("width", "284px");

        if(layer.editEnabled() === true){
          $("#editGeom").removeClass("disabled-edit").addClass("enabled-edit");
          $("#editGeom").first().text("Gem geometri");
        }

         $("#editGeom").click(function(e){
           if($(this).hasClass("disabled-edit")){
             layer.enableEdit();
             $(this).removeClass("disabled-edit").addClass("enabled-edit");
             $(this).first().text("Gem geometri");
             map.closePopup();
           } else {
             layer.toggleEdit();
             $(this).removeClass("enabled-edit").addClass("disabled-edit");
             $(this).first().text("Rediger");
           }
         });

         $("#deleteGeom").click(function(){
           map.removeLayer(layer);
           map.closePopup();
         });
       }}
     })
     .on('mouseover', function(e){
       var feature = this.getLayer(e.layer._leaflet_id);
       feature.setStyle(highlight);
     })
     .on('mouseout', function(e){
       var feature = this.getLayer(e.layer._leaflet_id);
       feature.setStyle(style);
     });

    return eventLayer;
 }

 function addRow(key, attribute){
   return "<tr class='table-row'>" +
          "<td class='rowName'>" + key + "</td>" +
          "<td>" + attribute + "</td>" + "</tr>";
 }

function infoPanel(obj, edit, list){
  var table = "<div id='objTable'>" + "<table class='table'>";

  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    table += addRow(keys[i], obj[keys[i]]);
  }

  if(edit === false){
    table += "</table></div>";
  } else {
    if(!obj.Type){
      table +=
        "<tr class='table-row'>" +
        "<td class='rowName typeRow'>" + "Type" + "</td>" +
        "<td class='dropDown-selector'>" +
          "<div class='dropDown unselectable-text'>" + "<p>Vælg type" + "&nbsp;&nbsp;&nbsp;" +
          "<i class='fa fa-caret-down' aria-hidden='true'></i></p>" +
          "<div class='dropDown-content'><ul>" +
          list +
          "</ul></div>" +
          "</div>" +
          "</td>" + "</tr>";
    }
      table +=
      "</table>" + "<div id='popup-button-wrap'>" +
          "<div id='editGeom' class='disabled-edit unselectable-text'><p>Rediger<i class='fa fa-pencil table-edit' aria-hidden='true'></i></p></div>" +
          "<div id='deleteGeom' class='disabled-edit unselectable-text'><p>Slet<i class='fa fa-trash table-delete' aria-hidden='true'></i></p></div>" +
      "</div>";
  }

  return table;
}
