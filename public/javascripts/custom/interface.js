function interface() {

  /*******************************************************************************
    Functionality of open and hide button left of interface.
  *******************************************************************************/
  $( "#openHide" )
    .click( function () {
      if ( $( this )
        .hasClass( "open" ) ) {
        $( this )
          .removeClass( "open" )
          .addClass( "closed" )
          .animate( {
            right: 0
          }, 'fast' )
          .children()
          .removeClass( "fa-angle-double-right" )
          .addClass( "fa-angle-double-left" );

        $( "#input" )
          .animate( {
            width: 0,
            opacity: 0
          }, 'fast' );

      } else {
        $( this )
          .removeClass( "closed" )
          .addClass( "open" )
          .animate( {
            right: 250
          }, 'fast' )
          .children()
          .removeClass( "fa-angle-double-left" )
          .addClass( "fa-angle-double-right" );

        $( "#input" )
          .animate( {
            width: 250,
            opacity: 1
          }, 'fast' );

      }
    } );

  /*******************************************************************************
    Functionality of the "opret" buttons
  *******************************************************************************/
  $( ".addGeometry" )
    .click( function () {
      disableEdits();
      if ( $( this )
        .hasClass( "selected" ) ) {
        $( "#editButtons > .selected" )
          .removeClass( "selected" );
        $( "#editButtons > .lastSelected" )
          .removeClass( "lastSelected" );
        $( this )
          .addClass( "lastSelected" );

      } else {
        disableEdits();
        $( "#editButtons > .selected" )
          .removeClass( "selected" );
        $( "#editButtons > .lastSelected" )
          .removeClass( "lastSelected" );
        $( this )
          .addClass( "selected" )
          .addClass( "lastSelected" );
        if ( $( this )
          .attr( "ref" ) === "adgangsvej" ) {
          // create a polyline if it is a road -
          map.editTools.startPolyline();
        } else {
          // otherwise create a polygon.
          map.editTools.startPolygon();
        }
      }
    } );

  /*******************************************************************************
    Hide or display the main menu items "Rediger & DTU lag"
  *******************************************************************************/
  $( ".menu-item" )
    .click( function () {
      if ( !$( this )
        .hasClass( "menu-selected" ) ) {
        $( ".menu-selected" )
          .removeClass( "menu-selected" );
        $( this )
          .addClass( "menu-selected" );
        $( ".theme" )
          .removeClass( "main" );

        if ( $( this )
          .is( "#menu-view-top" ) ) {
          $( "#menu-view-main" )
            .addClass( "main" );
        } else if ( $( this )
          .is( "#menu-edit-top" ) ) {
          $( "#menu-edit-main" )
            .addClass( "main" );
        }
      }
    } );

  /*******************************************************************************
    Disable and commit edits on "esc"-press and double click.
  *******************************************************************************/
  $( "#map" )
    .keyup( function ( e ) {
      if ( e.keyCode === 27 ) { // esc
        disableEdits();
        $( ".selected" )
          .removeClass( "selected" );
      }
    } )
    .dblclick( function () {
      disableEdits();
      $( ".selected" )
        .removeClass( "selected" );
    } );

  /*******************************************************************************
    Enables and disables snap
  *******************************************************************************/

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
}
