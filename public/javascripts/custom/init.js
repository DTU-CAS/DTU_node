// Initialize the interface
function init() {
  // Query the URL for parameters
  var query = QueryString();

  // Check if the ID is correct and if the request has a NAME paramter.
  if ( query.ID && query.NAME ) {

    // Sets the headline equal to the passed URL NAME paramter
    jQuery( "#bygID > p" )
      .text( query.NAME );

    /*******************************************************************************
      BASIC LEAFLET OPTIONS
    *******************************************************************************/
    // create the map
    map = L.map( 'map', {
      center: [ 55.787016, 12.522536 ],
      zoom: 16,
      maxZoom: 21,
      minZoom: 13,
      zoomControl: true,
      doubleClickZoom: false,
      editable: true // enables leaflet.editable
    } );

    // GST Ortho 2016
    var GST_Ortho = L.tileLayer.wms( 'https://kortforsyningen.kms.dk/?servicename=orto_foraar', {
        login: 'qgisdk',
        password: 'qgisdk',
        version: '1.1.1',
        layers: 'orto_foraar',
        format: 'image/png',
        maxZoom: 21,
        maxNativeZoom: 18,
        attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
        edgeBufferTiles: 2 // extra edge tiles to buffer
      } )
      .addTo( map );

    // GST skaermkort 2016
    var GST_Skaerm = L.tileLayer.wms( 'https://kortforsyningen.kms.dk/?servicename=topo_skaermkort', {
      login: 'qgisdk',
      password: 'qgisdk',
      version: '1.1.1',
      layers: 'dtk_skaermkort_graa_3',
      format: 'image/png',
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
      edgeBufferTiles: 2 // extra edge tiles to buffer
    } );

    var OSMbasemap = L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 21,
      maxNativeZoom: 18,
      edgeBufferTiles: 2 // extra edge tiles to buffer
    } );

    // Add to layer control
    var basemaps = {
      "Luftfoto": GST_Ortho,
      "Skærmkort": GST_Skaerm,
      "Open Street Maps": OSMbasemap
    };

    var overlayMaps = {
      // ...
    };

    var mainControl = L.control.layers( basemaps, overlayMaps, {
        collapsed: false
      } )
      .addTo( map );

    /*******************************************************************************
        Snapping functionality
    *******************************************************************************/
    snap = new L.Handler.MarkerSnap( map );

    var snapMarker = L.marker( map.getCenter(), {
      icon: map.editTools.createVertexIcon( {
        className: 'leaflet-div-icon leaflet-drawing-icon'
      } ),
      opacity: 1,
      zIndexOffset: 1000
    } );

    snapMarker
      .on( 'snap', function ( e ) {
        snapMarker.addTo( map );
      } )
      .on( 'unsnap', function ( e ) {
        snapMarker.remove();
      } );

    snap.removeGuide = function ( layer ) {
      for ( var i = snap._guides.length - 1; i >= 0; i-- ) {
        if ( snap._guides[ i ]._leaflet_id === layer._leaflet_id ) {
          snap._guides.splice( i, 1 );
        }
      }
    };

    var followMouse = function ( e ) {
      snapMarker.setLatLng( e.latlng );
    };

    snap.watchMarker( snapMarker );

    map
      .on( "editable:enable", function ( e ) {
        map._editing = e.layer._leaflet_id;
      } )
      .on( "editable:disable", function ( e ) {
        map._editing = null;
      } )
      .on( 'editable:vertex:dragstart', function ( e ) {
        snap.watchMarker( e.vertex );
      } )
      .on( 'editable:vertex:dragend', function ( e ) {
        snap.unwatchMarker( e.vertex );
      } )
      .on( 'editable:drawing:start', function () {
        this.on( 'mousemove', followMouse );
      } )
      .on( 'editable:drawing:click', function ( e ) {
        var latlng = snapMarker.getLatLng();
        e.latlng.lat = latlng.lat;
        e.latlng.lng = latlng.lng;
      } )
      .on( 'editable:drawing:end', function ( e ) {
        this.off( 'mousemove', followMouse );
        snapMarker.remove();
        if ( e.layer._parts ) {
          if ( e.layer._parts.length > 0 ) {
            addJSON( e.layer.toGeoJSON() );
            map.removeLayer( e.layer );
            $( ".selected" )
              .removeClass( "selected" );
          }
        }
      } );

    map.on( 'layeradd', function ( e ) {
      if ( e.layer instanceof L.Path ) {
        if ( map._editing !== e.layer._leaflet_id ) {
          snap.addGuideLayer( e.layer );
        }
      }
    } );

    map.on( 'layerremove', function ( e ) {
      snap.removeGuide( e.layer );
    } );

    $( "#snapping" )
      .click( function () {
        if ( $( this )
          .hasClass( "off" ) ) {
          snap.enable();
          $( this )
            .removeClass( "off" )
            .addClass( "on" );
        } else {
          snap.disable();
          $( this )
            .removeClass( "on" )
            .addClass( "off" );
        }
      } );

    /*******************************************************************************
        Get KortInfo layers and add WFS
    *******************************************************************************/
    $.get( '/api/get/' + query.ID, function ( data ) {
      for ( var i = 0; i < data.length; i++ ) {
        // console.log(data[i]);
        if ( data[ i ].properties.Type ) {
          data[ i ].properties.Type = lookUp( data[ i ].properties.Type );
        }

        var addLayer = eventJSON( data[ i ], style.Standard, true )
          .addTo( map );
      }
    } );

    // WFS layers: layername, displayname, style, editable
    addWfsLayer( "ugis:T6832", "Byggepladser", style.Byggepladser, false );
    addWfsLayer( "ugis:T6834", "Parkering", style.Parkering, false );
    addWfsLayer( "ugis:T6831", "Adgangsveje", style.Adgangsveje, false );
    addWfsLayer( "ugis:T6833", "Ombyg og Renovering", style[ "Ombyg og Renovering" ], false );
    addWfsLayer( "ugis:T7418", "Nybyggeri", style.Nybyggeri, false );
    addWMSlayer( "18454", "Streetfood" );

    /*******************************************************************************
        Add Buildings and lables (local file) TODO: get buildings from WFS
    *******************************************************************************/
    // Adds local dtu buildings layer
    var labels = L.layerGroup();

    var dtuByg = eventJSON( dtu_bygninger, style.Bygninger, false );
    // Loop through buildings and create labels
    dtuByg.eachLayer( function ( layer ) {

      var properties = layer.feature.properties;
      var bygnr = properties.DTUbygnnr;
      var afsnit = properties.Afsnit;

      // Create string if building if afsnit is not empty
      var postStr = "Bygning " + bygnr;
      if ( afsnit !== null && afsnit !== 0 ) {
        postStr += ", " + afsnit;
      }

      // Create markers at the centroid of the building and attach toolTip
      if ( bygnr !== null ) {
        var marker = L.marker(
            layer
            .getBounds()
            .getCenter(), {
              opacity: 0
            }
          )
          .bindTooltip( postStr, {
            permanent: true,
            offset: [ 0, 25 ]
          } )
          .openTooltip();

        labels.addLayer( marker );
      }
    } );

    add2LayerList( "Bygninger", dtuByg );
    add2LayerList( "Bygninger - Labels", labels );

    // Start loading the interface
    interface();

    /*******************************************************************************
      IF not valid ID is shown, don't load interface and display error message.
    *******************************************************************************/
  } else {
    jQuery( "body" )
      .empty()
      .html( "<p> Wrong URL parameters </p>" );
  }
}
