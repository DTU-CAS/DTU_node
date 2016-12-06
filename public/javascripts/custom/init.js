// Initialize the interface
function init(){
  // Query the URL for parameters
  var query = QueryString();
  if(query){jQuery("#bygID > p").text(query.ID);}

  // create the map
  map = L.map('map', {
    center: [55.787016, 12.522536],
    zoom: 16,
    maxZoom: 21,
    minZoom: 13,
    zoomSnap: 0.5,
    inertia: true,
    keyboardPanDelta: 100,
    zoomControl: true,
    doubleClickZoom: false,
    editable: true
  });

  // GST Ortho 2016
  var GST_Ortho = L.tileLayer.wms('https://kortforsyningen.kms.dk/?servicename=orto_foraar', {
    login: 'qgisdk',
    password: 'qgisdk',
    version: '1.1.1',
    layers: 'orto_foraar',
    format: 'image/png',
    maxZoom: 21,
    maxNativeZoom: 18,
    attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
    edgeBufferTiles: 1
  }).addTo(map);

  // GST skaermkort 2016
  var GST_Skaerm = L.tileLayer.wms('https://kortforsyningen.kms.dk/?servicename=topo_skaermkort', {
    login: 'qgisdk',
    password: 'qgisdk',
    version: '1.1.1',
    layers: 'dtk_skaermkort_graa_3',
    format: 'image/png',
    maxZoom: 21,
    maxNativeZoom: 18,
    attribution: '&copy; <a href="http://gst.dk">GeoDanmark</a>',
    edgeBufferTiles: 1
  });

  var OSMbasemap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21,
    maxNativeZoom: 18,
    edgeBufferTiles: 2
  });

  // Add to layer control
  var basemaps = {
    "Luftfoto": GST_Ortho,
    "Skærmkort": GST_Skaerm,
    "Open Street Maps": OSMbasemap
  };

  var overlayMaps = {
    // ...
  };

  var mainControl = L.control.layers(basemaps, overlayMaps, {collapsed: false}).addTo(map);

  // TODO: ERROR HANDLING
  // Get all todos
  $.get('/api/get/' + query.ID, function(data){
    for(var i = 0; i < data.length; i++){
      addLayer = eventJSON(data[i],
        {color: "#e78a0f"},
        {color: "#ffd088"},
        true
      ).addTo(map);
      // bob = L.geoJSON(data[i]).addTo(map);
    }
  });

  var layerContainer = $("<div class='layer-container'></div>");
  var layerList = $("<ul class='layer-list'></ul>");

  var wmsLayers = [
    ["6832", "Byggepladser"],
    ["6834", "Parkering"],
    ["6831", "Adgangsveje"],
    ["6833", "Ombyg og Renovering"],
    ["7418", "Nybyg"],
    ["7428", "Byggeri"],
    ["18454", "Streetfood"]
  ];
  function addWMSlayer(string, name){
    var layer = L.tileLayer.wms("http://services.nirasmap.niras.dk/kortinfo/services/Wms.ashx?", {
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
    });

    var listItem = $("<li class='unselectable-text layer layer-off'>" + name + "</li>");
    listItem.on("click", function(){
      if($(this).hasClass("layer-on")){
        $(this).removeClass("layer-on").addClass("layer-off");
        map.removeLayer(layer);
      } else {
        $(this).addClass("layer-on").removeClass("layer-off");
        map.addLayer(layer);
      }
    });
    $(layerList).append(listItem);
  }
  for(var wms = 0; wms < wmsLayers.length; wms++){
    addWMSlayer(wmsLayers[wms][0], wmsLayers[wms][1]);
  }
  $(layerContainer).append(layerList);
  $("#wmsLayers").append(layerContainer);

  function addGFI(e){
    var layerString = "";
    for (var j = 0; j < wmsLayers.length; j++){
      layerString+= wmsLayers[j][0];
      if(j !== wmsLayers.length -1){
        layerString+= ",";
      }
    }

    var latLng = e.latlng;
    var point = map.latLngToContainerPoint(latLng, map.getZoom());
    var size = map.getSize();

    // convert boundbox to srs
    var WGS84Param = proj4("EPSG:4326");
    var coordinateSystem = proj4(epsg["25832"]);
    var bbox = bounds2Arr(map.getBounds(), true);
    bbox[0] = proj4(WGS84Param, coordinateSystem, bbox[0]);
    bbox[1] = proj4(WGS84Param, coordinateSystem, bbox[1]);
    bbox = arr2bounds(bbox, true).toBBoxString();

    var layerURL = "http://services.nirasmap.niras.dk/kortinfo/services/Wms.ashx?";
    var params = {
      site: 'Provider',
      page: 'DTU',
      request: 'GetFeatureInfo',
      userName: 'DTUView',
      password: 'Bruger12',
      service: 'WMS',
      version: '1.1.1',
      layers: "6832, 6834, 6831",
      styles: "",
      srs: 'EPSG:25832',
      bbox: bbox,
      width: size.x,
      height: size.y,
      query_layers: "6832, 6834, 6831",
      x: point.x,
      y: point.y,
      type: 'nirasmap',
      feature_count: 1,
      info_format: 'text/xml'
    };

    var content = layerURL + L.Util.getParamString(params, layerURL, true);

    $.ajax({url: content, success: function(result){
      var fields = result.getElementsByTagName("field");

      if(fields.length > 0){
        var tableContent = "<table>";
        for(var i = 0; i < fields.length; i++){
          tableContent +=
          "<tr class='table-row'>" +
          "<td>" + $(fields[i]).attr("name") + "</td>" +
          "<td>" + fields[i].innerHTML + "</td>";
        }
        tableContent += "</table>";

        L.popup({ maxWidth: "600px"})
          .setLatLng(latLng)
          .setContent(tableContent)
          .openOn(map);
      }
    }});
  }

  $("#getFeatureInfo").click(function(e){
    if($(this).hasClass("off")){
      $(this).removeClass("off").addClass("on");
      map.on('click', addGFI);
    } else {
      $(this).removeClass("on").addClass("off");
      map.off('click', addGFI);
    }
  });

  function addWfsLayer(string, name, style, highlight, editable){
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
    var wfsRequest = wfsBase + L.Util.getParamString(wfsParams, wfsBase, true);

    $.ajax({url: wfsRequest, success: function(result){
      var geom = GML2GeoJSON(result, true);
      var layer = eventJSON(geom, style, highlight, editable);
      layer.eachLayer(function(layer){
        layer.options.editable = false;
        // console.log(layer);
      });

      var listItem = $("<li class='unselectable-text layer layer-off'><p>" + name + "</p></li>")
        .on("click", function(){
          if($(this).hasClass("layer-on")){
            $(this).removeClass("layer-on").addClass("layer-off");
            map.removeLayer(layer);
          } else {
            $(this).removeClass("layer-off").addClass("layer-on");
            map.addLayer(layer);
          }
        });
      $("#layers").append(listItem);
    }});
  }

  addWfsLayer("ugis:T6832", "Byggepladser",
    {color: "#e64759"},
    {color: "#fb6c6c"},
    false
  );
  addWfsLayer("ugis:T6834", "Parkering",
    {color: "#1bc98e"},
    {color: "#64f4b7"},
    false
  );
  addWfsLayer("ugis:T6831", "Adgangsveje",
    {color: "#9f86ff"},
    {color: "#ab97fb",
     dashArray: "5, 5",
     weight: 4,
   },
   false
  );
  addWfsLayer("ugis:T6833", "Ombyg og Renovering",
    {color: "#e4d836"},
    {color: "#f4e633"},
    false
  );
  // addWfsLayer("ugis:T6828", "Byggeri",
  //   {},
  //   {},
  //   false
  // );
  // addWfsLayer("ugis:T7418", "Nybyggeri",
  //   {color: "#e3a446"},
  //   {color: "#ffc062"},
  //   false
  // );
  // addWfsLayer("ugis:T18454", "Streetfood");

  // Start loading geometry and attributes from MSSQL server with ID
  // var startLayer = eventJSON(json1,
  //   {color: "#1ca8dd"},
  //   {color: "#28edca"},
  //   true
  // ).addTo(map);

  // SNAPPING
  // snapping();
  interface();
}
