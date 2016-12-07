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

       if($(".infoEdit").length > 0){
         $("#infoTable > tr > td[type='key']").each(function() {
           console.log($(this).text());
          if($(this).siblings().text() === "null" || $(this).siblings().text().length === 0){
            layer.feature.properties[$(this).attr("ref")] = null;
          } else {
            layer.feature.properties[$(this).attr("ref")] = $(this).siblings().text();
          }
        });
      }

      L.popup({closeButton: false})
      .setLatLng(latLng)
      .setContent(infoPanel(feature.properties, edit))
      .openOn(map);

      $(".leaflet-popup").css("width", "284px");

     if(edit === true){
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
           editPanel(feature);
         } else {
           layer.toggleEdit();
           $(this).removeClass("enabled-edit").addClass("disabled-edit");
           $(this).first().text("Rediger");

           $("#infoTable > tr > td[type='key']").each(function() {
            if($(this).siblings().text() === "null" || $(this).siblings().text().length === 0){
              layer.feature.properties[$(this).attr("ref")] = null;
            } else {
              layer.feature.properties[$(this).attr("ref")] = $(this).siblings().text();
            }
          });

           var updateObj = {};
           for(var key in layer.feature.properties){
            if (layer.feature.properties.hasOwnProperty(key)) {
              if(layer.feature.properties[key] !== null){
                updateObj[key] = layer.feature.properties[key];
              }
            }
           }
           updateObj.CG_GEOMETRY = layer.toGeoJSON().geometry;

           db.update(updateObj);
           $(".infoEdit").remove();
         }
       });

       $("#deleteGeom").click(function(){
         map.removeLayer(layer);
         map.closePopup();
         db.delete("ALL", layer.feature.properties.CG_ID);
       });
     }
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

 function editPanel(feature){
   console.log(feature);
   $("#interface").prepend("<div class='infoEdit'><table id='infoTable'></table></div>");
   var tr = $("<table class='attributes'></table>");
   for (var key in feature.properties) {
     if (feature.properties.hasOwnProperty(key)) {
       if(key !== "CG_ID" &&
          key !== "ProjektID" &&
          key.indexOf("label") === -1 &&
          key.indexOf("Label") === -1){
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
    table += "</table></div>";
  } else {
      table +=
      "</table>" + "<div id='popup-button-wrap'>" +
          "<div id='editGeom' class='disabled-edit unselectable-text'><p>Rediger<i class='fa fa-pencil table-edit' aria-hidden='true'></i></p></div>" +
          "<div id='deleteGeom' class='disabled-edit unselectable-text'><p>Slet<i class='fa fa-trash table-delete' aria-hidden='true'></i></p></div>" +
      "</div>";
  }

  return table;
}
