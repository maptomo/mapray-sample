/**
 * @function Mapray sample for kintone
 * @author Copyright (c) Maptomo
 * @license MIT License
 * @since 2019
*/

(function () {

  'use strict';

  var _container_index = 'mapray-index';
  var _container_list = 'mapray-list';
  var _container_detail = 'mapray-detail';
  var _appId = kintone.app.getId();
  var _url = window.location.origin + '/k/';
  var _record;
  var accessToken = '<your access token here>';

  var vector = {
    normal: {
      pos: [-4000, 3000, 2000],
      end_pos: [0, 0, 0],
      up: [0, 0, 1]
    },
    default: {
      pos: [-3000, 2600, 1000],
      end_pos: [0, 0, 0],
      up: [0, 0, 1]
    }
  };

  var events = [
    'app.record.index.show',
    'mobile.app.record.index.show',
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.detail.show',
    'mobile.app.record.detail.show',
    'mobile.app.record.edit.show',
    'app.record.create.change.Lat',
    'app.record.create.change.Lng',
    'app.record.create.change.Height',
    'app.record.create.change.Near',
    'app.record.create.change.Far',
    'app.record.edit.change.Lat',
    'app.record.edit.change.Lng',
    'app.record.edit.change.Height',
    'app.record.edit.change.Near',
    'app.record.edit.change.Far',
  ];
  kintone.events.on(events, function (ev) {

    if (ev.viewId && ev.viewType !== 'custom') {
      return ev;
    }

    var el = {};
    if (ev.viewType === 'custom') {
      showListdata(ev);

      var records = ev.records;
      if (records.length > 0) {
        _record = records[0];
      }
      el.id = _container_index;

    } else {
      var record = ev.record;
      _record = record ? record : [];

      el = kintone.app.record.getSpaceElement(_container_detail);
      el.textContent = null;

    }

    var param = initMapray(_record, el.id);
    drawMapray(param);

  });

  var initMapray = function (r, element) {

    if (r.length === 0) {
      r = {
        Lng: { value: null },
        Lat: { value: null },
        Height: { value: null },
        Near: { value: null },
        Far: { value: null }
      };
    }

    return {
      element: element,
      lng: Number(r.Lng.value || 130.6),
      lat: Number(r.Lat.value || 31.6371),
      height: Number(r.Height.value || 3000),
      near: Number(r.Near.value || 10),
      far: Number(r.Far.value || 500000),
      vector: vector.normal
    };
  };

  var drawMapray = function (param) {

    if (!param) {
      return;
    }
    // For Image tiles
    var imageProvider = new mapray.StandardImageProvider("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/", ".jpg", 256, 0, 18);

    // Create viewer
    var viewer = new mapray.Viewer(
      param.element, {
      image_provider: imageProvider,
      dem_provider: new mapray.CloudDemProvider(accessToken)
    });

    // Setting the position of camera
    var home_pos = { longitude: param.lng, latitude: param.lat, height: param.height };

    var home_view_to_gocs = mapray.GeoMath.iscs_to_gocs_matrix(home_pos, mapray.GeoMath.createMatrix());

    var cam_pos = mapray.GeoMath.createVector3(param.vector.pos);
    var cam_end_pos = mapray.GeoMath.createVector3(param.vector.end_pos);
    var cam_up = mapray.GeoMath.createVector3(param.vector.up);

    var view_to_home = mapray.GeoMath.createMatrix();
    mapray.GeoMath.lookat_matrix(cam_pos, cam_end_pos, cam_up, view_to_home);

    var view_to_gocs = viewer.camera.view_to_gocs;
    mapray.GeoMath.mul_AA(home_view_to_gocs, view_to_home, view_to_gocs);

    viewer.camera.near = param.near;
    viewer.camera.far = param.far;

  };

  var showListdata = function (ev) {

    var table = new kintoneUIComponent.Table({
      // inital table data
      columns: [
        {
          header: 'Name',
          cell: function () {
            return kintoneUIComponent.createTableCell('label', 'name', {
              onClick: function (event) {
                document.getElementById(_container_index).textContent = null;

                var param = initMapray(event.data[event.rowIndex].record, _container_index);
                drawMapray(param);

              }
            });
          }
        },
        {
          header: 'Latitude',
          cell: function () { return kintoneUIComponent.createTableCell('label', 'lat') }
        },
        {
          header: 'Longitude',
          cell: function () { return kintoneUIComponent.createTableCell('label', 'lng') }
        },
        {
          header: ' ',
          cell: function () {
            return kintoneUIComponent.createTableCell('icon', 'icon', {
              type: 'right', color: 'blue',
              onClick: function (event) {
                window.open(event.data[event.rowIndex].detail.text, '_self');
              }
            })
          }
        }
      ],
      actionButtonsShown: false
    });

    var el = document.getElementById(_container_list);
    el.appendChild(table.render());

    var arrData = createIndexdata(ev);
    table.setValue(arrData);
  };

  var createIndexdata = function (ev) {

    var arrData = [];
    var records = ev.records;
    records.forEach(function (r) {

      if (!r.Lat.value && !r.Lng.value) {
        return ev;
      }

      var elDraw = document.createElement('a');
      elDraw.appendChild(document.createTextNode(r.Name.value));

      var elDraw = document.createElement('a');
      elDraw.appendChild(document.createTextNode(r.Name.value));

      var elLink = _url + _appId + '/show#record=' + r.$id.value;

      var row = {
        'name': { text: elDraw.outerHTML },
        'lat': { text: r.Lat.value },
        'lng': { text: r.Lng.value },
        'icon': { text: '' },
        'detail': { text: elLink },
        'record': r
      };
      arrData.push(row);
    });

    return arrData;
  };

})();
