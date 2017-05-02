/* global
  gS dB
  $
  map L
  Wkt
  chroma
*/

var gF = { // eslint-disable-line
  // This algorithm is from user: Quentin on GitHUB
  // Queries the URL parameters and returns as JSON
  queryString: function () { //
    var queryString = {}
    var query = window.location.search.substring(1)
    var vars = query.split('&')
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[ i ].split('=')
     // If first entry with this name
      if (typeof queryString[ pair[ 0 ] ] === 'undefined') {
        queryString[ pair[ 0 ] ] = decodeURIComponent(pair[ 1 ])
       // If second entry with this name
      } else if (typeof queryString[ pair[ 0 ] ] === 'string') {
        var arr = [ queryString[ pair[ 0 ] ], decodeURIComponent(pair[ 1 ]) ]
        queryString[ pair[ 0 ] ] = arr
       // If third or later entry with this name
      } else {
        queryString[ pair[ 0 ] ].push(decodeURIComponent(pair[ 1 ]))
      }
    }
    return queryString
  },
  // turns leaflet bounds into an array;
  bounds2Arr: function (bounds, reverse) {
    if (reverse === false) {
      return [
        [ bounds._northEast.lat, bounds._northEast.lng ],
        [ bounds._southWest.lat, bounds._southWest.lng ]
      ]
    } else {
      return [
        [ bounds._northEast.lng, bounds._northEast.lat ],
        [ bounds._southWest.lng, bounds._southWest.lat ]
      ]
    }
  },
  // turns an array into leaflet bounds;
  arr2bounds: function (arr, reverse) {
    if (reverse === false) {
      return L.latLngBounds(
        L.latLng(arr[ 0 ][ 0 ], arr[ 0 ][ 1 ]),
        L.latLng(arr[ 1 ][ 0 ], arr[ 1 ][ 1 ])
      )
    } else {
      return L.latLngBounds(
        L.latLng(arr[ 0 ][ 1 ], arr[ 0 ][ 0 ]),
        L.latLng(arr[ 1 ][ 1 ], arr[ 1 ][ 0 ])
      )
    }
  },
  // Allows you to edit the table on click
  editPanel: function (feature) {
    var fields = []
    fields.push(gS.getFields('byggeri'))
    fields.push(gS.getFields('byggeplads'))
    fields.push(gS.getFields('parkering'))
    fields.push(gS.getFields('adgangsvej'))
    map._custom.addFields = gS.getFields('all')

    $('#interface')
      .prepend(
        "<div class='infoEdit'>" +
        "<div id='infoHeadling'><p>Rediger attributer</p></div>" +
        "<table id='infoTable'></table>" +
        "<div id='attrSelections'><ul></ul></div>" +
        '</div>')

    $('.infoEdit')
      .draggable({
        start: function (event, ui) {
          $('.infoEdit').css('cursor', 'move')
        },
        stop: function (event, ui) {
          $('.infoEdit').css('cursor', 'default')
        }
      })
      .css('left', map._custom.left)
      .css('top', map._custom.top)

    for (var key in feature.properties) {
      if (feature.properties.hasOwnProperty(key)) {
        if (key === 'Type') {
          $('#infoTable')
            .append("<tr id='info-Type' class='editRow hoverPointer'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='false'>" + String(feature.properties[ key ] + '</td></tr>'))
        } else if (key === 'Navn') {
          $('#infoTable')
            .append("<tr id='info-Navn' class='editRow'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='true'>" + String(feature.properties[ key ] + '</td></tr>'))
        } else if (key === 'Status') {
          $('#infoTable')
            .append("<tr id='info-Status' class='editRow hoverPointer'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='false'>" + String(feature.properties[ key ] + '</td></tr>'))
        }
      }
    }

    $('#info-Type')
      .on('click', function () {
        $('#attrSelections')
          .css('left', ($('.infoEdit')
            .width() + 20) + 'px')
        $('.editRow')
          .css('background', '#252830')
        $(this)
          .css('background', '#3e4149')
        var _thisType = $('#info-Type > .attribute')
          .text()
        if (map._custom.addFields.indexOf(_thisType) === -1) {
          _thisType = gS.lookUp(_thisType)
        }
        var typeList = ''

        if (
          _thisType === 'undefined' ||
          _thisType === undefined ||
          _thisType === null ||
          _thisType === 'null'
        ) {
          for (var q = 0; q < map._custom.addFields.length; q++) {
            typeList += '<li>' + map._custom.addFields[ q ] + '</li>'
          }
        } else {
          for (var i = 0; i < fields.length; i++) {
            for (var j = 0; j < fields[ i ].length; j++) {
              if (fields[ i ][ j ].indexOf(_thisType) !== -1) {
                for (var w = 0; w < fields[ i ].length; w++) {
                  typeList += '<li>' + fields[ i ][ w ] + '</li>'
                }
              }
            }
          }
        }

        $('#attrSelections > ul')
          .empty()
          .append(typeList)
        $('#attrSelections > ul > li')
          .unbind()
          .click(function () {
            $('#info-Type > .attribute')
              .text($(this)
                .text())
            $('#attrSelections')
              .css('left', ($('.infoEdit')
                .width() + 20) + 'px')
          })
        $('#attrSelections')
          .animate({
            width: '160px'
          }, 150)
      })

    $('#info-Status')
      .on('click', function () {
        $('#attrSelections')
          .css('left', ($('.infoEdit')
            .width() + 20) + 'px')
        $('.editRow')
          .css('background', '#252830')
        $(this)
          .css('background', '#3e4149')
        var statusList = ''
        for (var i = 0; i < gS.getFields('status')
          .length; i++) {
          statusList += '<li>' + gS.getFields('status')[ i ] + '</li>'
        }
        $('#attrSelections > ul')
          .empty()
          .append(statusList)
        $('#attrSelections > ul > li')
          .unbind()
          .click(function () {
            $('#info-Status > .attribute')
              .text($(this)
                .text())
            $('#attrSelections')
              .css('left', ($('.infoEdit')
                .width() + 20) + 'px')
          })
        $('#attrSelections')
          .animate({
            width: '160px'
          }, 150)
      })
    $('#info-Navn')
      .on('click', function () {
        $('.editRow')
          .css('background', '#252830')
        $(this)
          .css('background', '#3e4149')
        $('#attrSelections > ul')
          .empty()
        $('#attrSelections')
          .animate({
            width: '0'
          }, 100)
      })
  },
  // Creates the HTML for the table
  infoPanel: function (obj, edit) {
    $('#editGeom, #deleteGeom, #copyGeom')
      .off('click')
      .remove()
    var table = "<div id='objTable'>" + "<table class='table'>"

    var addRow = function (key, attribute) {
      return "<tr class='table-row'>" +
        "<td class='rowName'>" + key + '</td>' +
        '<td>' + attribute + '</td>' + '</tr>'
    }

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key !== 'CG_ID' &&
          key !== 'ProjektID' &&
          key.indexOf('label') === -1 &&
          key.indexOf('Label') === -1 &&
          key.indexOf('KortInfo') === -1 &&
          obj[ key ] !== 'null' &&
          obj[ key ] !== null) {
          if (key === 'P_pladser' && (obj[ key ] === null || obj[ key ] === 'null')) {
            // how do I reverse this?
          } else {
            table += addRow(key, obj[ key ])
          }
        }
      }
    }

    if (edit === false) {
      table +=
        '</table>' + "<div id='popup-button-wrap'>" +
        "<div id='copyGeom' class='disabled-edit unselectable-text'><p>Kopier<i class='fa fa-copy table-edit' aria-hidden='true'></i></p></div>" +
        '</div>'
    } else {
      table +=
        '</table>' + "<div id='popup-button-wrap'>" +
        "<div id='editGeom' class='disabled-edit unselectable-text'><p>Rediger<i class='fa fa-pencil table-edit' aria-hidden='true'></i></p></div>" +
        "<div id='deleteGeom' class='disabled-edit unselectable-text'><p>Slet<i class='fa fa-trash table-delete' aria-hidden='true'></i></p></div>" +
        '</div>'
    }

    return table
  },
  // updates the legend
  updateLegend: function () {
    $('.legend')
      .empty()
    $('#text-bg')
      .remove()
    map._legendLayers = []

    map.eachLayer(function (layer) {
      if (layer instanceof L.Path) {
        if (layer.options && layer.feature) {
          if (map._legendLayers.indexOf(layer.feature.properties.Type) === -1) {
            map._legendLayers.push(layer.feature.properties.Type)

            var st = layer.options

            var borderColor = 'rgba(' + String(chroma(st.color)
              .alpha(st.opacity)
              .rgba()) + ')'
            var fillColor = 'rgba(' + String(chroma(st.fillColor)
              .alpha(st.fillOpacity)
              .rgba()) + ')'

            // change for lookup
            var row = $("<tr class='legend-row'></tr>")

            // readability > brevity
            var dash
            var text
            var type
            var postText

            if (gS.abbr(layer.feature.properties.Type) === true) {
              type = String(gS.lookUp(layer.feature.properties.Type))
            } else {
              type = String(layer.feature.properties.Type)
            }

            if (st.dashArray) {
              dash = 'dashed'
            } else {
              dash = 'solid'
            }

            var color = $("<td class='legend-color'></td>")
              .css('border', st.weight + 'px ' + dash + ' ' + borderColor)
              .css('background', fillColor)

            if (layer.feature.properties.DTUbygnnr) {
              text = $("<td class='legend-name'>" + 'Bygninger' + '</td>')
              postText = 'Bygninger'
            } else {
              text = $("<td class='legend-name'>" + type + '</td>')
              postText = type
            }

            // If it is not already added to the legend;
            if ($('.legend-name')
              .text()
              .indexOf(postText) === -1) {
              $(row)
                .append(color)
                .append(text)

              $('.legend')
                .append(row)
            }
          }
        }
      }
    })

    $('.table-container')
      .css('left', $('#map')
        .width() - $('.legend')
        .width() - 20)
    $('.table-container')
      .css('bottom', ($('#map')
          .height() * -1) + $('.legend')
        .height() + 25)

    var bg = $("<div id='text-bg'></div>")
    $(bg)
      .css('width', $('.legend-name')
        .outerWidth())
      .css('margin-left', $('.legend-color')
        .outerWidth() + 6)
      .css('height', $('.legend')
        .outerHeight())
      .css('margin-top', $('.legend')
        .outerHeight() * -1)

    $('.table-container')
      .append(bg)
  },
  // stops all editing
  disableEdits: function () {
    if ($('.infoEdit').length > 0) {
      map._custom.attrEdit = {
        left: $('.infoEdit').position().left,
        top: $('.infoEdit').position().top
      }
    }

    map.eachLayer(function (layer) {
      if (layer.editor) {
        if (layer.editor._enabled === true) {
          layer.toggleEdit()
          var layerStyle

          // update the layer attributes to correspond with the "rediger attributer table"
          $('#infoTable > tr > .key')
            .each(function () {
              if ($(this)
                .siblings()
                .text() === 'null' || $(this)
                .siblings()
                .text()
                .length === 0) {
                layer.feature.properties[ $(this).attr('ref') ] = null
              } else {
                layer.feature.properties[ $(this).attr('ref') ] = $(this)
                  .siblings()
                  .text()
              }
            })

          // create the object to send to the database
          // use the gS.lookUp table to convert back to acronym form.
          if (layer.feature) {
            var updateObj = {}
            for (var key in layer.feature.properties) {
              if (layer.feature.properties.hasOwnProperty(key)) {
                if (layer.feature.properties[ key ] !== null) {
                  if (key === 'Type') {
                    updateObj[ key ] = gS.lookUp(layer.feature.properties[ key ])
                  } else {
                    updateObj[ key ] = layer.feature.properties[ key ]
                  }
                }
              }
            }
            updateObj.CG_GEOMETRY = layer.toGeoJSON()
              .geometry

            // add to snap layer and update database
            map._custom.snap.addGuideLayer(layer)
            dB.update(updateObj)

            if (layer.feature.properties) {
              if (layer.feature.properties.Type) {
                var type = layer.feature.properties.Type
                if (gS.style[ type ]) {
                  layerStyle = gS.style[ type ]
                } else {
                  layerStyle = gS.style[ gS.lookUp(type) ]
                }
              }
            } else {
              layerStyle = gS.style.Standard
            }
            layer.setStyle(layerStyle)
          }
        }
      }
    })

    // update legend
    gF.updateLegend()

    // remove popup menues
    $('.infoEdit, .slide-menu')
      .remove()
  },
  // Adds new layers to the map as well as the database
  dbJSON: function (json, editable) {
    // takes the URL parameters and add to the newly created layer
    json.properties = {
      'ProjektID': gF.queryString().ID,
      'Navn': gF.queryString().NAME,
      'Status': gS.getFields('status')[ 0 ],
      'Type': json.properties.Type
    }

    // prepares the layer for upload to the database.
    var preObject = {
      CG_GEOMETRY: json.geometry,
      ProjektID: json.properties.ProjektID,
      Type: gS.lookUp(json.properties.Type), // changes the type back to abbreviative
      Navn: json.properties.Navn,
      Status: json.properties.Status
    }

    // readies the keys and attrbute for dB post
    // TODO: this should be in the dB.js script
    var keys = ''
    var values = ''
    for (var key in preObject) {
      if (preObject.hasOwnProperty(key)) {
        if (key !== 'CG_GEOMETRY') {
          keys += key + ', '
          values += "'" + preObject[ key ] + "', "
        }
      }
    }
    keys = keys.slice(0, -2)
    values = values.slice(0, -2)

    var postObj = {
      'keys': keys,
      'values': values,
      'geometry': JSON.stringify(preObject.CG_GEOMETRY)
    }

    // post the layer to the database
    // gets the latest ID before posting it.
    $.ajax({
      type: 'POST',
      url: '/api/post/',
      dataType: 'json',
      data: postObj
    })
      .done(function () {
        // get latest ID
        $.ajax({
          type: 'GET',
          url: '/api/latest/',
          dataType: 'json'
        })
          .done(function (res) {
            console.log('latest', res)
            // translate the wellknown text to JSON
            var wkt = new Wkt.Wkt()
            wkt.read(JSON.stringify(json))
              .write()
            // set the ID equal to the latests
            json.properties.CG_ID = res

            // add the layer to the map
            // TODO: change style to match type
            var addLayer = gF.eventJSON(json, true)
              .addTo(map)

            if (editable === true) {
              gF.editPanel(json)
            }

            gF.updateLegend()

            // if the layer is suppose to be editable, remove it from guidelayers
            // and enable edits.
            if (editable === true) {
              addLayer.eachLayer(function (layer) {
                if (layer instanceof L.Path) {
                  if (typeof layer.editor === 'undefined') {
                    if (layer.options.editable !== false) {
                      map._custom.snap.removeGuide(layer)
                      layer.enableEdit()
                    }
                  }
                }
              })
            }
          })
          .fail(function (jqXHR, status, error) {
            console.log('AJAX call failed: ', jqXHR)
          })
      })
      .fail(function (jqXHR, status, error) {
        console.log('AJAX call failed: ', jqXHR)
      })
  },
  // Add layer to overview
  add2LayerList: function (name, layer) {
    var listItem = $("<li class='unselectable-text layer layer-off'><p>" + name + '</p></li>')
      .on('click', function () {
        if ($(this)
          .hasClass('layer-on')) {
          $(this)
            .removeClass('layer-on')
            .addClass('layer-off')
          map.removeLayer(layer)
        } else {
          $(this)
            .removeClass('layer-off')
            .addClass('layer-on')
          map.addLayer(layer)
        }
        gF.updateLegend()
      }
    )
    $('#layers')
      .append(listItem)
  },
  // Add WMS layer
  addWMSlayer: function (string, name) {
    var layer = L.tileLayer.wms('http://services.nirasmap.niras.dk/kortinfo/services/Wms.ashx?', {
      site: 'Provider',
      page: 'DTU',
      userName: 'DTUView',
      password: 'Bruger12',
      loginType: 'KortInfo',
      service: 'WMS',
      version: '1.1.1',
      layers: string,
      transparent: true,
      format: 'image/png',
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '&copy; <a href="http://DTU.dk">Danish Technical University</a>'
    })

    gF.add2LayerList(name, layer)
  },
  // Add WFS layer
  addWfsLayer: function (string, name, editable) {
    // Site=Provider&Page=DTU&UserName=DTUview&Password=Bruger12&LoginType=KortInfo&layer=6833&srs=EPSG:4326&output=geojson
    var wfsBase = 'http://services.nirasmap.niras.dk/kortinfo/services/Feature.ashx?'
    var wfsParams = {
      Site: 'Provider',
      Page: 'DTU',
      UserName: 'DTUview',
      Password: 'Bruger12',
      LoginType: 'KortInfo',
      layer: string,
      srs: 'EPSG:4326',
      output: 'geojson'
    }
    var wfsRequest = wfsBase + L.Util.getParamString(wfsParams, wfsBase, true)

    $.ajax({
      url: wfsRequest,
      success: function (geom) {
        var jsonGeom = geom

        // Remove the geometry collections and turn to polygons
        for (var i = 0; i < jsonGeom.features.length; i += 1) {
          var feature = jsonGeom.features[i]
          if (feature.geometry.type === 'GeometryCollection') {
            feature.geometry = feature.geometry.geometries[0]
          }
        }

        // whether or not it should be possible to edit the layer
        var layer = gF.eventJSON(jsonGeom, editable)
        if (editable === false) {
          layer.eachLayer(function (layer) {
            layer.options.editable = false
          })
        } else {
          layer.eachLayer(function (layer) {
            layer.options.editable = true
          })
        }

        gF.add2LayerList(name, layer)
      }
    })
  }
}
