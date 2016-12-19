function disableEdits() {
  map.editTools.stopDrawing();
  map.eachLayer( function ( layer ) {
    if ( layer.editor ) {
      if ( layer.editor._enabled === true ) {
        layer.toggleEdit();

        $( "#infoTable > tr > .key" )
          .each( function () {
            if ( $( this )
              .siblings()
              .text() === "null" || $( this )
              .siblings()
              .text()
              .length === 0 ) {
              layer.feature.properties[ $( this )
                .attr( "ref" ) ] = null;
            } else {
              layer.feature.properties[ $( this )
                  .attr( "ref" ) ] = $( this )
                .siblings()
                .text();
            }
          } );

        if ( layer.feature ) {
          var updateObj = {};
          for ( var key in layer.feature.properties ) {
            if ( layer.feature.properties.hasOwnProperty( key ) ) {
              if ( layer.feature.properties[ key ] !== null ) {
                if ( key === "Type" ) {
                  updateObj[ key ] = lookUp( layer.feature.properties[ key ] );
                } else {
                  updateObj[ key ] = layer.feature.properties[ key ];
                }
              }
            }
          }
          updateObj.CG_GEOMETRY = layer.toGeoJSON()
            .geometry;
          snap.addGuideLayer( layer );
          db.update( updateObj );
        }
      }
    }
  } );
  $( ".infoEdit, .slide-menu" )
    .remove();
}

function addJSON( json, editable ) {
  if ( editable !== true ) {
    var projektType = $( ".lastSelected" )
      .attr( "ref" );

    json.properties = {
      "ProjektID": QueryString()
        .ID,
      "Type": getFields( projektType )[ 0 ],
      "Navn": QueryString()
        .NAME,
      "Status": getFields( "status" )[ 0 ]
    };
  }

  var preObject = {
    CG_GEOMETRY: json.geometry,
    ProjektID: json.properties.ProjektID,
    Type: lookUp( json.properties.Type ),
    Navn: json.properties.Navn,
    Status: json.properties.Status
  };

  if ( json.properties.Navn && json.properties.Navn !== null ) {
    preObject.Navn = json.properties.Navn;
  }
  if ( json.properties.Status && json.properties.Status !== null ) {
    preObject.Status = json.properties.Status;
  }

  var keys = '';
  var values = '';
  for ( var key in preObject ) {
    if ( preObject.hasOwnProperty( key ) ) {
      if ( key !== "CG_GEOMETRY" ) {
        keys += key + ", ";
        values += "'" + preObject[ key ] + "', ";
      }
    }
  }
  keys = keys.slice( 0, -2 );
  values = values.slice( 0, -2 );

  var postObj = {
    "keys": keys,
    "values": values,
    "geometry": JSON.stringify( preObject.CG_GEOMETRY )
  };

  console.log( "postObj: ", postObj );

  $.ajax( {
      type: "POST",
      url: '/api/post/',
      dataType: "json",
      data: postObj
    } )
    .done( function () {

      $.ajax( {
          type: "GET",
          url: '/api/latest/',
          dataType: "json"
        } )
        .done( function ( res ) {
          console.log( res );
          var wkt = new Wkt.Wkt();
          wkt.read( JSON.stringify( json ) )
            .write();
          json.properties.CG_ID = res;

          var addLayer = eventJSON( json, style.Standard,
              true
            )
            .addTo( map );

          if ( editable === true ) {
            // addLayer.options.editable = true;
            addLayer.eachLayer( function ( layer ) {
              if ( layer instanceof L.Path ) {
                if ( typeof layer.editor == 'undefined' ) {
                  if ( layer.options.editable !== false ) {
                    layer.enableEdit();
                  }
                }
              }
            } );
          }
        } )
        .fail( function ( jqXHR, status, error ) {
          console.log( "AJAX call failed: ", jqXHR );
        } );
    } )
    .fail( function ( jqXHR, status, error ) {
      console.log( "AJAX call failed: ", jqXHR );
    } );
}

