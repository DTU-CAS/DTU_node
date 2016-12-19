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
