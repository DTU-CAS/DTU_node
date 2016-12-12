function snapping(layer){
  snap = new L.Handler.MarkerSnap(map);

  // snap.addGuideLayer(layer);
  var snapMarker = L.marker(map.getCenter(), {
    icon: map.editTools.createVertexIcon({className: 'leaflet-div-icon leaflet-drawing-icon'}),
    opacity: 1,
    zIndexOffset: 1000
  });

  snap.watchMarker(snapMarker);

  map
    .on('editable:vertex:dragstart', function (e) {
    snap.watchMarker(e.vertex);
  }).on('editable:vertex:dragend', function (e) {
    snap.unwatchMarker(e.vertex);
  }).on('editable:drawing:start', function () {
    this.on('mousemove', followMouse);
  }).on('editable:drawing:click', function (e) {
    var latlng = snapMarker.getLatLng();
    e.latlng.lat = latlng.lat;
    e.latlng.lng = latlng.lng;
  }).on('editable:drawing:end', function (e){
    this.off('mousemove', followMouse);
    snapMarker.remove();
  });

  snapMarker
    .on('snap', function (e) {
    snapMarker.addTo(map);
  }).on('unsnap', function (e) {
    snapMarker.remove();
  });

  var followMouse = function (e) {
    snapMarker.setLatLng(e.latlng);
  };

  edd = 0;

  map.on('layeradd', function(e){
      if (e.layer instanceof L.Path){
        if (edd === 0){
          snap.addGuideLayer(e.layer);
        }
      }
  });

  map.on('layerremove', function(e){
    for (var i = snap._guides.length - 1; i >= 0; i--) {
      if (snap._guides[i]._leaflet_id === e.layer._leaflet_id) {
        snap._guides.splice(i, 1);
      }
    }
  });

  $("#snapping").click(function(){
    if($(this).hasClass("off")){
      snap.enable();
      $(this).removeClass("off").addClass("on");
    } else {
      snap.disable();
      $(this).removeClass("on").addClass("off");
    }
  });
}
