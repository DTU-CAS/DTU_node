// Initialize the interface
function init(){
  // Query the URL for parameters
  var query = QueryString();
  if(query){jQuery("#bygID > p").text(query.NAME);}

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
      // console.log(data[i]);
      if(data[i].properties.Type){
        data[i].properties.Type = lookUp(data[i].properties.Type);
      }

      var addLayer = eventJSON(data[i],
        {color: "#e78a0f"},
        {color: "#ffd088"},
        true
      ).addTo(map);
      // bob = L.geoJSON(data[i]).addTo(map);
    }
  });

  addWfsLayer("ugis:T6832", "Byggepladser",
    {
      color: "#00CCFF",
      fillOpacity: 0
    },
    {
      color: "#42C9FF",
      fillOpacity: 0
    },
      false
  );
  addWfsLayer("ugis:T6834", "Parkering",
    {
      color: "#65CAFE",
      opacity: 0,
      fillOpacity: 0.60
    },
    {
      color: "#99DEFC",
      opacity: 0,
      fillOpacity: 0.70
    },
      false
  );
  addWfsLayer("ugis:T6831", "Adgangsveje",
    {color: "#FF33FF",
     dashArray: "5, 5",
    },
    {color: "#FF78ED",
     dashArray: "5, 5",
     weight: 4,
   },
     false
  );
  addWfsLayer("ugis:T6833", "Ombyg og Renovering",
    {
      color: "#000",
      weight: 1.5,
      fillOpacity: 0.15,
      fillColor: "#FF00CC"
    },
    {
      color: "#000",
      weight: 2,
      fillOpacity: 0.25,
      fillColor: "#FF30C9"
    },
      false
  );
  addWfsLayer("ugis:T7418", "Nybyggeri",
  {
    color: "#000",
    weight: 1.5,
    fillOpacity: 0.15,
    fillColor: "#FF9900"
  },
  {
    color: "#000",
    weight: 2,
    fillOpacity: 0.25,
    fillColor: "#FFB626"
  },
    false
  );

  var dtuByg = eventJSON(dtu_bygninger,
    {
      color: "#000",
      weight: 1.5,
      fillColor: "#333",
      fillOpacity: 0.35
    },
    {
      color: "#111",
      weight: 2,
      fillColor: "#555",
      fillOpacity: 0.40
    },
    false
  );

  var labels = L.layerGroup();
  dtuByg.eachLayer(function(layer){

    var properties = layer.feature.properties;
    var bygnr = properties.DTUbygnnr;
    var afsnit = properties.Afsnit;

    var postStr = "Bygning " + bygnr;
    if(afsnit !== null && afsnit !== 0){
      postStr += ", " + afsnit;
    }

    if (bygnr !== null){
      // layer.bindTooltip(postStr, {
      //   permanent: false
      // });

      var marker = L.marker(
        layer.getBounds().getCenter(),
        {opacity: 0}
      )
        .bindTooltip(postStr, {
          permanent: true,
          offset: [0, 25]
        })
        .openTooltip();

        labels.addLayer(marker);
    }
    });

  add2LayerList("Bygninger", dtuByg);
  add2LayerList("Bygninger - Labels", labels);

  addWMSlayer("18454", "Streetfood");
  interface();
}
