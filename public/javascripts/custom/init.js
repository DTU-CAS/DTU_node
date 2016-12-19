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

    addWfsLayer( "ugis:T6832", "Byggepladser", style.Byggepladser, false);
    addWfsLayer( "ugis:T6834", "Parkering", style.Parkering, false );
    addWfsLayer( "ugis:T6831", "Adgangsveje", style.Adgangsveje, false );
    addWfsLayer( "ugis:T6833", "Ombyg og Renovering", style["Ombyg og Renovering"], false );
    addWfsLayer( "ugis:T7418", "Nybyggeri", style.Nybyggeri, false );

/*******************************************************************************
    Add Buildings and lables (local file) TODO: get buildings from WFS
*******************************************************************************/

    var dtuByg = eventJSON( dtu_bygninger, style.Bygninger, false );
    var labels = L.layerGroup();

    dtuByg.eachLayer( function ( layer ) {

      var properties = layer.feature.properties;
      var bygnr = properties.DTUbygnnr;
      var afsnit = properties.Afsnit;

      var postStr = "Bygning " + bygnr;
      if ( afsnit !== null && afsnit !== 0 ) {
        postStr += ", " + afsnit;
      }

      if ( bygnr !== null ) {
        var marker = L.marker(
            layer.getBounds()
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
    addWMSlayer( "18454", "Streetfood" );

    interface();

    } else {
      jQuery( "body" )
        .empty()
        .html("<p> Wrong URL parameters </p>");
    }
}
