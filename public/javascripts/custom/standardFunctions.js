// This algorithm is from user: Quentin on GitHUB
function QueryString() {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring( 1 );
  var vars = query.split( "&" );
  for ( var i = 0; i < vars.length; i++ ) {
    var pair = vars[ i ].split( "=" );
    // If first entry with this name
    if ( typeof query_string[ pair[ 0 ] ] === "undefined" ) {
      query_string[ pair[ 0 ] ] = decodeURIComponent( pair[ 1 ] );
      // If second entry with this name
    } else if ( typeof query_string[ pair[ 0 ] ] === "string" ) {
      var arr = [ query_string[ pair[ 0 ] ], decodeURIComponent( pair[ 1 ] ) ];
      query_string[ pair[ 0 ] ] = arr;
      // If third or later entry with this name
    } else {
      query_string[ pair[ 0 ] ].push( decodeURIComponent( pair[ 1 ] ) );
    }
  }
  return query_string;
}

function bounds2Arr( bounds, reverse ) {
  if ( reverse === false ) {
    return [
      [ bounds._northEast.lat, bounds._northEast.lng ],
      [ bounds._southWest.lat, bounds._southWest.lng ]
    ];
  } else {
    return [
      [ bounds._northEast.lng, bounds._northEast.lat ],
      [ bounds._southWest.lng, bounds._southWest.lat ]
    ];
  }
}

function arr2bounds( arr, reverse ) {
  if ( reverse === false ) {
    return L.latLngBounds(
      L.latLng( arr[ 0 ][ 0 ], arr[ 0 ][ 1 ] ),
      L.latLng( arr[ 1 ][ 0 ], arr[ 1 ][ 1 ] )
    );
  } else {
    return L.latLngBounds(
      L.latLng( arr[ 0 ][ 1 ], arr[ 0 ][ 0 ] ),
      L.latLng( arr[ 1 ][ 1 ], arr[ 1 ][ 0 ] )
    );
  }
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

function enableEdits() {
  edd = 1;
  map.eachLayer( function ( layer ) {
    // console.log(layer);
    if ( layer instanceof L.Path ) {
      if ( typeof layer.editor == 'undefined' ) {
        if ( layer.options.editable !== false ) {
          layer.enableEdit();
        }
      }
    }
  } );
}

function disableEdits() {
  edd = 0;
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
              edd = 1;

              for ( var i = snap._guides.length - 1; i >= 0; i-- ) {
                if ( snap._guides[ i ]._leaflet_id === e.layer._leaflet_id ) {
                  snap._guides.splice( i, 1 );
                }
              }

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
              edd = 0;
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

            edd = 1;

            addJSON( layerCopy, true );
            editPanel( layerCopy );

          } );
      }
    } )
    .on( 'mouseover', function ( e ) {
      var feature = this.getLayer( e.layer._leaflet_id );

      feature.setStyle({
        color: chroma(feature.options.color).brighten().saturate(),
        fillColor: chroma(feature.options.fillColor).brighten().saturate(),
        opacity: feature.options.opacity * 1.2,
        fillOpacity: feature.options.fillOpacity * 1.2,
        weight: feature.options.weight * 1.15
      });
    } )
    .on( 'mouseout', function ( e ) {
      var feature = this.getLayer( e.layer._leaflet_id );
      feature.setStyle( style );
    } );

  return eventLayer;
}

function addWMSlayer( string, name ) {
  var layer = L.tileLayer.wms( "http://services.nirasmap.niras.dk/kortinfo/services/Wms.ashx?", {
    site: 'Provider',
    page: 'DTU',
    userName: 'DTUView',
    password: 'Bruger12',
    loginType: "KortInfo",
    service: 'WMS',
    version: "1.1.1",
    layers: string,
    transparent: true,
    format: 'image/png',
    maxZoom: 21,
    maxNativeZoom: 18,
    attribution: '&copy; <a href="http://DTU.dk">Danish Technical University</a>'
  } );

  add2LayerList( name, layer );
}

function addWfsLayer( string, name, style, editable ) {
  var wfsBase = "http://services.nirasmap.niras.dk/kortinfo/services/Wfs.ashx?";
  var wfsParams = {
    Site: 'Provider',
    Page: 'DTU',
    UserName: 'DTUedit',
    Password: 'Rette37g',
    Service: 'WFS',
    Request: 'GetFeature',
    Typename: string,
    Srsname: 'EPSG:3857',
  };
  var wfsRequest = wfsBase + L.Util.getParamString( wfsParams, wfsBase, true );

  $.ajax( {
    url: wfsRequest,
    success: function ( result ) {
      var geom = GML2GeoJSON( result, true );
      var layer = eventJSON( geom, style, editable );
      layer.eachLayer( function ( layer ) {
        layer.options.editable = false;
        // console.log(layer);
      } );

      add2LayerList( name, layer );

    }
  } );
}

