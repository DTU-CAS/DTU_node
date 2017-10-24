// Takes a normal geoJSON and adds custom events
gF.eventJSON = function (geoJSON, editable) {
  // if a popup is already open, close it.
  map.closePopup()

  // defined at the end.
  var layerStyle = gS.style.Standard

  // creates the layer add style at end
  var eventLayer = L.geoJSON(geoJSON, {
	style: gS.style.Standard
  })

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

            // add the layer to the database and the map, make it editable (true)
            gF.dbJSON(layerCopy, true)
          })
    }
  })
    // STYLES
    .on('mouseover', function (e) {
      // on hover take the colors and brighten + saturate them
      if (e.layer.feature && e.layer.feature.properties) {
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
      if (e.layer.feature && e.layer.feature.properties) {
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

  eventLayer.eachLayer(function (layer) {
	// console.log(layer)
    if (layer.feature.properties) {
      if (layer.feature.properties.Type) {
        var type = layer.feature.properties.Type
        if (gS.style[ type ]) {
          layerStyle = gS.style[ type ]
        } else {
          layerStyle = gS.style[ gS.lookUp(type) ]
        }
	  if (layer instanceof L.Path) {
		layer.setStyle(layerStyle)
	  }
      }
    }
  // console.log(layerStyle)

  })

  return eventLayer
}
