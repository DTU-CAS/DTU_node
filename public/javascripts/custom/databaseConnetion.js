  // Connecting and interactiving with the database
  // Author: Casper Fibaek - NIRAS
  /* global $ L map */

  var dB = ({ // eslint-disable-line

    // Test if the database is connected
    // e.g.: db.test()
    test: function () {
      $.ajax({
        type: 'GET',
        url: '/api/test',
        dataType: 'json'
      })
        .done(function (res) {
          console.log(res)
        })
        .fail(function (jqXHR, status, error) {
          console.log('AJAX call failed: ' + status + ', ' + error)
        })
    },

    latest: function () {
      $.ajax({
        type: 'GET',
        url: '/api/latest/',
        dataType: 'json'
      })
        .done(function (res) {
          console.log(res)
          return res
        })
        .fail(function (jqXHR, status, error) {
          console.log('AJAX call failed: ' + status + ', ' + error)
        })
    },
    get: function (strProjectID) {
      $.ajax({
        type: 'GET',
        url: '/api/get/' + strProjectID,
        dataType: 'json'
      })
        .done(function (res) {
          if (res.length === 0) {
            console.log('Nothing returned from database')
          } else {
            console.log('Geometries added to the map: ' + res.length)
            for (var i = 0; i < res.length; i++) {
              console.log(res[ i ])

              L.geoJSON(res[ i ])
                .addTo(map)
            }
          }
        })
        .fail(function (error) {
          console.log('AJAX call failed: ', error)
        })
    },
    /*
     DELETE GEOMETRY (ProjectID / CG_ID)
     NULL and ALL are valid constructors
     E.g:
          db.delete('f5523914-3a65-e511-9bc6-f4b7e2e7153e', 273)
          db.delete('f5523914-3a65-e511-9bc6-f4b7e2e7153e', 'ALL')
          db.delete('f5523914-3a65-e511-9bc6-f4b7e2e7153e', 'NULL')
          db.delete('ALL', 'NULL')
          db.delete('ALL', 273)
    */
    delete: function (projectID, geometryID) {
      $.ajax({
        type: 'GET',
        url: '/api/delete/' + projectID + '/' + geometryID,
        dataType: 'json'
      })
        .done(function (res) {
          console.log(res)
        })
        .fail(function (jqXHR, status, error) {
          console.log('AJAX call failed: ' + status + ', ' + error)
        })
    },

    /* UPDATE DATABASE Matches on CG_ID
       {
         CG_ID: "246",
         ProjektID: "Casper",
         Status: "Ongoing"
       }
    */
    update: function (obj) {
      var updateString = 'SET '
      var newKeys = 0

      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (
            key !== 'CG_ID' &&
            key !== 'CG_GEOMETRY' &&
            key !== 'WKT' &&
            key !== 'ID'
          ) {
            updateString += key + " = '" + obj[ key ] + "', "
            newKeys += 1
          }
        }
      }

      if (newKeys > 0) {
        updateString = updateString.slice(0, -2)
      }

      var postObj = {
        CG_ID: obj.CG_ID,
        request: updateString,
        geometry: JSON.stringify(obj.CG_GEOMETRY)
      }

      if (postObj.CG_ID === 'undefined' || postObj.CG_ID === undefined) {
        $.ajax({
          type: 'GET',
          url: '/api/latest/',
          dataType: 'json'
        })
          .done(function (res) {
            console.log(res)
            postObj.CG_ID = res
            updateDB(postObj)
          })
          .fail(function (jqXHR, status, error) {
            console.log('AJAX call failed: ' + status + ', ' + error)
          })
      }

      function updateDB (object) {
        $.ajax({
          type: 'POST',
          url: '/api/update/',
          dataType: 'json',
          data: postObj
        })
          .done(function (res) {
            console.log(res)
          })
          .fail(function (jqXHR, status, error) {
            console.log('AJAX call failed: ' + status + ', ' + error)
          })
      }

      updateDB(postObj)
    },

    // WRITE TO DATABASE ({ProjektID: "bob wrote this"})
    write: function (obj) {
      var keys = ''
      var values = ''
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key !== 'CG_GEOMETRY') {
            keys += key + ', '
            values += "'" + obj[ key ] + "', "
          }
        }
      }
      keys = keys.slice(0, -2)
      values = values.slice(0, -2)

      var postObj = {
        'keys': keys,
        'values': values,
        'geometry': JSON.stringify(obj.CG_GEOMETRY)
      }

      $.ajax({
        type: 'POST',
        url: '/api/post/',
        dataType: 'json',
        data: postObj
      })
        .done(function (res) {
          console.log(res)
        })
        .fail(function (jqXHR, status, error) {
          console.log('AJAX call failed: ' + status + ', ' + error)
        })
    }
  })
