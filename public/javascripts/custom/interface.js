function interface(){

  $(".addGeometry").click(function(){
    if($(this).hasClass("selected")){
      $(".selected").removeClass("selected");
      $(".lastSelected").removeClass("lastSelected");
      $(this).addClass("lastSelected");
      disableEdits();
    } else {
      disableEdits();
      $(".selected").removeClass("selected");
      $(this).addClass("selected");
      $(".lastSelected").removeClass("lastSelected");
      $(this).addClass("lastSelected");
      if($(this).attr("ref") === "adgangsvej"){
        map.editTools.startPolyline();
      } else {
        map.editTools.startPolygon();
      }
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

  $(document).dblclick(function() {
    disableEdits();
    $(".selected").removeClass("selected");
  });

  map.on('editable:drawing:end', function (e){
      if(e.layer._parts){
        if(e.layer._parts.length > 0){
          var json = e.layer.toGeoJSON();
          var projektType = $(".lastSelected").attr("ref");
          var projektFelter = getFields(projektType);

          json.properties = {
            "ProjektID": QueryString().ID,
            "Type": projektType
          };

          for (var key1 in projektFelter) {
            if (projektFelter.hasOwnProperty(key1)) {
              json.properties[key1] = projektFelter[key1];
            }
          }

          var preObject = {
            CG_GEOMETRY: json.geometry,
            ProjektID: json.properties.ProjektID
          };

          var keys = '';
          var values = '';
          for (var key in preObject) {
            if (preObject.hasOwnProperty(key)) {
              if(key !== "CG_GEOMETRY"){
                keys += key + ", ";
                values += "'" + preObject[key] + "', ";
              }
            }
          }
          keys = keys.slice(0, -2);
          values = values.slice(0, -2);

          var postObj = {
            "keys": keys,
            "values": values,
            "geometry": JSON.stringify(preObject.CG_GEOMETRY)
          };

          $.ajax({
            type: "POST",
            url: '/api/post/',
            dataType: "json",
            data: postObj
          }).done(function (){

            $.ajax({
                type: "GET",
                url: '/api/latest/',
                dataType: "json"
            }).done(function (res) {
                console.log(res);
                var wkt = new Wkt.Wkt();
                map.removeLayer(e.layer);
                wkt.read(JSON.stringify(json)).write();
                json.properties.CG_ID = res;

                var addLayer = eventJSON(json,
                  {color: "#1ca8dd"},
                  {color: "#28edca"},
                  true
                ).addTo(map);

                console.log($(".lastSelected").attr("ref"));

            }).fail(function (jqXHR, status, error) {
                console.log("AJAX call failed: " + status + ", " + error);
            });


          }).fail(function (jqXHR, status, error){
            console.log("AJAX call failed: " + status + ", " + error);
          });
        }
      }
    });
}
