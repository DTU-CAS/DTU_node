// Casper Fibaek - NIRAS
// Leaflet Legend
// Optimize

function updateLegend() {
  $( ".legend" )
    .empty();
  var addedlayers = [];

  map.eachLayer( function ( layer ) {
    if ( layer instanceof L.Path ) {
      if ( addedlayers.indexOf( layer.feature.properties.Type ) === -1 ) {
        if ( layer.options.style ) {
          addedlayers.push( layer.feature.properties.Type );

          var st = layer.options.style;

          var borderColor = "rgba(" + String( chroma( st.color )
            .alpha( st.opacity )
            .rgba() ) + ")";
          var fillColor = "rgba(" + String( chroma( st.fillColor )
            .alpha( st.fillOpacity )
            .rgba() ) + ")";

          // change for lookup
          var row = $( "<tr class='legend-row'></tr>" );

          var color = $( "<td class='legend-color'></td>" )
            .css( "border", st.weight + "px solid " + borderColor )
            .css( "background", fillColor );

          var text = $( "<td class='legend-name'>" + String( lookUp( layer.feature.properties.Type ) ) + "</td>" );
          $( row )
            .append( color )
            .append( text );


          $( ".legend" )
            .append( row );

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
      .height() + 20 );
}
