 /* global getFields lookUp */

function editPanel( feature ) { // eslint-disable-line
  var fields = []
  fields.push(getFields('byggeri'))
  fields.push(getFields('byggeplads'))
  fields.push(getFields('adgangsvej'))
  fields.push(getFields('parkering'))
  var allFields = getFields('all')

  $('#interface')
    .prepend(
      "<div class='infoEdit'>" +
      "<div id='infoHeadling'><p>Rediger attributer</p></div>" +
      "<table id='infoTable'></table>" +
      "<div id='attrSelections'><ul></ul></div>" +
      '</div>')

  $('.infoEdit')
    .draggable({
      start: function (event, ui) {
        $('.infoEdit').css('cursor', 'move')
      },
      stop: function (event, ui) {
        $('.infoEdit').css('cursor', 'default')
      }
    })
    .css('left', map._attrEdit.left)
    .css('top', map._attrEdit.top)

  for (var key in feature.properties) {
    if (feature.properties.hasOwnProperty(key)) {
      if (key === 'Type') {
        $('#infoTable')
          .append("<tr id='info-Type' class='editRow hoverPointer'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='false'>" + String(feature.properties[ key ] + '</td></tr>'))
      } else if (key === 'Navn') {
        $('#infoTable')
          .append("<tr id='info-Navn' class='editRow'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='true'>" + String(feature.properties[ key ] + '</td></tr>'))
      } else if (key === 'Status') {
        $('#infoTable')
          .append("<tr id='info-Status' class='editRow hoverPointer'><td class='key' ref='" + key + "'>" + key + "</td><td class='attribute' contenteditable='false'>" + String(feature.properties[ key ] + '</td></tr>'))
      }
    }
  }

  $('#info-Type')
    .on('click', function () {
      $('#attrSelections')
        .css('left', ($('.infoEdit')
          .width() + 20) + 'px')
      $('.editRow')
        .css('background', '#252830')
      $(this)
        .css('background', '#3e4149')
      var _thisType = $('#info-Type > .attribute')
        .text()
      if (allFields.indexOf(_thisType) === -1) {
        _thisType = lookUp(_thisType)
      }
      var typeList = ''

      if (
        _thisType === 'undefined' ||
        _thisType === undefined ||
        _thisType === null ||
        _thisType === 'null'
      ) {
        for (var q = 0; q < allFields.length; q++) {
          typeList += '<li>' + allFields[ q ] + '</li>'
        }
      } else {
        for (var i = 0; i < fields.length; i++) {
          for (var j = 0; j < fields[ i ].length; j++) {
            if (fields[ i ][ j ].indexOf(_thisType) !== -1) {
              for (var w = 0; w < fields[ i ].length; w++) {
                typeList += '<li>' + fields[ i ][ w ] + '</li>'
              }
            }
          }
        }
      }

      $('#attrSelections > ul')
        .empty()
        .append(typeList)
      $('#attrSelections > ul > li')
        .unbind()
        .click(function () {
          $('#info-Type > .attribute')
            .text($(this)
              .text())
          $('#attrSelections')
            .css('left', ($('.infoEdit')
              .width() + 20) + 'px')
        })
      $('#attrSelections')
        .animate({
          width: '160px'
        }, 150)
    })

  $('#info-Status')
    .on('click', function () {
      $('#attrSelections')
        .css('left', ($('.infoEdit')
          .width() + 20) + 'px')
      $('.editRow')
        .css('background', '#252830')
      $(this)
        .css('background', '#3e4149')
      var statusList = ''
      for (var i = 0; i < getFields('status')
        .length; i++) {
        statusList += '<li>' + getFields('status')[ i ] + '</li>'
      }
      $('#attrSelections > ul')
        .empty()
        .append(statusList)
      $('#attrSelections > ul > li')
        .unbind()
        .click(function () {
          $('#info-Status > .attribute')
            .text($(this)
              .text())
          $('#attrSelections')
            .css('left', ($('.infoEdit')
              .width() + 20) + 'px')
        })
      $('#attrSelections')
        .animate({
          width: '160px'
        }, 150)
    })
  $('#info-Navn')
    .on('click', function () {
      $('.editRow')
        .css('background', '#252830')
      $(this)
        .css('background', '#3e4149')
      $('#attrSelections > ul')
        .empty()
      $('#attrSelections')
        .animate({
          width: '0'
        }, 100)
    })
}

function addRow (key, attribute) {
  return "<tr class='table-row'>" +
    "<td class='rowName'>" + key + '</td>' +
    '<td>' + attribute + '</td>' + '</tr>'
}

function infoPanel (obj, edit) { // eslint-disable-line
  $('#editGeom, #deleteGeom, #copyGeom')
    .off('click')
    .remove()
  var table = "<div id='objTable'>" + "<table class='table'>"

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key !== 'CG_ID' &&
        key !== 'ProjektID' &&
        key.indexOf('label') === -1 &&
        key.indexOf('Label') === -1 &&
        obj[ key ] !== 'null' &&
        obj[ key ] !== null) {
        if (key === 'P_pladser' && (obj[ key ] === null || obj[ key ] === 'null')) {
          // how do I reverse this?
        } else {
          table += addRow(key, obj[ key ])
        }
      }
    }
  }

  if (edit === false) {
    table +=
      '</table>' + "<div id='popup-button-wrap'>" +
      "<div id='copyGeom' class='disabled-edit unselectable-text'><p>Kopier<i class='fa fa-copy table-edit' aria-hidden='true'></i></p></div>" +
      '</div>'
  } else {
    table +=
      '</table>' + "<div id='popup-button-wrap'>" +
      "<div id='editGeom' class='disabled-edit unselectable-text'><p>Rediger<i class='fa fa-pencil table-edit' aria-hidden='true'></i></p></div>" +
      "<div id='deleteGeom' class='disabled-edit unselectable-text'><p>Slet<i class='fa fa-trash table-delete' aria-hidden='true'></i></p></div>" +
      '</div>'
  }

  return table
}
