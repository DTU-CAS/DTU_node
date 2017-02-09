/* global proj4 */
'use strict'

var repFunc = {
  // Checks if `list` looks like a `[x, y]`.
  isXY: function (list) {
    return list.length >= 2 &&
      typeof list[0] === 'number' &&
      typeof list[1] === 'number'
  },

  traverseCoords: function (coordinates, callback) {
    if (repFunc.isXY(coordinates)) return callback(coordinates)
    return coordinates.map(function (coord) { return repFunc.traverseCoords(coord, callback) })
  },

  // Simplistic shallow clone that will work for a normal GeoJSON object.
  clone: function (obj) {
    if (obj == null || typeof obj !== 'object') return obj
    var copy = obj.constructor()
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr]
    }
    return copy
  },

  traverseGeoJson: function (geojson, leafCallback, nodeCallback) {
    if (geojson == null) return geojson

    var r = repFunc.clone(geojson)

    if (geojson.type === 'Feature') {
      r.geometry = repFunc.traverseGeoJson(geojson.geometry, leafCallback, nodeCallback)
    } else if (geojson.type === 'FeatureCollection') {
      r.features = r.features.map(function (gj) { return repFunc.traverseGeoJson(gj, leafCallback, nodeCallback) })
    } else if (geojson.type === 'GeometryCollection') {
      r.geometries = r.geometries.map(function (gj) { return repFunc.traverseGeoJson(gj, leafCallback, nodeCallback) })
    } else {
      if (leafCallback) leafCallback(r)
    }

    if (nodeCallback) nodeCallback(r)

    return r
  },

  detectCrs: function (geojson, projs) {
    var crsInfo = geojson.crs
    var crs

    if (crsInfo === undefined) {
      throw new Error('Unable to detect CRS, GeoJSON has no "crs" property.')
    }

    if (crsInfo.type === 'name') {
      crs = projs[crsInfo.properties.name]
    } else if (crsInfo.type === 'EPSG') {
      crs = projs['EPSG:' + crsInfo.properties.code]
    }

    if (!crs) {
      throw new Error('CRS defined in crs section could not be identified: ' + JSON.stringify(crsInfo))
    }

    return crs
  },

  determineCrs: function (crs, projs) {
    if (typeof crs === 'string' || crs instanceof String) {
      return projs[crs] || proj4.Proj(crs)
    }

    return crs
  },

  reproject: function (geojson, from, to, projs) {
    projs = projs || {}
    if (!from) {
      from = repFunc.detectCrs(geojson, projs)
    } else {
      from = repFunc.determineCrs(from, projs)
    }

    to = repFunc.determineCrs(to, projs)
    var transform = proj4(from, to)

    return repFunc.traverseGeoJson(geojson, function (gj) {
      // No easy way to put correct CRS info into the GeoJSON,
      // and definitely wrong to keep the old, so delete it.
      if (gj.crs) {
        delete gj.crs
      }
      gj.coordinates = repFunc.traverseCoords(gj.coordinates, function (xy) {
        return transform.forward(xy)
      })
    }, function (gj) {
      if (gj.bbox) {
        // A bbox can't easily be reprojected, just reprojecting
        // the min/max coords definitely will not work since
        // the transform is not linear (in the general case).
        // Workaround is to just re-compute the bbox after the
        // transform.
        gj.bbox = (function () {
          var min = [Number.MAX_VALUE, Number.MAX_VALUE]
          var max = [-Number.MAX_VALUE, -Number.MAX_VALUE]
          repFunc.traverseGeoJson(gj, function (_gj) {
            repFunc.traverseCoords(_gj.coordinates, function (xy) {
              min[0] = Math.min(min[0], xy[0])
              min[1] = Math.min(min[1], xy[1])
              max[0] = Math.max(max[0], xy[0])
              max[1] = Math.max(max[1], xy[1])
            })
          })
          return [min[0], min[1], max[0], max[1]]
        })()
      }
    })
  }
}

var reproject = { // eslint-disable-line
  detectCrs: repFunc.detectCrs,

  reproject: repFunc.reproject,

  reverse: function (geojson) {
    return repFunc.traverseGeoJson(geojson, function (gj) {
      gj.coordinates = repFunc.traverseCoords(gj.coordinates, function (xy) {
        return [ xy[1], xy[0] ]
      })
    })
  },

  toWgs84: function (geojson, from, projs) {
    return repFunc.reproject(geojson, from, proj4.WGS84, projs)
  }
}
