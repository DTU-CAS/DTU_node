  // rewrite this as a simple API
  var DB = ({
    test: function(){
      $.ajax({
          type: "GET",
          url: '/api/test',
          dataType: "json"
      }).done(function (res) {
          console.log(res);
      }).fail(function (jqXHR, status, error) {
          console.log("AJAX call failed: " + status + ", " + error);
      });
    },

    get: function(str_projectID){
      $.ajax({
          type: "GET",
          url: '/api/get/' + str_projectID,
          dataType: "json"
      }).done(function (res) {
          if(res.length === 0){
            console.log("Nothing returned from database");
          } else {
            for(var i = 0; i < res.length; i++){
              L.geoJSON(res[i]).addTo(map);
            }
          }
      }).fail(function (jqXHR, status, error) {
          console.log("AJAX call failed: " + status + ", " + error);
      });
    }
  });

// TEST IF SERVER IS UP
function DB_test(){
  $.ajax({
      type: "GET",
      url: '/api/test',
      dataType: "json"
  }).done(function (res) {
      console.log(res);
  }).fail(function (jqXHR, status, error) {
      console.log("AJAX call failed: " + status + ", " + error);
  });
}

// GET GEOMETRY
function DB_get(str_projectID){
  $.ajax({
      type: "GET",
      url: '/api/get/' + str_projectID,
      dataType: "json"
  }).done(function (res) {
      console.log(res);
      for(var i = 0; i < res.length; i++){
        L.geoJSON(res[i]).addTo(map);
      }
  }).fail(function (jqXHR, status, error) {
      console.log("AJAX call failed: " + status + ", " + error);
  });
}

// DELETE GEOMETRY (ProjectID / CG_ID)
function DB_delete(prj_id, geom_id){
  $.ajax({
      type: "GET",
      url: '/api/delete/' + prj_id + '/' + geom_id,
      dataType: "json"
  }).done(function (res) {
      console.log(res);
  }).fail(function (jqXHR, status, error) {
      console.log("AJAX call failed: " + status + ", " + error);
  });
}

// WRITE TO DATABASE ({ProjektID: "casper skrev det her"})
function DB_write(obj){
  $.ajax({
    type: "POST",
    url: '/api/post/',
    dataType: "json",
    data: obj
  }).done(function (res){
    console.log(res);
  }).fail(function (jqXHR, status, error){
    console.log("AJAX call failed: " + status + ", " + error);
  });
}

// UPDATE DATABASE Matches on CG_ID
// {
//   CG_ID: "246",
//   ProjektID: "Casper",
//   Status: "Ongoing"
// }
function DB_update(obj){
  $.ajax({
    type: "POST",
    url: '/api/update/',
    dataType: "json",
    data: obj
  }).done(function (res){
    console.log(res);
  }).fail(function (jqXHR, status, error){
    console.log("AJAX call failed: " + status + ", " + error);
  });
}