function add2LayerList( name, layer ) {
  var listItem = $( "<li class='unselectable-text layer layer-off'><p>" + name + "</p></li>" )
    .on( "click", function () {
      if ( $( this )
        .hasClass( "layer-on" ) ) {
        $( this )
          .removeClass( "layer-on" )
          .addClass( "layer-off" );
        map.removeLayer( layer );
      } else {
        $( this )
          .removeClass( "layer-off" )
          .addClass( "layer-on" );
        map.addLayer( layer );
      }
    } );
  $( "#layers" )
    .append( listItem );
}

function addGFI( e ) {
  var layerString = "";
  for ( var j = 0; j < wmsLayers.length; j++ ) {
    layerString += wmsLayers[ j ][ 0 ];
    if ( j !== wmsLayers.length - 1 ) {
      layerString += ",";
    }
  }

  var latLng = e.latlng;
  var point = map.latLngToContainerPoint( latLng, map.getZoom() );
  var size = map.getSize();

  // convert boundbox to srs
  var WGS84Param = proj4( "EPSG:4326" );
  var coordinateSystem = proj4( epsg[ "25832" ] );
  var bbox = bounds2Arr( map.getBounds(), true );
  bbox[ 0 ] = proj4( WGS84Param, coordinateSystem, bbox[ 0 ] );
  bbox[ 1 ] = proj4( WGS84Param, coordinateSystem, bbox[ 1 ] );
  bbox = arr2bounds( bbox, true )
    .toBBoxString();

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

  var content = layerURL + L.Util.getParamString( params, layerURL, true );

  $.ajax( {
    url: content,
    success: function ( result ) {
      var fields = result.getElementsByTagName( "field" );

      if ( fields.length > 0 ) {
        var tableContent = "<table>";
        for ( var i = 0; i < fields.length; i++ ) {
          tableContent +=
            "<tr class='table-row'>" +
            "<td>" + $( fields[ i ] )
            .attr( "name" ) + "</td>" +
            "<td>" + fields[ i ].innerHTML + "</td>";
        }
        tableContent += "</table>";

        L.popup( {
            maxWidth: "600px"
          } )
          .setLatLng( latLng )
          .setContent( tableContent )
          .openOn( map );
      }
    }
  } );
}

/*
 * Workaround for 1px lines appearing in some browsers due to fractional transforms
 * and resulting anti-aliasing.
 * https://github.com/Leaflet/Leaflet/issues/3575
 */
( function () {
  var originalInitTile = L.GridLayer.prototype._initTile;
  L.GridLayer.include( {
    _initTile: function ( tile ) {
      originalInitTile.call( this, tile );
      var tileSize = this.getTileSize();
      tile.style.width = tileSize.x + 1 + 'px';
      tile.style.height = tileSize.y + 1 + 'px';
    }
  } );
} )();

function getFields( string ) {
  if ( string === "byggeri" ) {
    return [
      "Anlæg",
      "Midlertidig bygning",
      "Ombygning/renovering",
      "Nybyggeri"
    ];
  } else if ( string === "byggeplads" ) {
    return [
      "Byggeplads"
    ];
  } else if ( string === "adgangsvej" ) {
    return [
      "Tung trafik",
      "Midlertidig gangsti",
      "Lukket for gennemkørsel"
    ];
  } else if ( string === "parkering" ) {
    return [
      "Parkering",
      "Materialelager"
    ];
  } else if ( string === "status" ) {
    return [
      "Aktivt",
      "Afsluttet",
      "Garanti",
      "Ongoing"
    ];
  } else if ( string === "all" ) {
    return [
      "Anlæg",
      "Midlertidig bygning",
      "Ombygning/renovering",
      "Nybyggeri",
      "Byggeplads",
      "Tung trafik",
      "Midlertidig gangsti",
      "Lukket for gennemkørsel",
      "Parkering",
      "Materialelager"
    ];
  } else {
    return [];
  }
}

function lookUp( string ) {
  var typeLookUp = {
    "BYR": "Ombygning/renovering",
    "BYM": "Midlertidig bygning",
    "ANL": "Anlæg",
    "BYO": "Nybyggeri",
    "BPH": "Byggeplads",
    "AVT": "Tung trafik",
    "GSA": "Midlertidig gangsti",
    "AVK": "Lukket for gennemkørsel",
    "PKA": "Materialelager",
    "PKH": "Parkering",
    "Ombygning/renovering": "BYR",
    "Midlertidig bygning": "BYM",
    "Anlæg": "ANL",
    "Byggeplads": "BPH",
    "Tung trafik": "AVT",
    "Midlertidig gangsti": "GSA",
    "Lukket for gennemkørsel": "AVK",
    "Materialelager": "PKA",
    "Parkering": "PKH",
    "Nybyggeri": "BYO"
  };
  return typeLookUp[ string ];
}
