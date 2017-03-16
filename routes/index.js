/* eslint-disable camelcase */
/* eslint-disable new-cap */
var express = require('express')
var router = express.Router()
var soap = require('soap')
var xmlParser = require('xml2js').parseString

var sql = require('mssql')
var wellKnown = require('wellknown') // Parses and writes WKT
var repro = require('reproject')     // Reprojects geojson files
var db = require('./db')
var dbString = db.connection
var dbTable = db.table
var soapURL = db.webServiceURL
var soapUsername = db.username
var soapPassword = db.password

var projections = {
  'EPSG:4326': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs', // WGS84
  'EPSG:25832': '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs' // UTM32N
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'DTU-Byggesager'
  })
})

router.get('/api/verify/:ID', function (req, res) {
  var UID = req.params.ID
  console.log('recived: ' + UID)
  var sql = `SELECT TOP 1 Tasks.[ProjectUID], [ProjectName]
             FROM [PSP06_ProjectWebApp_CAS_PPM_DTU_Content_DB].[dbo].[MSP_EpmTask_UserView] AS Tasks
             INNER JOIN [PSP06_ProjectWebApp_CAS_PPM_DTU_Content_DB].[dbo].[MSP_EpmProject_UserView] AS Projects ON Tasks.ProjectUID=Projects.ProjectUID
             WHERE Tasks.ProjectUID='${UID}'
             ORDER BY ProjectName
             FOR XML AUTO`
  var args = {'username': soapUsername, 'password': soapPassword, 'sql': sql}

  soap.createClient(soapURL, function (err, client) {
    if (err) console.log('could not connect to SOAP service')
    client.executeSql(args, function (err, result) {
      if (err) { res.status(200).json({'status': 'error', 'message': 'Did not find UID'}) } else {
        var reply = result.executeSqlResult

        console.log('Found UID!')

        xmlParser(reply, function (err, result) {
          if (err) { console.log('error parsing XML') }
          var projectName = result.Tasks.Projects[0].$.ProjectName
          var projectUID = result.Tasks.$.ProjectUID
          console.dir('Name: ' + projectName)
          console.dir('UID: ' + projectUID)
          res.status(200).json({
            'name': projectName,
            'UID': projectUID,
            'status': 'success'
          })
        })
      }
    })
  })
})

// READ
router.get('/api/get/:ID', function (req, res) {
  // Grab data from the URL parameters
  var id = req.params.ID
  var name = req.params.name

  console.log(`Connection made with ID: ${id} and NAME: ${name}`)

  sql.connect(dbString)
    .then(function () {
      var DBquery = 'SELECT ' +
        'CG_ID as CG_ID, ' +
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
        'FROM ' + dbTable + " WHERE ProjektID = '" + id + "'"

      new sql.Request()
        .query(DBquery)
        .then(function (result) {
          // loop through geometries
          for (var i = 0; i < result.length; i++) {
            result[ i ] = {
              'type': 'Feature',
              'properties': {
                'CG_ID': result[ i ].CG_ID,
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
    })
    .catch(function (err) {
      console.log(err)
      return res.status(500).json({
        'success': false,
        'message': err,
        'status': 500
      })
    })
})

// DELETE
router.get('/api/delete/:projectID/:cg_id', function (req, res) {
  // Grab data from the URL parameters
  var projectID = req.params.projectID
  var cg_id = req.params.cg_id
  var DBquery

  sql.connect(dbString)
    .then(function () {
      if (projectID === 'NULL' && cg_id === 'ALL') {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          '(ProjektID IS NULL)'
      } else if (projectID === 'ALL') {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          'CG_ID = ' + cg_id
      } else if (cg_id === 'ALL') {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          'ProjektID = ' + "'" + projectID + "'"
      } else if (projectID === 'NULL') {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          '(ProjektID IS NULL AND CG_ID = ' + cg_id + ')'
      } else if (cg_id === 'NULL') {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          '(CG_ID IS NULL AND projectID = ' + projectID + ')'
      } else {
        DBquery = 'DELETE FROM ' +
          dbTable + ' WHERE ' +
          'CG_ID = ' + "'" + cg_id + "'" + ' AND ' +
          'ProjektID = ' + "'" + projectID + "'"
      }

      new sql.Request()
        .query(DBquery)
        .then(function (result) {
          console.log(`Deleted site with ID: ${cg_id}`)
          return res.status(200)
            .json({
              'deleted': cg_id
            })
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
    })
    .catch(function (err) {
      console.log(err)
      return res.status(500)
    })
})

router.get('/api/latest/', function (req, res) {
  sql.connect(dbString)
    .then(function () {
      var topQuery = `SELECT TOP 1 CG_ID FROM ${dbTable} ORDER BY CG_ID DESC;`

      new sql.Request()
        .query(topQuery)
        .then(function (result) {
          console.log(`Selected Newly added geometry with ID: ${result[0].CG_ID}`)
          return res.json(result[0].CG_ID)
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

  // connect to database
  sql.connect(dbString)
    .then(function () {
      DBquery = `INSERT INTO ${dbTable} (${data.keys}) VALUES (${data.values})`
      if (data.geometry) {
        DBquery = `INSERT INTO ${dbTable} (${data.keys}, CG_GEOMETRY) VALUES (${data.values}, '${reproject}')`
      }

      new sql.Request()
        .query(DBquery)
        .then(function (result) {
          new sql.Request()
            .query(`UPDATE ${dbTable} SET CG_GEOMETRY.STSrid = 25832 WHERE CG_GEOMETRY.STSrid = 0`)
            .then(function () {
              console.log('Updated SRID')
              console.log(`Created new site!`)
              return res.status(200)
                .json({
                  'created': result
                })
            })
            .catch(function (err) {
              console.log(err)
            })
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
    'UPDATE ' + dbTable +
    ' ' + data.request +
    ' WHERE CG_ID = ' + data.CG_ID

  if (data.geometry && data.request.length > 4) {
    DBquery =
      'UPDATE ' + dbTable +
      ' ' + data.request +
      ", CG_GEOMETRY = '" + reproject + "'" +
      ' WHERE CG_ID = ' + data.CG_ID
  } else if (data.geometry) {
    DBquery =
      'UPDATE ' + dbTable +
      " SET CG_GEOMETRY = '" + reproject + "'" +
      ' WHERE CG_ID = ' + data.CG_ID
  }

  // connect to database
  sql.connect(dbString)
    .then(function () {
      new sql.Request()
        .query(DBquery)
        .then(function (result) {
          new sql.Request()
            .query(`UPDATE ${dbTable} SET CG_GEOMETRY.STSrid = 25832 WHERE CG_GEOMETRY.STSrid = 0`)
            .then(function (result) {
              console.log(`Updated site with ID: ${data.CG_ID}`)
              console.log('Updated SRID')
              return res.status(200)
                .json({
                  'updated': data.CG_ID
                })
            })
            .catch(function (err) {
              console.log(err)
            })
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
    })
})

module.exports = router
