function interface(){

  // Hover function
  $("#polygons").click(function(){
    if($(this).hasClass("selected")){
      $(".selected").removeClass("selected");
      disableEdits();
    } else {
      disableEdits();
      $(".selected").removeClass("selected");
      map.editTools.startPolygon();
      $(this).addClass("selected");
    }
  });

  $("#lines").click(function(){
    if($(this).hasClass("selected")){
      $(".selected").removeClass("selected");
      disableEdits();
    } else {
      disableEdits();
      $(".selected").removeClass("selected");
      $(this).addClass("selected");
      map.editTools.startPolyline();
    }
  });

  $("#openHide").click(function(){
    if($(this).hasClass("open")){
      $(this)
        .removeClass("open")
        .addClass("closed")
        .empty()
        .append("<i class='fa fa-angle-double-left' aria-hidden='true'></i>")
        .css("background", "#252830;")
        .animate({
          right: "0"
        }, 'fast');

        $("#input").animate({
          width: "0",
          opacity: 0
        }, 'fast');
    } else {
      $(this)
        .removeClass("closed")
        .addClass("open")
        .empty()
        .append("<i class='fa fa-angle-double-right' aria-hidden='true'></i>")
        .animate({
          right: "250px"
        }, 'fast');

        $("#input").animate({
          width: "250",
          opacity: 1
        }, 'fast');
    }
  });

  $("#snapping").click(function(){
    if($(this).hasClass("off")){
      $(this).removeClass("off").addClass("on");
    } else {
      $(this).removeClass("on").addClass("off");
    }
  });

  $(".menu-item").click(function(){
    if(!$(this).hasClass("menu-selected")){
      $(".menu-selected").removeClass("menu-selected");
      $(this).addClass("menu-selected");
      $(".theme").removeClass("main");

      if($(this).is("#menu-view-top")){
        $("#menu-view-main").addClass("main");
      } else if ($(this).is("#menu-edit-top")){
        $("#menu-edit-main").addClass("main");
      } else if ($(this).is("#menu-tools-top")){
        $("#menu-tools-main").addClass("main");
      }
    }
  });

  function enableEdits(){
    map.eachLayer(function(layer){
      // console.log(layer);
      if (layer instanceof L.Path){
        if (typeof layer.editor == 'undefined'){
          if(layer.options.editable !== false){
            layer.enableEdit();
          }
      }}
    });
  }

  function disableEdits(){
    map.editTools.stopDrawing();
    map.eachLayer(function(layer){
      if(layer.editor){
        if(layer.editor._enabled === true){
          layer.toggleEdit();
       }}
    });
  }

  $("#map").keyup(function(e){
    if (e.keyCode === 27) { // esc
      disableEdits();
      $(".selected").removeClass("selected");
    }
  });

  map.on('keypress', function(e) {
    if (e.originalEvent.keyCode === 189){ // ½
       enableEdits();
     } else if (e.originalEvent.keyCode === 49){ // Number: 1
       $("#polygons").click();
     } else if (e.originalEvent.keyCode === 50){ // Number: 2
       $("#lines").click();
     } else if (e.originalEvent.keyCode === 51){ // Number: 3
       $("#markers").click();
     }
  })
    .on('editable:editing', function (e) {
      // change style
    })
    .on('editable:created', function (e) {
      e.layer.options.editable = true;
      // reverse style
    })
    .on('editable:drawing:end', function (e){
      if(e.layer._parts){
        if(e.layer._parts.length > 0){
          var wkt = new Wkt.Wkt();
          json = e.layer.toGeoJSON();
          json.properties = {
            "ID": QueryString().ID,
            "WKT": wkt.read(JSON.stringify(json)).write()
          };
          map.removeLayer(e.layer);
          wkt.read(JSON.stringify(json)).write();
          var addLayer = eventJSON(json,
            {color: "#1ca8dd"},
            {color: "#28edca"},
            true
          ).addTo(map);

          db.write({
            CG_GEOMETRY: json.geometry,
            Projektleder: "Casper",
            Status: "Påbegyndt",
            ProjektID: json.properties.ID
          });

        }
      }
      this.off('mousemove', followMouse);
      snapMarker.remove();
    });

// SNAPPING
  var road = L.geoJSON(snapLayer).addTo(map);

  var snap = new L.Handler.MarkerSnap(map);
  snap.addGuideLayer(road);
  var snapMarker = L.marker(map.getCenter(), {
    icon: map.editTools.createVertexIcon({className: 'leaflet-div-icon leaflet-drawing-icon'}),
    opacity: 1,
    zIndexOffset: 1000
  });

  snap.watchMarker(snapMarker);

  map.on('editable:vertex:dragstart', function (e) {
    snap.watchMarker(e.vertex);
  });
  map.on('editable:vertex:dragend', function (e) {
    snap.unwatchMarker(e.vertex);
  });
  map.on('editable:drawing:start', function () {
    this.on('mousemove', followMouse);
  });
  map.on('editable:drawing:click', function (e) {
    // Leaflet copy event data to another object when firing,
    // so the event object we have here is not the one fired by
    // Leaflet.Editable; it's not a deep copy though, so we can change
    // the other objects that have a reference here.
    var latlng = snapMarker.getLatLng();
    e.latlng.lat = latlng.lat;
    e.latlng.lng = latlng.lng;
  });
  snapMarker.on('snap', function (e) {
    snapMarker.addTo(map);
  });
  snapMarker.on('unsnap', function (e) {
    snapMarker.remove();
  });
  var followMouse = function (e) {
    snapMarker.setLatLng(e.latlng);
  };

  $(document).dblclick(function() {
    disableEdits();
    $(".selected").removeClass("selected");
  });

  var deleteShape = function (e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) this.editor.deleteShapeAt(e.latlng);
  };

  map.on('layeradd', function (e) {
    if (e.layer instanceof L.Path) e.layer.on('click', L.DomEvent.stop).on('click', deleteShape, e.layer);
  });

}
