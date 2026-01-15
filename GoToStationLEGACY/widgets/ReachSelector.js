define(['dojo/_base/declare', 'dojo/Evented', 'dijit/_WidgetsInTemplateMixin', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'dojo/text!./templates/ReachSelector.html', 'dojo/dom-construct', 'esri/layers/GraphicsLayer', 'esri/graphic', "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color"], function (declare, Evented, _WidgetsInTemplateMixin, _WidgetBase, _TemplatedMixin, template, domConstruct, GraphicsLayer, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, Color) {
  return declare([_WidgetBase, Evented, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,
    baseClass: 'reachSelector',
    widgetsInTemplate: true,

    // gets called with the widget starts up
    postCreate: function postCreate() {
      this.inherited(arguments);

      this.radioInputs = [];

      // highlight symbol:
      this.highlightSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.50]));

      // create the layer to show the highlight
      this.highlightLayer = new GraphicsLayer();
      this.map.addLayer(this.highlightLayer);

      this.createRadioSelections(this.graphics, this.layer);
    },

    // Cleanup and destroy the widget
    destroy: function destroy() {
      this.inherited(arguments);
      if (this.highlightLayer) {
        this.map.removeLayer(this.highlightLayer);
        this.highlightLayer = null;
      }
    },

    // Creates a radio button for each graphic.
    createRadioSelections: function createRadioSelections(graphics, layer) {
      graphics.forEach(function (graphic) {
        var labelNode = domConstruct.create('label', {
          innerHTML: ' ' + graphic.attributes.RouteReach,
          mouseover: function (evt) {
            this.highlight(graphic);
          }.bind(this),

          mouseout: function (evt) {
            this.clearHighlight();
          }.bind(this),

          style: 'display:block'
        });
        var inputNode = domConstruct.create('input', {
          type: 'radio',
          name: 'opts',
          value: graphic.attributes.RouteReach
        });
        this.radioInputs.push(inputNode);

        domConstruct.place(inputNode, labelNode, 'first');
        domConstruct.place(labelNode, this.radiosWrapper, 'last');
      }.bind(this));
    },

    // Highlight a point on the map
    highlight: function highlight(graphic) {
      if (this.highlightLayer && this.highlightSymbol) {
        this.highlightLayer.clear();
        var highlightGraphic = new Graphic(graphic.geometry, this.highlightSymbol);
        this.highlightLayer.add(highlightGraphic);
      } else {
        console.error('error - could not find layer and symbol');
      }
    },

    // Clear all highlights on the map
    clearHighlight: function clearHighlight() {
      if (this.highlightLayer) {
        this.highlightLayer.clear();
      }
    },

    goButtonClickHandler: function goButtonClickHandler() {
      this.radioInputs.forEach(function (radioElement) {
        if (radioElement.checked) {
          var splitParts = radioElement.value.split('_');
          if (splitParts.length === 2) {
            this.emit('reachChosen', splitParts[1]);
          } else {
            console.error('reach name not found - no split method', splitParts);
          }
        }
      }.bind(this));
    }
  });
});
//# sourceMappingURL=ReachSelector.js.map
