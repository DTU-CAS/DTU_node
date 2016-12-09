// This algorithm is from user: Quentin on GitHUB
function QueryString() {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
      // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
    query_string[pair[0]] = decodeURIComponent(pair[1]);
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
    var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
    query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
    query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}

function bounds2Arr(bounds, reverse){
  if(reverse === false){
    return [
      [bounds._northEast.lat, bounds._northEast.lng],
      [bounds._southWest.lat, bounds._southWest.lng]
    ];
  } else {
    return [
      [bounds._northEast.lng, bounds._northEast.lat],
      [bounds._southWest.lng, bounds._southWest.lat]
    ];
  }
}

function arr2bounds(arr, reverse){
  if(reverse === false){
    return L.latLngBounds(
      L.latLng(arr[0][0], arr[0][1]),
      L.latLng(arr[1][0], arr[1][1])
    );
  } else {
    return L.latLngBounds(
      L.latLng(arr[0][1], arr[0][0]),
      L.latLng(arr[1][1], arr[1][0])
    );
  }
}

function addGFI(e){
  var layerString = "";
  for (var j = 0; j < wmsLayers.length; j++){
    layerString+= wmsLayers[j][0];
    if(j !== wmsLayers.length -1){
      layerString+= ",";
    }
  }

  var latLng = e.latlng;
  var point = map.latLngToContainerPoint(latLng, map.getZoom());
  var size = map.getSize();

  // convert boundbox to srs
  var WGS84Param = proj4("EPSG:4326");
  var coordinateSystem = proj4(epsg["25832"]);
  var bbox = bounds2Arr(map.getBounds(), true);
  bbox[0] = proj4(WGS84Param, coordinateSystem, bbox[0]);
  bbox[1] = proj4(WGS84Param, coordinateSystem, bbox[1]);
  bbox = arr2bounds(bbox, true).toBBoxString();

  var layerURL = "http://services.nirasmap.niras.dk/kortinfo/services/Wms.ashx?";
  var params = {
    site: 'Provider',
    page: 'DTU',
    request: 'GetFeatureInfo',
    userName: 'DTUView',
    password: 'Bruger12',
    service: 'WMS',
    version: '1.1.1',
    layers: "6832, 6834, 6831",
    styles: "",
    srs: 'EPSG:25832',
    bbox: bbox,
    width: size.x,
    height: size.y,
    query_layers: "6832, 6834, 6831",
    x: point.x,
    y: point.y,
    type: 'nirasmap',
    feature_count: 1,
    info_format: 'text/xml'
  };

  var content = layerURL + L.Util.getParamString(params, layerURL, true);

  $.ajax({url: content, success: function(result){
    var fields = result.getElementsByTagName("field");

    if(fields.length > 0){
      var tableContent = "<table>";
      for(var i = 0; i < fields.length; i++){
        tableContent +=
        "<tr class='table-row'>" +
        "<td>" + $(fields[i]).attr("name") + "</td>" +
        "<td>" + fields[i].innerHTML + "</td>";
      }
      tableContent += "</table>";

      L.popup({ maxWidth: "600px"})
        .setLatLng(latLng)
        .setContent(tableContent)
        .openOn(map);
    }
  }});
}

/*
   * Workaround for 1px lines appearing in some browsers due to fractional transforms
   * and resulting anti-aliasing.
   * https://github.com/Leaflet/Leaflet/issues/3575
*/
(function(){
    var originalInitTile = L.GridLayer.prototype._initTile;
    L.GridLayer.include({
        _initTile: function (tile) {
            originalInitTile.call(this, tile);
            var tileSize = this.getTileSize();
            tile.style.width = tileSize.x + 1 + 'px';
            tile.style.height = tileSize.y + 1 + 'px';
        }
    });
})();

function getFields(string, type){

  if(string === "byggeri"){
    if(type === "type"){
      return [
        "Aflevering",
        "Anlæg",
        "Byggeprojekt",
        "Byggeplads hegn",
        "Bygning under opførelse",
        "Bygning under ombyg/ renovering",
        "Bygning under nedrivning",
        "Drift/ commisioning",
        "Forberedende arbejde/ drift",
        "Installationer/ komplettering",
        "Jordarbejder/ fundering",
        "Midlertidig bygning",
        "Ombygning/renovering",
        "Oplag",
        "Råhus",
        "Skurby",
        "Udførelse",
        "Udgravning"
      ];
    } else {
      return {
        "Navn": null,
        "Type": null,
        "Startdato": null,
        "Slutdato": null,
        "Projektleder": null,
        "Status": null
      };
    }
  } else if (string === "byggeplads"){
    return {
      "Navn": null,
      "Type": "Byggeplads",
      "Startdato": null,
      "Slutdato": null,
      "Projektleder": null,
      "Status": null
    };
  } else if (string === "adgangsvej"){
    if(type === "type"){
      return [
        "Tung trafik",
        "Midlertidig gangsti",
        "Lukket for gennemkørsel"
      ];
    }
    return {
      "Navn": null,
      "Type": null,
      "Startdato": null,
      "Slutdato": null,
      "Status": null
    };
  } else if (string === "parkering"){
    if(type === "type"){
      return [
        "Parkering",
        "Materialelager"
      ];
    }
      return {
        "Navn": null,
        "Type": null,
        "Startdato": null,
        "Slutdato": null,
        "Projektleder": null,
        "P_pladser": null,
        "Status": null
      };
    }
}
