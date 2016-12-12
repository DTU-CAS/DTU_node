function interface(){

  $(".addGeometry").click(function(){
    if($(this).hasClass("selected")){
      $(".selected").removeClass("selected");
      $(".lastSelected").removeClass("lastSelected");
      $(this).addClass("lastSelected");
      disableEdits();
      edd = 0;
    } else {
      disableEdits();
      $(".selected").removeClass("selected");
      $(".lastSelected").removeClass("lastSelected");
      $(this).addClass("selected").addClass("lastSelected");
      if($(this).attr("ref") === "adgangsvej"){
        map.editTools.startPolyline();
      } else {
        map.editTools.startPolygon();
      }
      edd = 1;
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
    edd = 1;
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
    edd = 0;
    map.editTools.stopDrawing();
    map.eachLayer(function(layer){
      if(layer.editor){
        if(layer.editor._enabled === true){
          layer.toggleEdit();

          $("#infoTable > tr > td[type='key']").each(function() {
           if($(this).siblings().text() === "null" || $(this).siblings().text().length === 0){
             layer.feature.properties[$(this).attr("ref")] = null;
           } else {
             layer.feature.properties[$(this).attr("ref")] = $(this).siblings().text();
           }
          });

          if(layer.feature){
            var updateObj = {};
            for(var key in layer.feature.properties){
             if (layer.feature.properties.hasOwnProperty(key)) {
               if(layer.feature.properties[key] !== null){
                 updateObj[key] = layer.feature.properties[key];
               }
             }
            }
            updateObj.CG_GEOMETRY = layer.toGeoJSON().geometry;
            snap.addGuideLayer(layer);
            db.update(updateObj);
          }
       }}
    });
    $(".infoEdit").remove();
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
          addJSON(e.layer.toGeoJSON());
          map.removeLayer(e.layer);
          $(".selected").removeClass("selected");
      }
    }
    edd = 0;
  });

  snapping();
}
