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
