/* global
  gS
  dB
  Wkt
  chroma
  OpenLayers
  proj4
  reproject
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
      .css('left', map._attrEdit.left)
      .css('top', map._attrEdit.top)

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
        if (layer.options && layer.feature.properties) {
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
    var wfsBase = 'http://services.nirasmap.niras.dk/kortinfo/services/Wfs.ashx?'
    var wfsParams = {
      Site: 'Provider',
      Page: 'DTU',
      UserName: 'DTUedit',
      Password: 'Rette37g',
      Service: 'WFS',
      Request: 'GetFeature',
      Typename: string,
      Srsname: 'EPSG:3857'
    }
    var wfsRequest = wfsBase + L.Util.getParamString(wfsParams, wfsBase, true)

    $.ajax({
      url: wfsRequest,
      success: function (geom) {
        var jsonGeom = gF.GMLtoGEOJSON(geom, 'gml')
        var layer = gF.eventJSON(jsonGeom, editable)

        // whether or not it should be possible to edit the layer
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
  },
  GMLtoGEOJSON: function (geom, type) { // eslint-disable-line
    try {
      var options = OpenLayers.Util.extend(
        OpenLayers.Util.extend({}, {extractAttributes: true})
      )

      var vectors = new OpenLayers.Layer.Vector('Vector Layer')

      var readerGeo
      switch (type) {
        case 'gml': {
          readerGeo = new OpenLayers.Format.GML(options)
          break
        }
        case 'gml-2': {
          readerGeo = new OpenLayers.Format.GML.v2(options) // eslint-disable-line
          break
        }
        case 'gml-3': {
          readerGeo = new OpenLayers.Format.GML.v3(options) // eslint-disable-line
          break
        }
        default: break
      }

      var oSerializer = new XMLSerializer()
      var sXML = oSerializer.serializeToString(geom)

      // OBS var xmlText = geomtoString //
      var geoVector = readerGeo.read(sXML)

      vectors.addFeatures(geoVector)

      var UTM32 = proj4('+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs')

      var readerJson = new OpenLayers.Format.GeoJSON()
      var jsonString = readerJson.write(geoVector)
      var json = JSON.parse(jsonString)

      return reproject.toWgs84(json, UTM32, '')
    } catch (e) {
      alert(e)
    }
  },
  // Takes a normal geoJSON and adds custom events
  eventJSON: function (geoJSON, editable) {
    // if a popup is already open, close it.
    map.closePopup()

    // defined at the end.
    var layerStyle = gS.style.Standard

    // creates the layer add style at end
    var eventLayer = L.geoJSON(geoJSON)

    .on('click', function (e) {
        // set up variables
      var layer = e.layer
      var feature = layer.feature

        // pan to layer
      map.panTo(layer.getCenter())

        // create a poput and set information equal to properties.
      L.popup({
        closeButton: false
      })
          .setLatLng(layer.getCenter())
          .setContent(gF.infoPanel(feature.properties, editable))
          .openOn(map)

        /*******************************************************************************
            If it is suppose to be editable (rediger and delete buttons)
        *******************************************************************************/
        // If the layer is clicked and editing is already enabled,
        // show "Gem geometri instead of 'rediger'"
      if (editable === true) {
        if (layer.editEnabled() === true) {
          $('#editGeom')
              .removeClass('disabled-edit')
              .addClass('enabled-edit')
          $('#editGeom')
              .first()
              .text('Gem geometri')
        }

          // EDIT GEOMETRY
        $('#editGeom')
            .click(function () {
              // If we are starting an editing session
              if ($(this)
                .hasClass('disabled-edit')) {
                $(this)
                  .removeClass('disabled-edit')
                  .addClass('enabled-edit')
                $(this)
                  .first()
                  .text('Gem geometri')
                $('.infoEdit, .slide-menu')
                  .remove()

                // stop any previous editing
                gF.disableEdits()

                // remove itself from the guide array
                map._custom.snap.removeGuide(layer)

                // enable editing
                layer.enableEdit()

                // close the popup so it doesn't obscure the geometry
                map.closePopup()

                // open the editPanel (Edit attributes)
                gF.editPanel(feature)

                // if we are ending the editing session
              } else {
                // disable editing
                layer.toggleEdit()

                $(this)
                  .removeClass('enabled-edit')
                  .addClass('disabled-edit')
                $(this)
                  .first()
                  .text('Rediger')

                // update the layer.properties to match the editPanel
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

                $('.infoEdit')
                  .remove()

                // prepare the object for the database
                var updateObj = {}
                for (var key in layer.feature.properties) {
                  if (layer.feature.properties.hasOwnProperty(key)) {
                    if (layer.feature.properties[ key ] !== null) {
                      if (key === 'Type') {
                        // loopUp is from styles_andlookups.js
                        updateObj[ key ] = gS.lookUp(layer.feature.properties[ key ])
                      } else {
                        updateObj[ key ] = layer.feature.properties[ key ]
                      }
                    }
                  }
                }

                // Update the database
                updateObj.CG_GEOMETRY = layer.toGeoJSON()
                  .geometry
                dB.update(updateObj)

                // add the edited layer to the guide arrays
                map._custom.snap.addGuideLayer(layer)

                // update legend
                gF.updateLegend()
              }
            })

          // REMOVE GEOMETRY
        $('#deleteGeom')
            .click(function () {
              // remove the layer from the map
              map.removeLayer(layer)
              // close popups
              map.closePopup()
              // delete the ID from the database
              dB.delete('ALL', layer.feature.properties.CG_ID)
              // stop any editing
              gF.disableEdits()
            })

          // If it is not suppose to be editable:
      } else {
          // COPY GEOMETRY
        $('#copyGeom')
            .click(function () {
              // close popups
              map.closePopup()

              // close any editing going on
              gF.disableEdits()

              // create a geojson copy
              var layerCopy = layer.toGeoJSON()
              // get all fields from styles_and_lookups.js
              map._custom.addFields = gS.getFields('all')
              // add properties from URL parameters

              if (gS.lookUp(layer.feature.properties.Type) !== 'undefined') {
                layerCopy.properties.Type = gS.lookUp(layer.feature.properties.Type)
              } else {
                layerCopy.properties.Type = layer.feature.properties.Type
              }

              if (
                layerCopy.properties.Type === 'undefined' ||
                layerCopy.properties.Type === undefined
              ) {
                layerCopy.properties.Type = 'undefined'
              }

              // add the layer to the database and the map, make it editable (true)
              gF.dbJSON(layerCopy, true)
            })
      }
    })
      // STYLES
      .on('mouseover', function (e) {
        // on hover take the colors and brighten + saturate them
        if (e.layer.feature.properties) {
          if (
            e.layer.feature.properties.Type !== undefined &&
            e.layer.feature.properties.Type !== 'undefined'
          ) {
            e.layer.setStyle({
              color: 'rgba(' + chroma(e.layer.options.color)
              .brighten()
              .saturate()
              .rgba() + ')',
              fillColor: 'rgba(' + chroma(e.layer.options.fillColor)
              .brighten()
              .saturate()
              .rgba() + ')',
              opacity: e.layer.options.opacity * 1.15,
              fillOpacity: e.layer.options.fillOpacity * 1.25,
              weight: e.layer.options.weight * 1.2
            })
          }
        }
      })
      // on mouse out reset style
      .on('mouseout', function (e) {
        if (e.layer.feature.properties) {
          if (e.layer.feature.properties.Type) {
            var type = e.layer.feature.properties.Type
            if (gS.style[ type ]) {
              e.layer.setStyle(gS.style[ type ])
            } else {
              e.layer.setStyle(gS.style[ gS.lookUp(type) ])
            }
          }
        } else {
          e.layer.setStyle(gS.style.Undefined)
        }
      })

    // console.log(layerStyle);
    eventLayer.eachLayer(function (layer) {
      if (layer.feature.properties) {
        if (layer.feature.properties.Type) {
          var type = layer.feature.properties.Type
          if (gS.style[ type ]) {
            layerStyle = gS.style[ type ]
          } else {
            layerStyle = gS.style[ gS.lookUp(type) ]
          }
        }
      }
      layer.setStyle(layerStyle)
    })

    return eventLayer
  }
}
