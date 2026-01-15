define(["dojo/_base/declare", "dojo/on", "dojo/has", "dojo/query", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/html", "dojo/_base/Color", "dojo/dom-construct", "dijit/_WidgetsInTemplateMixin", "jimu/BaseWidget", "jimu/dijit/TabContainer", "jimu/dijit/Popup", "esri/geometry/Point", "esri/graphic", "esri/config", "esri/geometry/Circle", "esri/geometry/Extent", "esri/geometry/Polyline", "esri/geometry/Multipoint", "esri/geometry/geometryEngine", "esri/graphicsUtils", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/PictureMarkerSymbol", "esri/tasks/query", "esri/tasks/QueryTask", "esri/tasks/Geoprocessor", "esri/layers/GraphicsLayer", "esri/layers/FeatureLayer", "esri/geometry/jsonUtils", "esri/tasks/RelationParameters", "dijit/form/Select", "dijit/form/CheckBox", "dijit/form/TextBox", "dijit/form/NumberTextBox", "dijit/ProgressBar", "dojox/layout/TableContainer", "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines", "dojox/charting/action2d/Tooltip", "dojo/fx/easing", "dojox/charting/action2d/MouseIndicator", "dojox/charting/action2d/Highlight", "dojox/charting/action2d/Magnify", "dojox/charting/widget/Legend", "dojox/form/RangeSlider", "dijit/form/HorizontalRuleLabels", "dijit/form/HorizontalRule", "esri/SpatialReference", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "./widgets/ReachSelector", "esri/tasks/StatisticDefinition"], function (declare, on, has, query, lang, array, html, Color, domConstruct, _WidgetsInTemplateMixin, BaseWidget, TabContainer, Popup, Point, Graphic, esriConfig, Circle, Extent, Polyline, Multipoint, geometryEngine, graphicsUtils, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, Query, QueryTask, Geoprocessor, GraphicsLayer, FeatureLayer, geometryJsonUtils, RelationParameters, Select, CheckBox, TextBox, NumberTextBox, ProgressBar, TableContainer, Chart, Default, Lines, Tooltip, easing, MouseIndicator, Highlight, Magnify, ChartLegend, RangeSlider, HorizontalRuleLabels, HorizontalRule, SpatialReference, GeometryService, ProjectParameters, ReachSelector, StatisticDefinition) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // Custom widget code goes here

    baseClass: "jimu-widget-imdc",

    //this property is set by the framework when widget is loaded.
    name: "IMDC",
    //config: require('./config.json'),

    //methods to communication with app container:
    geometryService: null,
    routeLayer: null,
    feederFeatureLayer: null,
    csvToLinesGPTool: null,

    //everything that fires after the widget is created goes in this postcreate function
    postCreate: function postCreate() {
      console.log("Running the 10.8.1 version of the widget!")
      this.inherited(arguments);
      this._initSelect();
      this._initRouteLayer();
      this.own(on(this.btnCalculate, "click", lang.hitch(this, this._onCalculateButton)));
      //this.feederFeatureLayer = this._findLayerByURL(this.config.feeder_layer.url);
      this.geometryService = new GeometryService(this.appConfig.geometryService);
      /*if (!this.feederFeatureLayer) {
        console.error("Could not find Feature Layer! Double-check your URLs in the web map vs the config.");
      }*/
      console.log("postCreate");
    },

    startup: function startup() {
      this.inherited(arguments);
      console.log("startup");
    },

    onOpen: function onOpen() {
      console.log("onOpen");
    },

    onClose: function onClose() {
      console.log("onClose");
    },

    //creates the marker symbol used to render results on a map
    _getHightLightMarkerSymbol: function _getHightLightMarkerSymbol(pType) {
      var style = SimpleMarkerSymbol.STYLE_CIRCLE;
      var size = 15;
      var color = pType == 0 ? new Color("#3fafdc") : pType == 1 ? new Color("#0000ff") : new Color("#00ff00");
      color.a = 1;

      var outlineSymbol = new SimpleLineSymbol();
      var outlineColor = "#ff0000";
      var outlineWidth = 3;
      outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
      outlineSymbol.setColor(outlineColor);
      outlineSymbol.setWidth(outlineWidth);

      var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
      return symbol;
    },
    //creates the empty route layer and adds it to the map
    _initRouteLayer: function _initRouteLayer() {
      this.routeLayer = new GraphicsLayer();
      this.map.addLayer(this.routeLayer);
    },
    //creates the select task that reads the feeder names from the feature service
    _initSelect: function _initSelect() {
      var fn = this.config.feeder_names;
      var queryTask = new QueryTask(fn.url + "?returnDistinctValues=true");
      var q = new Query();
      q.returnGeometry = false;
      q.outFields = [fn.ffcode_field, fn.name_display_field];
      q.where = "1=1";
      q.orderByFields = [fn.name_display_field];
      queryTask.execute(q);
      this.own(on(queryTask, "complete", lang.hitch(this, this._onInitQueryComplete)));
      this.own(on(queryTask, "error", lang.hitch(this, this._onInitQueryError)));
    },
    //takes the returns from the queryTask and populates the dropdown list
    _onInitQueryComplete: function _onInitQueryComplete(response) {
      //html.setStyle(this.progressBar.domNode, 'display', 'none');

      console.log("_onInitQueryComplete", response);
      var featureSet = response.featureSet;
      var features = featureSet.features;
      var length = features.length;
      var options = [{
        label: "Select...",
        value: ""
      }];
      if (length > 0) {
        this.ffcodeLookup = {};
        for (var i = 0; i < length; i++) {
          var attributes = features[i].attributes;
          var s_label = attributes[this.config.feeder_names.name_display_field] + " (" + attributes[this.config.feeder_names.ffcode_field] + ")";
          var s_value = i + 1;

          // we are setting a unique ID as the value of the dropdown, because we cannot have duplicates
          // so we have to have a lookup for when we need to get the ffcode from the objectid
          this.ffcodeLookup[s_value] = attributes[this.config.feeder_names.ffcode_field];
          options.push({
            label: s_label,
            value: s_value
          });
        }
        this.selectDropDown.set("options", options);
        this.own(on(this.selectDropDown, "change", lang.hitch(this, this._selectionChange)));
        //this.own(on(this.zoomLevels, "change", lang.hitch(this, this._zoomLevelChange)));
      }
    },

    _selectionChange: function _selectionChange(evt) {
      console.log("selection change", evt);
      if (evt === "") {
        this.minMaxInfoArea.innerHTML = "";
      } else {
        var queryTask = new QueryTask(this.config.feeder_layer.url + "/query");
        var q = new Query();
        q.returnGeometry = false;
        q.where = "FFCODE = '" + this.ffcodeLookup[evt] + "'";
        q.outStatistics = [
        // ['max', 'STATION1', 'STATION1MAX'],
        ["min", "STATION1", "STATION1MIN"], ["max", "STATION2", "STATION2MAX"]
        // ['min', 'STATION2', 'STATION2MIN'],
        ].map(function (info) {
          var statisticDefinition = new StatisticDefinition();
          statisticDefinition.statisticType = info[0];
          statisticDefinition.onStatisticField = info[1];
          statisticDefinition.outStatisticFieldName = info[2];
          return statisticDefinition;
        });

        queryTask.execute(q).then(function (res) {
          console.log("res", res);
          if (res.features[0].attributes.STATION1MIN && res.features[0].attributes.STATION2MAX) {
            this.minMaxInfoArea.innerHTML = "(Valid values: " + this.formatStation(res.features[0].attributes.STATION1MIN) + "-" + this.formatStation(res.features[0].attributes.STATION2MAX) + ")";
          } else {
            this.minMaxInfoArea.innerHTML = "";
          }
        }.bind(this), function (err) {
          console.log("err", err);
        });
      }
    },

    _onInitQueryError: function _onInitQueryError(error) {
      console.error("ProfileWidget query failed", error);
      //this._showError("Error");
    },
    //fires off the IMDC calculation based on the given inputs
    _onCalculateButton: function _onCalculateButton() {
      this._clear();
      this.setErrorMessage();
      var feederName = this.ffcodeLookup[this.selectDropDown.get("value")];
      var reachNumber = this.reachInput.value;
      var stationNumber = this.stationInput.value.replace('+', '');
      if (isNaN(stationNumber)) {
        window.alert("Must provide a valid number in the station number input.");
        return;
      }
      //If the reach is provided, do this querytask:
      if (reachNumber && !isNaN(reachNumber)) {
        var routeReach = feederName + "_" + reachNumber;

        var route_layer = this.config.route_layer;
        var queryTask = new QueryTask(route_layer.url + "?returnM=true");
        var q = new Query();
        q.returnGeometry = true;
        var outFields = [route_layer.display_field, "OBJECTID"];
        q.outFields = outFields;
        q.where = this.config.route_layer.display_field + "= '" + routeReach + "'";
        queryTask.execute(q);
        this.own(on(queryTask, "complete", lang.hitch(this, this._onRouteQueryComplete)));
        this.own(on(queryTask, "error", lang.hitch(this, this._onRouteQueryError)));
      }
      //If the reach is not provided, do this querytask:
      else {
          var route_layer = this.config.route_layer;
          var queryTask = new QueryTask(route_layer.url + "?returnM=true");
          var q = new Query();
          q.returnGeometry = true;
          var outFields = [route_layer.display_field, "OBJECTID", "Station1", "Station2"];
          q.outFields = outFields;
          q.where = this.config.route_layer.display_field + " LIKE '" + feederName + "%'";
          queryTask.execute(q);
          this.own(on(queryTask, "complete", lang.hitch(this, this._onRouteQueryCompleteMultiple)));
          this.own(on(queryTask, "error", lang.hitch(this, this._onRouteQueryError)));
        }
    },
    //Fires when the query task is completed with a reach provided:
    _onRouteQueryComplete: function _onRouteQueryComplete(response) {
      console.log("_onRouteQueryComplete", response);
      var featureSet = response.featureSet;
      var features = featureSet.features;
      var stationNumber = this.stationInput.value.replace('+', '');
      var length = features.length;
      var startVertex;
      var endVertex;
      var bFound = false;
      if (length > 0) {
        var spReference = new SpatialReference(2230);
        var newpoint = new Point(features[0].geometry.paths[0][0][0], features[0].geometry.paths[0][0][1], spReference);
        //console.log(features[0].geometry.paths[0][0][0] + " " + features[0].geometry.paths[0][0][1]);
        var dist = geometryEngine.distance(features[0].geometry, newpoint, 9002);
        console.log("distance:" + dist);

        this.matchedFeeder = features[0].geometry;
        this.matchedFeederObjectId = features[0].attributes["OBJECTID"];

        var feederLinePaths = features[0].geometry.paths;
        var pathLength = feederLinePaths.length;

        for (var i = 0; i < pathLength && bFound == false; i++) {
          var vertices = feederLinePaths[i];
          var verticesLength = vertices.length;
          for (var j = 0; j < verticesLength && bFound == false; j++) {
            if (vertices[j][2] > stationNumber) {
              endVertex = vertices[j];
              startVertex = vertices[j - 1];
              bFound = true;
            }
          }
        }
        console.log(startVertex, endVertex);
        this._interpolatePoint(startVertex, endVertex, stationNumber);
      } else {
        this.setErrorMessage("Could not find reach");
      }
    },
    //if the querytask completes with no reach given, do this:
    _onRouteQueryCompleteMultiple: function _onRouteQueryCompleteMultiple(response) {
      console.log("_onRouteQueryCompleteMultiple", response);
      var featureSet = response.featureSet;
      var features = featureSet.features;
      var stationNumber = parseFloat(this.stationInput.value.replace('+', ''));
      var length = features.length;
      var startVertex;
      var endVertex;
      //var foundCount = 0;
      var foundPoints = [];
      if (length > 0) {
        for (var fi = 0; fi < length; fi++) {
          var spReference = new SpatialReference(2230);
          var newpoint = new Point(features[fi].geometry.paths[0][0][0], features[fi].geometry.paths[0][0][1], spReference);
          var dist = geometryEngine.distance(features[fi].geometry, newpoint, 9002);
          console.log("distance:" + dist);
          this.matchedFeeder = features[fi].geometry;
          this.matchedFeederObjectId = features[fi].attributes["OBJECTID"];
          this.station1 = features[fi].attributes["STATION1"];
          this.station2 = features[fi].attributes["STATION2"];
          var feederLinePaths = features[fi].geometry.paths;
          var pathLength = feederLinePaths.length;
          if (stationNumber >= this.station1 && stationNumber <= this.station2) {
            var bFound = false;
            for (var i = 0; i < pathLength; i++) {
              var vertices = feederLinePaths[i];
              var verticesLength = vertices.length;
              for (var j = 0; j < verticesLength; j++) {
                if (vertices[j][2] >= stationNumber && bFound == false) {
                  endVertex = vertices[j];
                  startVertex = vertices[j - 1];
                  bFound = true;
                  //foundCount++;
                  var attr = {
                    RouteReach: features[fi].attributes["ROUTEREACH"]
                  };
                  var newGraphic = new Graphic(this._interpolateMultiplePoints(startVertex, endVertex, stationNumber), this._getHightLightMarkerSymbol(0), attr);
                  //foundPoints.push(this._interpolateMultiplePoints(startVertex, endVertex, stationNumber));
                  foundPoints.push(newGraphic);
                }
              }
            }
          }
        }
        if (foundPoints.length > 1) {
          this._projectMultiple(foundPoints);
        } else {
          this._interpolatePoint(startVertex, endVertex, stationNumber);
        }
      } else {
        this.setErrorMessage("Could not find reach");
      }
    },

    _interpolateMultiplePoints: function _interpolateMultiplePoints(startPoint, endPoint, station) {
      var x;
      var y;

      x = startPoint[0] + (endPoint[0] - startPoint[0]) * (station - startPoint[2]) / (endPoint[2] - startPoint[2]);
      y = startPoint[1] + (endPoint[1] - startPoint[1]) * (station - startPoint[2]) / (endPoint[2] - startPoint[2]);

      var point = new Point(x, y, new SpatialReference(2230));
      return point;
      //return [x, y];
    },

    _onRouteQueryError: function _onRouteQueryError(error) {
      console.log(error);
    },
    //perform the linear interpolation on the segment containing the station, to determine where to place the point
    _interpolatePoint: function _interpolatePoint(startPoint, endPoint, station) {
      this.setErrorMessage("");
      if (!startPoint || !endPoint) {
        console.error("Error - start and end points are not set going into _interpolatePoint");
        if (this.reachInput.value !== '') {
          this.setErrorMessage("Could not find reach");
        } else {
          this.setErrorMessage("Invalid station for this feeder");
        }
      } else {
        var x;
        var y;

        x = startPoint[0] + (endPoint[0] - startPoint[0]) * (station - startPoint[2]) / (endPoint[2] - startPoint[2]);
        y = startPoint[1] + (endPoint[1] - startPoint[1]) * (station - startPoint[2]) / (endPoint[2] - startPoint[2]);

        this._pointFromCoordsBtnClick(2230, x, y);
      }
    },
    //create point from values in the coordinate boxes
    _pointFromCoordsBtnClick: function _pointFromCoordsBtnClick(wkid, x, y) {
      //console.log(wkid);
      //console.log(xelement);
      //console.log(yelement);

      if (isNaN(x) || isNaN(y)) {
        window.alert("The coordinate values must both be numbers.");
        return;
      }

      this._projectPoint(wkid, 102100, x, y, null, null);
    },

    setErrorMessage: function setErrorMessage(message) {
      if (message) {
        this.errorSection.innerHTML = message;
      } else {
        this.errorSection.innerHTML = "";
      }
    },

    _findLayerByURL: function _findLayerByURL(url) {
      var opLayers = this.map.itemInfo.itemData.operationalLayers;
      for (var i = 0; i < opLayers.length; i++) {
        if (opLayers[i].layerObject.url == this.config.feeder_layer.url) {
          return opLayers[i].layerObject;
        }
      }
      //return null;
    },

    _clear: function _clear() {
      this.routeLayer.clear();
      this.msgSection.innerHTML = "";
    },
    //create the proper coordinates for the multiple projections
    _projectPoint: function _projectPoint(wkidIn, wkidOut, x, y, xelement, yelement) {
      var params = new ProjectParameters();
      var spReferenceIn = new SpatialReference(wkidIn);
      var spReferenceOut = new SpatialReference(wkidOut);
      var geog = new Point(x, y, spReferenceIn);
      params.geometries = [geog];
      params.outSR = spReferenceOut;
      _this = this;
      if (wkidOut == 102100) {
        _this.routeLayer.clear();
      }

      this.geometryService.project(params).then(function (response) {
        if (xelement != null) {
          //    xelement.set("value", response[0].x);
          //    yelement.set("value", response[0].y);
          //    if (wkidOut == 4326) {
          //        _this._convertDDToDMS(response[0].x, _this.dmsLonInput);
          //        _this._convertDDToDMS(response[0].y, _this.dmsLatInput);
          //    }
        } else {
          _this.map.centerAt(response[0]);
          var g = new Graphic(response[0], _this._getHightLightMarkerSymbol(0), {
            highlightMeasure: true
          });
          //    _this._findOffsetAngleDistance(response[0]);
          _this.routeLayer.add(g);
        }
      });
    },

    _projectMultiple: function _projectMultiple(points) {
      var pointsToProject = [];
      this.routeLayer.clear();
      for (var i = 0; i < points.length; i++) {
        pointsToProject.push(points[i].geometry);
      }

      var params = new ProjectParameters();
      params.geometries = pointsToProject;
      params.outSR = new SpatialReference(102100);
      try {
        this.geometryService.project(params).then(lang.hitch(this, function (response) {
          for (var i = 0; i < points.length; i++) {
            points[i].setGeometry(response[i]);
            this.routeLayer.add(points[i]);
          }

          var extent = graphicsUtils.graphicsExtent(points);
          this.map.setExtent(extent);
          // this.map.centerAt(extent.getCenter());

          if (this.reachSelector) {
            this.reachSelector.destroy();
            this.reachSelector = null;
          }
          this.reachSelector = new ReachSelector({
            graphics: points,
            layer: this.routeLayer,
            map: this.map
          });
          this.reachSelector.placeAt(this.multiplePointsControl, "last");

          this.reachSelector.on("reachChosen", function (reachChosen) {
            this.reachInput.value = reachChosen;
            this._onCalculateButton();
            this.reachSelector.destroy();
            this.reachSelector = false;
          }.bind(this));
        }));
      } catch (e) {
        console.log("There was an error with the multiple project:", e);
      }
    },

    splice: function splice(string, start, delCount, newSubStr) {
      return string.slice(0, start) + newSubStr + string.slice(start + Math.abs(delCount));
    },

    formatStation: function formatStation(inNumber) {
      var twoDecimalNumber = parseFloat(Math.round(inNumber * 100) / 100).toFixed(2);
      var text = twoDecimalNumber.toString();
      console.log("formatStation1", text);

      // make sure the number (string) has at least three digits to the left of the period:
      var pad = "000000";
      var text = pad.substring(0, pad.length - text.length) + text;
      console.log("formatStation2", text);

      var rightSideIndex = text.indexOf(".") > -1 ? text.indexOf(".") : text.length;

      console.log("rightSideIndex", rightSideIndex);
      console.log("leftSideIndex", rightSideIndex);

      var retValue = this.splice(text, rightSideIndex - 2, 0, "+");
      console.log('returning:', retValue);
      return retValue;
    }
  });
});
//# sourceMappingURL=Widget.js.map
