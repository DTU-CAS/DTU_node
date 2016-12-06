/*
 * This scripts takes a gml from a wfs call and exports geoJSON
 * Author: NIRAS - Casper Fibæk
 */

function GML2GeoJSON(gml, convert){
  if(convert === true){
    var WGS84Param = proj4("EPSG:4326");
    var coordinateSystem = proj4("+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
  }

  function getCoord(coordArr, convert, srs, padding){
    var ts = $(coordArr).attr("ts");
    var cs = $(coordArr).attr("cs");
    var decimal = $(coordArr).attr("decimal");
    var arr_init = coordArr.innerHTML;
    var arr_ts = arr_init.split(ts);
    var arr_cs = [];

      if(padding === true){
        arr_cs = [[]];

        if(convert === true){
          for(var i = 0; i < arr_ts.length; i++){
            arr_cs[0].push(proj4(coordinateSystem, WGS84Param, [
              Number(arr_ts[i].split(cs)[0]),
              Number(arr_ts[i].split(cs)[1]),
            ]));
          }}
          else {
            for(var j = 0; j < arr_ts.length; j++){
              arr_cs[0].push([
                Number(arr_ts[j].split(cs)[0]),
                Number(arr_ts[j].split(cs)[1]),
              ]);
            }
          }
      } else {
        if(convert === true){
          for(var w = 0; w < arr_ts.length; w++){
            arr_cs.push(proj4(coordinateSystem, WGS84Param, [
              Number(arr_ts[w].split(cs)[0]),
              Number(arr_ts[w].split(cs)[1]),
            ]));
          }}
          else {
            for(var t = 0; t < arr_ts.length; t++){
              arr_cs.push([
                Number(arr_ts[t].split(cs)[0]),
                Number(arr_ts[t].split(cs)[1]),
              ]);
            }
          }
      }

    return arr_cs;
  }

  var geoJSON = {
    "type": "FeatureCollection",
    "crs": {
      "properties": {
        "name": $(gml.getElementsByTagName("Box")[0]).attr("srsName")
      },
      "type": "name"
    },
    "features": []
  };

  // Get all elements in featureCollection
  if(gml.children[0].tagName === "FeatureCollection"){
    var geometryArray = gml.getElementsByTagName("featureMember");

    // Loop through geometry
    for(var i = 0; i < geometryArray.length; i++){
      var features = geometryArray[i].children[0].children;
      var obj = {
        "type": "Feature",
        "properties": {
          "fid": $(geometryArray[i].children[0]).attr("fid")
        },
        "geometry": {}
      };

      // add properties
      for(var j = 0; j < features.length; j++){
        var key = features[j].tagName.split(":")[1];
        var srs;

        // if it is a property add it
        if(key !== "CG_GEOMETRY"){
          obj.properties[key] = features[j].innerHTML;
        } else {  // if it is a geometry merge it
          var type = features[j].children[0].tagName.split(":")[1];

          if(type === "MultiPolygon"){
            var polyArr = [];
            // get all polygons
            var polygonArr = features[j].getElementsByTagName("Polygon");
            // loop through them and add to feature
            for(var q = 0; q < polygonArr.length; q++){
              var coords = polygonArr[q].getElementsByTagName("coordinates")[0];

              if(convert === true){
                srs = $(features[j].children[0]).attr("srsName");
                if(polygonArr.length === 1){
                  polyArr.push(getCoord(coords, true, srs, false));
                } else {
                  polyArr.push(getCoord(coords, true, srs, true));
                }
              } else {
                if(polygonArr.length === 1){
                  polyArr.push(getCoord(coords, false, {}, false));
                } else {
                  polyArr.push(getCoord(coords, false, {}, true));
                }
              }
            }

            if(polygonArr.length === 1){
              obj.geometry.type = "Polygon";
            } else {
              obj.geometry.type = "MultiPolygon";
            }

            obj.geometry.coordinates = polyArr;
          }
          else if (type === "Polygon"){
            var poly = features[j].getElementsByTagName("Polygon")[0];
            var coords_single = poly.getElementsByTagName("coordinates")[0];
            obj.geometry.type = "Polygon";

            if(convert === true){
              srs = $(poly).attr("srsName");
              obj.geometry.coordinates = [getCoord(coords_single, true, srs)];
            } else {
              obj.geometry.coordinates = [getCoord(coords_single, false)];
            }
          }
          else if (type === "MultiLineString"){
            var lineArr = [];
            var allLines = features[j].getElementsByTagName("LineString");
            for(var l = 0; l < allLines.length; l++){
              var lineCoords = allLines[l].getElementsByTagName("coordinates")[0];

              if(convert === true){
                srs = $(features[j].children[0]).attr("srsName");
                lineArr.push(getCoord(lineCoords, true, srs)[0]); // [0] because lineStrings shouldn't be padded
              } else {
                lineArr.push(getCoord(lineCoords, false, srs)[0]);
              }
            }

            if(lineArr.length === 1){
              obj.geometry.type = "LineString";
            } else {
              obj.geometry.type = "MultiLineString";
            }

            obj.geometry.coordinates = lineArr;

          }
          else if (type === "LineString"){
            var line = features[j].getElementsByTagName("LineString")[0];
            var lineCoord_single = line.getElementsByTagName("coordinates")[0];
            obj.geometry.type = "LineString";

            if(convert === true){
              srs = $(line).attr("srsName");
              obj.geometry.coordinates = getCoord(lineCoord_single, true, srs);
            } else {
              obj.geometry.coordinates = getCoord(lineCoord_single, false);
            }
          }
          else if (type === "MultiPoint"){
            var pointArr = [];
            var allPoints = features[j].getElementsByTagName("MultiPoint");

            for(var k = 0; k < allPoints.length; k++){
              var pointCoords = allPoints[k].getElementsByTagName("coordinates")[0];

              if(convert === true){
                srs = $(features[j].children[0]).attr("srsName");
                pointArr.push(getCoord(pointCoords, true, srs));
              } else {
                pointArr.push(getCoord(pointCoords, false, srs));
              }
            }

            if(pointArr.length === 1){
              obj.geometry.type = "Point";
            } else {
              obj.geometry.type = "MultiPoint";
            }

            obj.geometry.coordinates = pointArr;

          } else if (type === "Point"){
            var point = features[j].getElementsByTagName("Point")[0];
            var point_single = point.getElementsByTagName("coordinates")[0];
            obj.geometry.type = "Point";

            if(convert === true){
              srs = $(point).attr("srsName");
              obj.geometry.coordinates = getCoord(point_single, true, srs)[0];
            } else {
              obj.geometry.coordinates = getCoord(point_single, false)[0];
            }
          }
        }
      }
      geoJSON.features.push(obj);
    }
 }
  return geoJSON;
}
