/*
  loop through layers and find the ones that are being edited.
  if a layer is being edited, stop editing and update the database
*/
function disableEdits() {
  map.eachLayer( function ( layer ) {
    if ( layer.editor ) {
      if ( layer.editor._enabled === true ) {
        layer.toggleEdit();
        var layerStyle;

        // update the layer attributes to correspond with the "rediger attributer table"
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

        // create the object to send to the database
        // use the lookup table to convert back to acronym form.
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

          // add to snap layer and update database
          snap.addGuideLayer( layer );
          db.update( updateObj );

          // update legend
          updateLegend();

          if(layer.feature.properties){
            if (layer.feature.properties.Type){
              var type = layer.feature.properties.Type;
              if ( l_styles[ type ]  ){
                layerStyle = l_styles[ type ];
              } else {
                layerStyle = l_styles[ lookUp(type) ];
              }
            }
          } else {
            layerStyle = l_styles.Standard;
          }
          layer.setStyle( layerStyle );
        }
      }
    }
  } );

  // remove popup menues
  $( ".infoEdit, .slide-menu" )
    .remove();
}

/*
  Adds new layers to the map as well as the database
*/
function dbJSON( json, editable ) {
  var projektType = $( ".lastSelected" )
    .attr( "ref" );

  // takes the URL parameters and add to the newly created layer
  json.properties = {
    "ProjektID": QueryString().ID,
    "Navn": QueryString().NAME,
    "Status": getFields( "status" )[ 0 ],
    "Type": json.properties.Type
  };

  // prepares the layer for upload to the database.
  var preObject = {
    CG_GEOMETRY: json.geometry,
    ProjektID: json.properties.ProjektID,
    Type: lookUp( json.properties.Type ), // changes the type back to abbreviative
    Navn: json.properties.Navn,
    Status: json.properties.Status
  };

  // readies the keys and attrbute for db post
  // TODO: this should be in the DB.js script
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

  // post the layer to the database
  // gets the latest ID before posting it.
  $.ajax( {
      type: "POST",
      url: '/api/post/',
      dataType: "json",
      data: postObj
    } )
    .done( function () {

      // get latest ID
      $.ajax( {
          type: "GET",
          url: '/api/latest/',
          dataType: "json"
        } )
        .done( function ( res ) {
          console.log( res );
          // translate the wellknown text to JSON
          var wkt = new Wkt.Wkt();
          wkt.read( JSON.stringify( json ) )
            .write();
          // set the ID equal to the latests
          json.properties.CG_ID = res;

          // add the layer to the map
          // TODO: change style to match type
          var addLayer = eventJSON( json, true)
            .addTo( map );

          if ( editable === true ) {
            editPanel( json );
          }

          // if the layer is suppose to be editable, remove it from guidelayers
          // and enable edits.
          if ( editable === true ) {
            addLayer.eachLayer( function ( layer ) {
              if ( layer instanceof L.Path ) {
                if ( typeof layer.editor == 'undefined' ) {
                  if ( layer.options.editable !== false ) {
                    snap.removeGuide( layer );
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

/*
  Takes a normal geoJSON and adds custom events
*/
function eventJSON( geoJSON, editable ) {
  // if a popup is already open, close it.
  map.closePopup();

  // defined at the end.
  var layerStyle = l_styles.Standard;

  // creates the layer add style at end
  var eventLayer = L.geoJSON( geoJSON )

  /*******************************************************************************
      CLICK CLICK CLICK CLICK CLICK CLICK CLICK CLICK CLICK CLICK CLICK
  *******************************************************************************/
  .on( 'click', function ( e ) {
      // set up variables
      var layer = e.layer,
        feature = layer.feature;

      // pan to layer
      map.panTo( layer.getCenter() );

      // create a poput and set information equal to properties.
      L.popup( {
          closeButton: false
        } )
        .setLatLng( layer.getCenter() )
        // function is from infoPanel.js
        .setContent( infoPanel( feature.properties, editable ) )
        .openOn( map );

      /*******************************************************************************
          If it is suppose to be editable (rediger and delete buttons)
      *******************************************************************************/
      // If the layer is clicked and editing is already enabled,
      // show "Gem geometri instead of 'rediger'"
      if ( editable === true ) {
        if ( layer.editEnabled() === true ) {
          $( "#editGeom" )
            .removeClass( "disabled-edit" )
            .addClass( "enabled-edit" );
          $( "#editGeom" )
            .first()
            .text( "Gem geometri" );
        }

        // EDIT GEOMETRY
        $( "#editGeom" )
          .click( function () {
            // If we are starting an editing session
            if ( $( this )
              .hasClass( "disabled-edit" ) ) {
              $( this )
                .removeClass( "disabled-edit" )
                .addClass( "enabled-edit" );
              $( this )
                .first()
                .text( "Gem geometri" );
              $( ".infoEdit, .slide-menu" )
                .remove();

              // stop any previous editing
              disableEdits();

              // remove itself from the guide array
              snap.removeGuide( layer );

              // enable editing
              layer.enableEdit();

              // close the popup so it doesn't obscure the geometry
              map.closePopup();

              // open the editPanel (Edit attributes)
              editPanel( feature );

              // if we are ending the editing session
            } else {
              // disable editing
              layer.toggleEdit();

              $( this )
                .removeClass( "enabled-edit" )
                .addClass( "disabled-edit" );
              $( this )
                .first()
                .text( "Rediger" );

              // update the layer.properties to match the editPanel
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

              $( ".infoEdit" )
                .remove();

              // prepare the object for the database
              var updateObj = {};
              for ( var key in layer.feature.properties ) {
                if ( layer.feature.properties.hasOwnProperty( key ) ) {
                  if ( layer.feature.properties[ key ] !== null ) {
                    if ( key === "Type" ) {
                      // loopUp is from styles_andlookups.js
                      updateObj[ key ] = lookUp( layer.feature.properties[ key ] );
                    } else {
                      updateObj[ key ] = layer.feature.properties[ key ];
                    }
                  }
                }
              }

              // Update the database
              updateObj.CG_GEOMETRY = layer.toGeoJSON()
                .geometry;
              db.update( updateObj );

              // add the edited layer to the guide arrays
              snap.addGuideLayer( layer );

              // update legend
              updateLegend();
            }
          } );

        // REMOVE GEOMETRY
        $( "#deleteGeom" )
          .click( function () {
            // remove the layer from the map
            map.removeLayer( layer );
            // close popups
            map.closePopup();
            // delete the ID from the database
            db.delete( "ALL", layer.feature.properties.CG_ID );
            // stop any editing
            disableEdits();
          } );

        // If it is not suppose to be editable:
      } else {

        // COPY GEOMETRY
        $( "#copyGeom" )
          .click( function () {
            // close popups
            map.closePopup();

            // close any editing going on
            disableEdits();

            // create a geojson copy
            var layerCopy = layer.toGeoJSON();
            // get all fields from styles_and_lookups.js
            var allFields = getFields( "all" );
            // add properties from URL parameters

            if(lookUp(layer.feature.properties.Type) !== "undefined"){
              layerCopy.properties.Type = lookUp(layer.feature.properties.Type);
            } else {
              layerCopy.properties.Type = layer.feature.properties.Type;
            }

            if(
              layerCopy.properties.Type === "undefined" ||
              layerCopy.properties.Type === undefined
            ){
              layerCopy.properties.Type = "undefined";
            }

            // add the layer to the database and the map, make it editable (true)
            dbJSON( layerCopy, true );

          } );
      }
    } )
    // STYLES
    .on( 'mouseover', function ( e ) {
      // on hover take the colors and brighten + saturate them
      e.layer.setStyle( {
        color: "rgba(" + chroma( e.layer.options.color )
          .brighten()
          .saturate()
          .rgba() + ")",
        fillColor: "rgba(" + chroma( e.layer.options.fillColor )
          .brighten()
          .saturate()
          .rgba() + ")",
        opacity: e.layer.options.opacity * 1.2,
        fillOpacity: e.layer.options.fillOpacity * 1.2,
        weight: e.layer.options.weight * 1.2
      } );
    } )
    // on mouse out reset style
    .on( 'mouseout', function ( e ) {
      if(e.layer.feature.properties){
        if (e.layer.feature.properties.Type){
          var type = e.layer.feature.properties.Type;
          if ( l_styles[ type ]  ){
            e.layer.setStyle( l_styles[ type ]);
          } else {
            e.layer.setStyle( l_styles[ lookUp(type) ] );
          }
        }
      } else {
        e.layer.setStyle( l_styles.Undefined );
      }
    } );

  // console.log(layerStyle);
  eventLayer.eachLayer(function(layer){
    if(layer.feature.properties){
      if (layer.feature.properties.Type){
        var type = layer.feature.properties.Type;
        if ( l_styles[ type ]  ){
          layerStyle = l_styles[ type ];
        } else {
          layerStyle = l_styles[ lookUp(type) ];
        }
      }
    }
    layer.setStyle( layerStyle );
  });

  return eventLayer;
}
