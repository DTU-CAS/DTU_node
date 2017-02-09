var express = require('express')
var router = express.Router()

var msSQL = require('mssql')
var wellKnown = require('wellknown') // Parses and writes WKT
var repro = require('reproject')     // Reprojects geojson files

var projections = {
  'EPSG:4326': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs', // WGS84
  'EPSG:25832': '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs' // UTM32N
}

// DTU database
var connectionString = 'mssql://username:password@address/table'
var databaseTable = 'DTU_Projekt_test'

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'DTU-Byggesager'
  })
})

// READ
router.get('/api/get/:ID', function (req, res) {
  // Grab data from the URL parameters
  var id = req.params.ID

  msSQL.connect(connectionString)
    .then(function () {
      var DBquery = 'SELECT ' +
        'cgID as cgID, ' +
        'CG_GEOMETRY.ToString() as CG_GEOMETRY, ' +
        'Type as Type, ' +
        'Navn as Navn, ' +
        'Projektleder as Projektleder, ' +
        'Areal as Areal, ' +
        'Budget as Budget, ' +
        'P_pladser as P_pladser, ' +
        'Afleveringsdato as Afleveringsdato, ' +
        'ProjektID as ProjektID, ' +
        'Startdato_Label as Startdato_Label, ' +
        'Slutdato_Label as Slutdato_Label, ' +
        'Afleveringsdato_label as Afleveringsdato_label, ' +
        'Status as Status ' +
        'FROM ' + databaseTable + " WHERE ProjektID = '" + id + "'"

      new msSQL.Request()
        .query(DBquery)
        .then(function (result) {
          // loop through geometries
          for (var i = 0; i < result.length; i++) {
            result[ i ] = {
              'type': 'Feature',
              'properties': {
                'cgID': result[ i ].cgID,
                'Type': result[ i ].Type,
                'Navn': result[ i ].Navn,
                'Projektleder': result[ i ].Projektleder,
                'Areal': result[ i ].Areal,
                'Budget': result[ i ].Budget,
                'P_pladser': result[ i ].P_pladser,
                'Afleveringsdato': result[ i ].Afleveringsdato,
                'ProjektID': result[ i ].ProjektID,
                'Startdato_Label': result[ i ].Startdato_Label,
                'Slutdato_Label': result[ i ].Slutdato_Label,
                'Afleveringsdato_label': result[ i ].Afleveringsdato_label,
                'Status': result[ i ].Status
              },
              'geometry': repro.reproject(wellKnown.parse(result[ i ].CG_GEOMETRY), 'EPSG:25832', 'EPSG:4326', projections)
            }
          }
          return res.json(result)
        })
        .catch(function (err) {
          console.log(err)
          return res.status(500)
            .json({
              success: false,
              data: err,
              request: DBquery
            })
        })

      msSQL.connection.close()
    })
})

// DELETE
router.get('/api/delete/:projectID/:cgID', function (req, res) {
  // Grab data from the URL parameters
  var projectID = req.params.projectID
  var cgID = req.params.cgID
  var DBquery

  msSQL.connect(connectionString)
    .then(function () {
      if (projectID === 'NULL' && cgID === 'ALL') {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          '(ProjektID IS NULL)'
      } else if (projectID === 'ALL') {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          'cgID = ' + cgID
      } else if (cgID === 'ALL') {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          'ProjektID = ' + "'" + projectID + "'"
      } else if (projectID === 'NULL') {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          '(ProjektID IS NULL AND cgID = ' + cgID + ')'
      } else if (cgID === 'NULL') {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          '(cgID IS NULL AND projectID = ' + projectID + ')'
      } else {
        DBquery = 'DELETE FROM ' +
          databaseTable + ' WHERE ' +
          'cgID = ' + "'" + cgID + "'" + ' AND ' +
          'ProjektID = ' + "'" + projectID + "'"
      }

      new msSQL.Request()
        .query(DBquery)
        .then(function (result) {
          console.log('deleted: ' + cgID)
          return res.status(200)
            .json({
              'deleted': cgID
            })

          // Handle errors
        })
        .catch(function (err) {
          console.log(err)
          return res.status(500)
            .json({
              success: false,
              data: err,
              request: DBquery
            })
        })

      msSQL.connection.close()
    })
})

