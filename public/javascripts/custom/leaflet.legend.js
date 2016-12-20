// Casper Fibaek - NIRAS
// Leaflet Legend
// Optimize

function updateLegend() {
  $( ".legend" )
    .empty();
  $( "#text-bg" )
    .remove();
  map._legendLayers = [];

  map.eachLayer( function ( layer ) {
    if ( layer instanceof L.Path ) {
      if ( layer.options && layer.feature.properties ) {
        if ( map._legendLayers.indexOf( layer.feature.properties.Type ) === -1 ) {
          map._legendLayers.push( layer.feature.properties.Type );

          var st = layer.options;

          var borderColor = "rgba(" + String( chroma( st.color )
            .alpha( st.opacity )
            .rgba() ) + ")";
          var fillColor = "rgba(" + String( chroma( st.fillColor )
            .alpha( st.fillOpacity )
            .rgba() ) + ")";

          // change for lookup
          var row = $( "<tr class='legend-row'></tr>" );

          // readability > brevity
          var dash;
          var text;
          var type;
          var postText;

          if ( abbr( layer.feature.properties.Type ) === true ) {
            type = String( lookUp( layer.feature.properties.Type ) );
          } else {
            type = String( layer.feature.properties.Type );
          }

          if ( st.dashArray ) {
            dash = "dashed";
          } else {
            dash = "solid";
          }

          var color = $( "<td class='legend-color'></td>" )
            .css( "border", st.weight + "px " + dash + " " + borderColor )
            .css( "background", fillColor );

          if ( layer.feature.properties.DTUbygnnr ) {
            text = $( "<td class='legend-name'>" + "Bygninger" + "</td>" );
            postText = "Bygninger";
          } else {
            text = $( "<td class='legend-name'>" + type + "</td>" );
            postText = type;
          }

          // If it is not already added to the legend;
          if ( $( ".legend-name" )
            .text()
            .indexOf( postText ) === -1 ) {
            $( row )
              .append( color )
              .append( text );

            $( ".legend" )
              .append( row );
          }
        }
      }
    }
  } );

  $( ".table-container" )
    .css( "left", $( "#map" )
      .width() - $( ".legend" )
      .width() - 20 );
  $( ".table-container" )
    .css( "bottom", ( $( "#map" )
        .height() * -1 ) + $( ".legend" )
      .height() + 25 );

  var bg = $( "<div id='text-bg'></div>" );
  $( bg )
    .css( "width", $( ".legend-name" )
      .outerWidth() )
    .css( "margin-left", $( ".legend-color" )
      .outerWidth() + 6 )
    .css( "height", $( ".legend" )
      .outerHeight() )
    .css( "margin-top", $( ".legend" )
      .outerHeight() * -1 );

  $( ".table-container" )
    .append( bg );

  console.log( "legend was created" );
}
