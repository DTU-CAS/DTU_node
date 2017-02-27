 /* global gS gF $ L map */
function init () { // eslint-disable-line
  // Query the URL for parameters
  var query = gF.queryString()

  // Check if the ID is correct and if the request has a NAME paramter.
  if (query.ID && query.NAME) {
    // Sets the headline equal to the passed URL NAME paramter
    $('#bygID > p')
      .text(query.NAME)

    /*******************************************************************************
      BASIC LEAFLET OPTIONS
    *******************************************************************************/
    // create the map
    map = L.map('map', { // eslint-disable-line
      center: [ 55.787016, 12.522536 ],
      zoom: 16,
      maxZoom: 21,
      minZoom: 13,
      zoomControl: true,
      doubleClickZoom: false,
      editable: true // enables leaflet.editable
    })

    // GST Ortho 2016
    var aerialImagery = L.tileLayer.wms('https://kortforsyningen.kms.dk/?servicename=orto_foraar', {
      login: 'qgisdk',
      password: 'qgisdk',
      version: '1.1.1',
      layers: 'orto_foraar',
      format: 'image/png',
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
      edgeBufferTiles: 2 // extra edge tiles to buffer
    })
      .addTo(map)

    // GST skaermkort 2016
    var staticBasemap = L.tileLayer.wms('https://kortforsyningen.kms.dk/?servicename=topo_skaermkort', {
      login: 'qgisdk',
      password: 'qgisdk',
      version: '1.1.1',
      layers: 'dtk_skaermkort_graa_3',
      format: 'image/png',
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
      edgeBufferTiles: 2 // extra edge tiles to buffer
    })

    var OSMbasemap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 21,
      maxNativeZoom: 18,
      edgeBufferTiles: 2 // extra edge tiles to buffer
    })

    // Add to layer control
    var basemaps = {
      'Luftfoto': aerialImagery,
      'Skærmkort': staticBasemap,
      'Open Street Maps': OSMbasemap
    }

    var overlayMaps = {}

    map._custom = {
      'editing': null,
      'attrEdit': {
        'left': 300,
        'top': 300
      },
      'layerControl': L.control.layers(basemaps, overlayMaps, {collapsed: false})
        .addTo(map),
      'legendLayers': [],
      'snap': new L.Handler.MarkerSnap(map)
    }

    /*******************************************************************************
        Snapping functionality
    *******************************************************************************/
    // initialize the snapHandler as a global

    var snapMarker = L.marker(map.getCenter(), {
      icon: map.editTools.createVertexIcon({
        className: 'leaflet-div-icon leaflet-drawing-icon'
      }),
      opacity: 1,
      zIndexOffset: 1000
    })
    .on('snap', function (e) {
      snapMarker.addTo(map)
    })
    .on('unsnap', function (e) {
      snapMarker.remove()
    })

    var followMouse = function (e) {
      snapMarker.setLatLng(e.latlng)
    }

    map._custom.snap.watchMarker(snapMarker)

    // custom functions to easier add remove guide layers
    // loop backwards through guide array and remove layers matching ID
    map._custom.snap.removeGuide = function (layer) {
      for (var i = map._custom.snap._guides.length - 1; i >= 0; i--) {
        if (map._custom.snap._guides[ i ]._leaflet_id === layer._leaflet_id) {
          map._custom.snap._guides.splice(i, 1)
        }
      }
    }
    // Add a guide that is a polygon and is not the one that is being edited
    map._custom.snap.addGuide = function (layer) {
      if (layer instanceof L.Path) {
        if (map._custom.editing !== layer._leaflet_id) {
          map._custom.snap.addGuideLayer(layer)
        }
      }
    }

    // event listeners to add or stop snapping depending on visible layers.
    map
      .on('layeradd', function (e) {
        map._custom.snap.addGuide(e.layer)

        if (e.layer.feature) {
          if (e.layer.feature.properties) {
            if (map._custom.legendLayers.indexOf(e.layer.feature.properties.Type) === -1) {
              gF.updateLegend()
            }
          }
        }
      })
      .on('layerremove', function (e) {
        map._custom.snap.removeGuide(e.layer)
        snapMarker.remove()
      })
      .on('editable:enable', function (e) {
        map._custom.editing = e.layer._leaflet_id
        map.off('layeradd')
      })
      .on('editable:disable', function (e) {
        map._custom.editing = null
        map.on('layeradd', function (e) {
          map._custom.snap.addGuide(e.layer)
        })
      })
      .on('editable:vertex:dragstart', function (e) {
        map._custom.snap.watchMarker(e.vertex)
      })
      .on('editable:vertex:dragend', function (e) {
        map._custom.snap.unwatchMarker(e.vertex)
      })
      .on('editable:drawing:start', function () {
        this.on('mousemove', followMouse)
      })
      .on('editable:drawing:click', function (e) {
        var latlng = snapMarker.getLatLng()
        e.latlng.lat = latlng.lat
        e.latlng.lng = latlng.lng
      })
      // This only fires when an original drawing is done.
      .on('editable:drawing:end', function (e) {
        this.off('mousemove', followMouse)
        snapMarker.remove()
        if (e.layer._parts) {
          if (e.layer._parts.length > 0) {
            var layer2create = e.layer.toGeoJSON()
            var selected = $('.lastSelected').attr('ref')

            if (selected === 'undefined') {
              layer2create.properties.Type = 'Parkering'
            } else if (selected === 'byggeri') {
              layer2create.properties.Type = 'Midlertidig bygning'
            } else if (selected === 'byggeplads') {
              layer2create.properties.Type = 'Byggeplads'
            } else if (selected === 'parkering') {
              layer2create.properties.Type = 'Parkering'
            } else if (selected === 'adgangsvej') {
              layer2create.properties.Type = 'Midlertidig gangsti'
            }

            gF.dbJSON(layer2create)
            map.removeLayer(e.layer)

            $('.selected')
              .removeClass('selected')
          }
        }
      })

    /*******************************************************************************
        Get KortInfo layers and add WFS TODO: change standard style to match type
    *******************************************************************************/
    $.get('/api/get/' + query.ID, function (data) {
      for (var i = 0; i < data.length; i++) {
        // change the type to the more readable lookup type
        if (data[ i ].properties.Type) {
          // function is from styles_andlookups.js
          data[ i ].properties.Type = gS.lookUp(data[ i ].properties.Type)
        }

        // add the layer with a standard style
        gF.eventJSON(data[ i ], true)
          .addTo(map)
          .bringToFront()
      }
    })
    .fail(function (error) {
      console.log('AJAX call failed: ', error)
    })

    // WFS layers: layername, displayname, style, editable
    // functions are from layerFunctions.js
    gF.addWfsLayer('ugis:T6832', 'Byggepladser', false)
    gF.addWfsLayer('ugis:T6834', 'Parkering', false)
    gF.addWfsLayer('ugis:T6831', 'Adgangsveje', false)
    gF.addWfsLayer('ugis:T6833', 'Ombyg og Renovering', false)
    gF.addWfsLayer('ugis:T7418', 'Nybyggeri', false)
    gF.addWfsLayer('18454', 'Streetfood')

    /*******************************************************************************
        Add Buildings and lables
    *******************************************************************************/
    // Adds local dtu buildings layer
    var labels = L.layerGroup()

    var wfsBase = 'http://services.nirasmap.niras.dk/kortinfo/services/Wfs.ashx?'
    var wfsParams = {
      Site: 'Provider',
      Page: 'DTU',
      UserName: 'DTUedit',
      Password: 'Rette37g',
      Service: 'WFS',
      Request: 'GetFeature',
      Typename: 'T20047',
      Srsname: 'EPSG:3857'
    }
    var wfsRequest = wfsBase + L.Util.getParamString(wfsParams, wfsBase, true)

    $.ajax({
      url: wfsRequest,
      success: function (geom) {
        var jsonGeom = gF.GMLtoGEOJSON(geom, 'gml')
        var stpByg = L.geoJSON(jsonGeom)
        stpByg.eachLayer(function (layer) {
          layer.feature.properties.Type = 'Bygninger'
        })

        var dtuByg = gF.eventJSON(stpByg.toGeoJSON(), false)
        // Loop through buildings and create labels
        dtuByg.eachLayer(function (layer) {
          var properties = layer.feature.properties
          var bygnr = properties.DTUbygnnr
          var afsnit = properties.Afsnit

          // Create string if building if afsnit is not empty
          var postStr = 'Bygning ' + bygnr
          if (afsnit !== null && afsnit !== 0) {
            postStr += ', ' + afsnit
          }

          // Create markers at the centroid of the building and attach toolTip
          if (bygnr !== null) {
            var marker = L.marker(
                layer
                .getBounds()
                .getCenter(), {
                  opacity: 0
                }
              )
              .bindTooltip(postStr, {
                permanent: true,
                offset: [ 0, 25 ]
              })
              .openTooltip()

            labels.addLayer(marker)
          }
        })

        // add the layers to the custom layer list.
        // function is from layerFunctions.js
        gF.add2LayerList('Bygninger', dtuByg)
        gF.add2LayerList('Bygninger - Labels', labels)

        // LEGEND
        gF.updateLegend()
      }
    })

    // Start loading the interface functionality
    /*******************************************************************************
      Functionality of open and hide button left of loadInterface.
    *******************************************************************************/
    $('#openHide')
      .click(function () {
        if ($(this)
          .hasClass('open')) {
          $(this)
            .removeClass('open')
            .addClass('closed')
            .animate({
              right: 0
            }, 'fast')
            .children()
            .removeClass('fa-angle-double-right')
            .addClass('fa-angle-double-left')

          $('#input')
            .animate({
              width: 0,
              opacity: 0
            }, 'fast', function () {
              gF.updateLegend()
            })
        } else {
          $(this)
            .removeClass('closed')
            .addClass('open')
            .animate({
              right: 250
            }, 'fast')
            .children()
            .removeClass('fa-angle-double-left')
            .addClass('fa-angle-double-right')

          $('#input')
            .animate({
              width: 250,
              opacity: 1
            }, 'fast', function () {
              gF.updateLegend()
            })
        }
      })

    /*******************************************************************************
      Functionality of the "opret" buttons
    *******************************************************************************/
    $('.addGeometry')
      .click(function () {
        gF.disableEdits()
        if ($(this)
          .hasClass('selected')) {
          $('#editButtons > .selected')
            .removeClass('selected')
          $('#editButtons > .lastSelected')
            .removeClass('lastSelected')
          $(this)
            .addClass('lastSelected')
        } else {
          gF.disableEdits()
          $('#editButtons > .selected')
            .removeClass('selected')
          $('#editButtons > .lastSelected')
            .removeClass('lastSelected')
          $(this)
            .addClass('selected')
            .addClass('lastSelected')
          if ($(this)
            .attr('ref') === 'adgangsvej') {
            // create a polyline if it is a road -
            map.editTools.startPolyline()
          } else {
            // otherwise create a polygon.
            map.editTools.startPolygon()
          }
        }
      })

    /*******************************************************************************
      Hide or display the main menu items "Rediger & DTU lag"
    *******************************************************************************/
    $('.menu-item')
      .click(function () {
        if (!$(this)
          .hasClass('menu-selected')) {
          $('.menu-selected')
            .removeClass('menu-selected')
          $(this)
            .addClass('menu-selected')
          $('.theme')
            .removeClass('main')

          if ($(this)
            .is('#menu-view-top')) {
            $('#menu-view-main')
              .addClass('main')
          } else if ($(this)
            .is('#menu-edit-top')) {
            $('#menu-edit-main')
              .addClass('main')
          }
        }
      })

    /*******************************************************************************
      Disable and commit edits on "esc"-press and double click.
    *******************************************************************************/
    $('#map')
      .keyup(function (e) {
        if (e.keyCode === 27) { // esc
          gF.disableEdits()
          $('.selected')
            .removeClass('selected')
        }
      })
      .dblclick(function () {
        gF.disableEdits()
        $('.selected')
          .removeClass('selected')
      })

    /*******************************************************************************
      Enables and disables snap
    *******************************************************************************/
    $('#snapping')
      .click(function () {
        if ($(this)
          .hasClass('off')) {
          map._custom.snap.enable()
          $(this)
            .removeClass('off')
            .addClass('on')
        } else {
          map._custom.snap.disable()
          $(this)
            .removeClass('on')
            .addClass('off')
        }
      })

    /*******************************************************************************
      Add close button
    *******************************************************************************/
    $('#saveData').on('click', function () {
      $('#saveData > p').text('Ændringer gemt')
      $('#saveData').css('background', '#10b47b')
      $('#saveData').hover(function () {
        $(this).css('background-color', '#17966a')
      })
      window.close()
      setTimeout(function () {
        $('#saveData > p').text('Gem og luk kort')
        $('#saveData').css('background', '#1ca8dd')
        $('#saveData').hover(function () {
          $(this).css('background-color', '#1781a8')
        })
      }, 1000)
    })

    /*******************************************************************************
      IF not valid ID is shown, don't load interface and display error message.
    *******************************************************************************/
  } else {
    $('body').empty().html('<h1> Invalid URL parameters </h1>')
  }
}
