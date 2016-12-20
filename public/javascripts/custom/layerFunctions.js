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
      updateLegend();
    }
  );
  $( "#layers" )
    .append( listItem );
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

function addWfsLayer( string, name, editable ) {
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
      // Parse the return GML file
      // Function is from gmlParser.js
      var geom = GML2GeoJSON( result, true );

      // add the layer to the map
      // function is from eventLayers.js
      var layer = eventJSON( geom, editable );

      // whether or not it should be possible to edit the layer
      if(editable === false){
        layer.eachLayer( function ( layer ) {
          layer.options.editable = false;
        } );
      } else {
        layer.eachLayer( function ( layer ) {
          layer.options.editable = true;
        } );
      }

      // function is from layerFunctions.js
      add2LayerList( name, layer );
    }
  } );
}
