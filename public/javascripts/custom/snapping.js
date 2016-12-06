function snapping(){
  var road = L.geoJSON(snapLayer).addTo(map);
  var snap = new L.Handler.MarkerSnap(map);

  snap.addGuideLayer(road);
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
}