// test functionality
router.get('/api/test/', function (req, res) {
  return res.status(200)
    .json({
      working: true
    })
})

router.get('/api/latest/', function (req, res) {
  msSQL.connect(connectionString)
    .then(function () {
      var topQuery = 'SELECT TOP 1 cgID FROM ' + databaseTable + ' ORDER BY cgID DESC;'

      new msSQL.Request()
        .query(topQuery)
        .then(function (result) {
          return res.json(result[ 0 ].cgID)

          // Handle errors
        })
        .catch(function (err) {
          console.log(err)
          return res.status(500)
            .json({
              success: false,
              data: err,
              request: topQuery
            })
        })

      msSQL.connection.close()
    })
})

// WRITE
router.post('/api/post/', function (req, res) {
  // Grab data from http request
  var data = req.body
  var reproject
  var DBquery

  if (data.geometry) {
    reproject = repro.reproject(JSON.parse(data.geometry), 'EPSG:4326', 'EPSG:25832', projections)
    reproject = wellKnown.stringify(reproject)
  }

  console.log(reproject)

  // connect to database
  msSQL.connect(connectionString)
    .then(function () {
      DBquery = 'INSERT INTO ' + databaseTable + ' (' + data.keys + ') VALUES (' + data.values + ')'
      if (data.geometry) {
        DBquery = 'INSERT INTO ' + databaseTable + ' (' + data.keys + ', CG_GEOMETRY) VALUES (' + data.values + ", '" + reproject + "')"
      }

      // Query
      new msSQL.Request()
        .query(DBquery)
        .then(function (result) {
          return res.status(200)
            .json({
              'created': result
            })
          // Handle errors
        })
        .catch(function (err) {
          console.log(err)
          return res.status(500)
            .json({
              success: false,
              data: err,
              request: DBquery
            })
        })

      // Query
      new msSQL.Request()
        .query(
          'UPDATE ' + databaseTable + ' SET CG_GEOMETRY.STSrid = 25832 WHERE CG_GEOMETRY.STSrid = 0'
        )
        .then(function (result) {
          console.log('Updated SRID')
        })
        .catch(function (err) {
          console.log(err)
        })

      msSQL.connection.close()
    })
    .catch(function (err) {
      console.log(err)
      return res.status(500)
    })
})

// UPDATE
router.post('/api/update/', function (req, res) {
  // Grab data from http request
  var data = req.body

  var reproject

  if (data.geometry) {
    reproject = repro.reproject(JSON.parse(data.geometry), 'EPSG:4326', 'EPSG:25832', projections)
    reproject = wellKnown.stringify(reproject)
  }

  var DBquery =
    'UPDATE ' + databaseTable +
    ' ' + data.request +
    ' WHERE cgID = ' + data.cgID

  if (data.geometry && data.request.length > 4) {
    DBquery =
      'UPDATE ' + databaseTable +
      ' ' + data.request +
      ", CG_GEOMETRY = '" + reproject + "'" +
      ' WHERE cgID = ' + data.cgID
  } else if (data.geometry) {
    DBquery =
      'UPDATE ' + databaseTable +
      " SET CG_GEOMETRY = '" + reproject + "'" +
      ' WHERE cgID = ' + data.cgID
  }

  console.log(DBquery)
  // connect to database
  msSQL.connect(connectionString)
    .then(function () {
      new msSQL.Request()
        .query(DBquery)
        .then(function (result) {
          return res.status(200)
            .json({
              'updated': data.cgID
            })

        // Handle errors
        })
        .catch(function (err) {
          console.log(err)
          return res.status(500)
            .json({
              success: false,
              data: err,
              request: DBquery
            })
        })

      // Query
      new msSQL.Request()
        .query(
          'UPDATE ' + databaseTable + ' SET CG_GEOMETRY.STSrid = 25832 WHERE CG_GEOMETRY.STSrid = 0'
        )
        .then(function (result) {
          console.log('Updated SRID')
          // Handle errors
        })
        .catch(function (err) {
          console.log(err)
        })

      msSQL.connection.close()
    })
})

module.exports = router