function eventJSON( geoJSON, style, editable ) {
  var eventLayer = L.geoJSON( geoJSON, {
      "style": style
    } )
    .on( 'click', function ( e ) {

      var layer = this.getLayer( e.layer._leaflet_id ),
        feature = layer.feature,
        latLng = e.latlng;
      leafletID = e.layer._leaflet_id;

      map.panTo( latLng );

      if ( $( ".infoEdit" )
        .length > 0 ) {
        $( "#infoTable > tr > .key" )
          .each( function () {
            if ( $( this )
              .siblings()
              .text() === "null" || $( this )
              .siblings()
              .text()
              .length === 0 ) {
              layer.feature.properties[ $( this )
                .attr( "ref" ) ] = null;
            } else {
              layer.feature.properties[ $( this )
                  .attr( "ref" ) ] = $( this )
                .siblings()
                .text();
            }
          } );
      }

      L.popup( {
          closeButton: false
        } )
        .setLatLng( latLng )
        .setContent( infoPanel( feature.properties, editable ) )
        .openOn( map );

      $( ".leaflet-popup" )
        .css( "width", "284px" );

      if ( editable === true ) {
        if ( layer.editEnabled() === true ) {
          $( "#editGeom" )
            .removeClass( "disabled-edit" )
            .addClass( "enabled-edit" );
          $( "#editGeom" )
            .first()
            .text( "Gem geometri" );
        }

        $( "#editGeom" )
          .click( function () {
            if ( $( this )
              .hasClass( "disabled-edit" ) ) {
              disableEdits();
              $( ".infoEdit, .slide-menu" )
                .remove();

              snap.removeGuide( e.layer );

              layer.enableEdit();

              $( this )
                .removeClass( "disabled-edit" )
                .addClass( "enabled-edit" );
              $( this )
                .first()
                .text( "Gem geometri" );
              map.closePopup();
              editPanel( feature );
            } else {

              layer.toggleEdit();
              $( this )
                .removeClass( "enabled-edit" )
                .addClass( "disabled-edit" );
              $( this )
                .first()
                .text( "Rediger" );

              $( "#infoTable > tr > .key" )
                .each( function () {
                  if ( $( this )
                    .siblings()
                    .text() === "null" || $( this )
                    .siblings()
                    .text()
                    .length === 0 ) {
                    layer.feature.properties[ $( this )
                      .attr( "ref" ) ] = null;
                  } else {
                    layer.feature.properties[ $( this )
                        .attr( "ref" ) ] = $( this )
                      .siblings()
                      .text();
                  }
                } );

              var updateObj = {};
              for ( var key in layer.feature.properties ) {
                if ( layer.feature.properties.hasOwnProperty( key ) ) {
                  if ( layer.feature.properties[ key ] !== null ) {
                    if ( key === "Type" ) {
                      updateObj[ key ] = lookUp( layer.feature.properties[ key ] );
                    } else {
                      updateObj[ key ] = layer.feature.properties[ key ];
                    }
                  }
                }
              }

              updateObj.CG_GEOMETRY = layer.toGeoJSON()
                .geometry;

              db.update( updateObj );
              $( ".infoEdit" )
                .remove();
              snap.addGuideLayer( layer );
            }
          } );

        $( "#deleteGeom" )
          .click( function () {
            map.removeLayer( layer );
            map.closePopup();
            db.delete( "ALL", layer.feature.properties.CG_ID );
            disableEdits();
          } );
      } else {
        $( "#copyGeom" )
          .click( function () {
            map.closePopup();

            var layerCopy = layer.toGeoJSON();
            var allFields = getFields( "all" );

            layerCopy.properties = {
              "ProjektID": QueryString()
                .ID,
              "Navn": QueryString()
                .NAME,
            };

            if ( allFields.indexOf( layer.feature.properties.Type === -1 ) ) {
              layerCopy.properties.Type = lookUp( layer.feature.properties.Type );
            } else {
              layerCopy.properties.Type = layer.feature.properties.Type;
            }

            if (
              layerCopy.properties.Status === null ||
              layerCopy.properties.Status === "null" ||
              layerCopy.properties.Status === "undefined" ||
              layerCopy.properties.Status === undefined
            ) {
              layerCopy.properties.Status = getFields( "status" )[ 0 ];
            }

            // map._editing = true;

            addJSON( layerCopy, true );
            editPanel( layerCopy );

          } );
      }
    } )
    .on( 'mouseover', function ( e ) {
      var feature = this.getLayer( e.layer._leaflet_id );

      feature.setStyle( {
        color: chroma( feature.options.color )
          .brighten()
          .saturate(),
        fillColor: chroma( feature.options.fillColor )
          .brighten()
          .saturate(),
        opacity: feature.options.opacity * 1.2,
        fillOpacity: feature.options.fillOpacity * 1.2,
        weight: feature.options.weight * 1.15
      } );
    } )
    .on( 'mouseout', function ( e ) {
      var feature = this.getLayer( e.layer._leaflet_id );
      feature.setStyle( style );
    } );

  return eventLayer;
}
