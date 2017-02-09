/* global proj4 */
/*
 * This scripts takes a gml from a wfs call and exports geoJSON,
 * Requires jQuery and Proj4js
 * Move convert out into a reproject geojson script
 *
 * @author NIRAS - Casper Fibæk
 * @version 0.2
 * @param {object} gml - Raw '.GML' file, not a string.
 * @param {boolean} convert - enable/disable conversion from UTM32 to WGS84
 */

var GML2GeoJSON = function (gml, convert) { // eslint-disable-line
  var GML = {
    'geojson': {
      'type': 'FeatureCollection',
      'crs': {
        'properties': {
          'name': $(gml.getElementsByTagName('Box')[0]).attr('srsName')
        },
        'type': 'name'
      },
      'features': []
    },

    'WGS84Param': proj4('EPSG:4326'),
    'coordinateSystem': proj4('+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'),

    getCoord: function (coordArr, convert, srs, padding) {
      var ts = $(coordArr).attr('ts')
      var cs = $(coordArr).attr('cs')
      // var decimal = $(coordArr).attr('decimal')
      var arrayInitalize = coordArr.innerHTML
      var arrayTableSeperator = arrayInitalize.split(ts)
      var arrayCommaSeperator = []

      if (padding === true) {
        arrayCommaSeperator = [[]]

        if (convert === true) {
          for (var i = 0; i < arrayTableSeperator.length; i++) {
            arrayCommaSeperator[0].push(proj4(GML.coordinateSystem, GML.WGS84Param, [
              Number(arrayTableSeperator[i].split(cs)[0]),
              Number(arrayTableSeperator[i].split(cs)[1])
            ]))
          }
        } else {
          for (var j = 0; j < arrayTableSeperator.length; j++) {
            arrayCommaSeperator[0].push([
              Number(arrayTableSeperator[j].split(cs)[0]),
              Number(arrayTableSeperator[j].split(cs)[1])
            ])
          }
        }
      } else {
        if (convert === true) {
          for (var w = 0; w < arrayTableSeperator.length; w++) {
            arrayCommaSeperator.push(proj4(GML.coordinateSystem, GML.WGS84Param, [
              Number(arrayTableSeperator[w].split(cs)[0]),
              Number(arrayTableSeperator[w].split(cs)[1])
            ]))
          }
        } else {
          for (var t = 0; t < arrayTableSeperator.length; t++) {
            arrayCommaSeperator.push([
              Number(arrayTableSeperator[t].split(cs)[0]),
              Number(arrayTableSeperator[t].split(cs)[1])
            ])
          }
        }
      }

      return arrayCommaSeperator
    },
    getGML: function () {
      if (gml.children[0].tagName === 'FeatureCollection') {
        var geometryArray = gml.getElementsByTagName('featureMember')

        // Loop through geometry
        for (var i = 0; i < geometryArray.length; i++) {
          var features = geometryArray[i].children[0].children
          var obj = {
            'type': 'Feature',
            'properties': {
              'fid': $(geometryArray[i].children[0]).attr('fid')
            },
            'geometry': {}
          }

          // add properties
          for (var j = 0; j < features.length; j++) {
            var key = features[j].tagName.split(':')[1]
            var srs

            // if it is a property add it
            if (key !== 'CG_GEOMETRY') {
              obj.properties[key] = features[j].innerHTML
            } else {  // if it is a geometry merge it
              var type = features[j].children[0].tagName.split(':')[1]

              if (type === 'MultiPolygon') {
                var polyArr = []
                // get all polygons
                var polygonArr = features[j].getElementsByTagName('Polygon')
                // loop through them and add to feature
                for (var q = 0; q < polygonArr.length; q++) {
                  var coords = polygonArr[q].getElementsByTagName('coordinates')[0]

                  if (convert === true) {
                    srs = $(features[j].children[0]).attr('srsName')
                    if (polygonArr.length === 1) {
                      polyArr.push(GML.getCoord(coords, true, srs, false))
                    } else {
                      polyArr.push(GML.getCoord(coords, true, srs, true))
                    }
                  } else {
                    if (polygonArr.length === 1) {
                      polyArr.push(GML.getCoord(coords, false, {}, false))
                    } else {
                      polyArr.push(GML.getCoord(coords, false, {}, true))
                    }
                  }
                }

                if (polygonArr.length === 1) {
                  obj.geometry.type = 'Polygon'
                } else {
                  obj.geometry.type = 'MultiPolygon'
                }

                obj.geometry.coordinates = polyArr
              } else if (type === 'Polygon') {
                var poly = features[j].getElementsByTagName('Polygon')[0]
                var coordsSingle = poly.getElementsByTagName('coordinates')[0]
                obj.geometry.type = 'Polygon'

                if (convert === true) {
                  srs = $(poly).attr('srsName')
                  obj.geometry.coordinates = [GML.getCoord(coordsSingle, true, srs)]
                } else {
                  obj.geometry.coordinates = [GML.getCoord(coordsSingle, false)]
                }
              } else if (type === 'MultiLineString') {
                var lineArr = []
                var allLines = features[j].getElementsByTagName('LineString')
                for (var l = 0; l < allLines.length; l++) {
                  var lineCoords = allLines[l].getElementsByTagName('coordinates')[0]

                  if (convert === true) {
                    srs = $(features[j].children[0]).attr('srsName')
                    lineArr.push(GML.getCoord(lineCoords, true, srs)[0]) // [0] because lineStrings shouldn't be padded
                  } else {
                    lineArr.push(GML.getCoord(lineCoords, false, srs)[0])
                  }
                }

                if (lineArr.length === 1) {
                  obj.geometry.type = 'LineString'
                } else {
                  obj.geometry.type = 'MultiLineString'
                }

                obj.geometry.coordinates = lineArr
              } else if (type === 'LineString') {
                var line = features[j].getElementsByTagName('LineString')[0]
                var lineCoordSingle = line.getElementsByTagName('coordinates')[0]
                obj.geometry.type = 'LineString'

                if (convert === true) {
                  srs = $(line).attr('srsName')
                  obj.geometry.coordinates = GML.getCoord(lineCoordSingle, true, srs)
                } else {
                  obj.geometry.coordinates = GML.getCoord(lineCoordSingle, false)
                }
              } else if (type === 'MultiPoint') {
                var pointArr = []
                var allPoints = features[j].getElementsByTagName('MultiPoint')

                for (var k = 0; k < allPoints.length; k++) {
                  var pointCoords = allPoints[k].getElementsByTagName('coordinates')[0]

                  if (convert === true) {
                    srs = $(features[j].children[0]).attr('srsName')
                    pointArr.push(GML.getCoord(pointCoords, true, srs))
                  } else {
                    pointArr.push(GML.getCoord(pointCoords, false, srs))
                  }
                }

                if (pointArr.length === 1) {
                  obj.geometry.type = 'Point'
                } else {
                  obj.geometry.type = 'MultiPoint'
                }

                obj.geometry.coordinates = pointArr
              } else if (type === 'Point') {
                var point = features[j].getElementsByTagName('Point')[0]
                var pointSingle = point.getElementsByTagName('coordinates')[0]
                obj.geometry.type = 'Point'

                if (convert === true) {
                  srs = $(point).attr('srsName')
                  obj.geometry.coordinates = GML.getCoord(pointSingle, true, srs)[0]
                } else {
                  obj.geometry.coordinates = GML.getCoord(pointSingle, false)[0]
                }
              }
            }
          }
          GML.geojson.features.push(obj)
        }
      }
      return GML.geojson
    }
  }
  return GML.getGML()
}
