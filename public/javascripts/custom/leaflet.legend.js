// Casper Fibaek - NIRAS
// Leaflet Legend
// Optimize

function updateLegend() {
  $( ".legend" )
    .empty();
  addedlayers = [];

  map.eachLayer( function ( layer ) {
    if ( layer instanceof L.Path ) {
      if ( layer.options && layer.feature.properties) {
        if ( addedlayers.indexOf( layer.feature.properties.Type ) === -1 ) {
          addedlayers.push( layer.feature.properties.Type );

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

          if(abbr(layer.feature.properties.Type) === true){
            type = String(lookUp(layer.feature.properties.Type));
          } else {
            type = String(layer.feature.properties.Type);
          }

          if(st.dashArray){
            dash = "dashed";
          } else {
            dash = "solid";
          }

          var color = $( "<td class='legend-color'></td>" )
            .css( "border", st.weight + "px " + dash + " " + borderColor )
            .css( "background", fillColor );

          if(layer.feature.properties.DTUbygnnr){
            text = $( "<td class='legend-name'>" + "Bygninger" + "</td>" );
            postText = "Bygninger";
          } else {
            text = $( "<td class='legend-name'>" + type + "</td>" );
            postText = type;
          }

          // If it is not already added to the legend;
          if($(".legend-name").text().indexOf(postText) === -1){
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

  // console.log("update legend");

  $( ".table-container" )
    .css( "left", $( "#map" )
      .width() - $( ".legend" )
      .width() - 20 );
  $( ".table-container" )
    .css( "bottom", ( $( "#map" )
      .height() * -1 ) + $( ".legend" )
      .height() + 25 );
}
