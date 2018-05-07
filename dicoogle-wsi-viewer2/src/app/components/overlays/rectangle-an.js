require("script!../../../resources/scripts/fabric.js");

export let RectangleAnn = fabric.util.createClass(fabric.Rect, {
    uid: undefined,
    title: "",
    annotation: "",
    type: "rectangle",
    _startingPoint: { x: 0, y: 0 },

    initialize: function (left, top, width, height, angle) {
        this.callSuper('initialize', {
            left: left,
            top: top,
            originX: 'left',
            originY: 'top',

            width: width,
            height: height,

            fill: 'rgba(0,0,0,0)',
            stroke: 'black',
            strokeWidth: 5,
            strokeDashArray: [15, 15],

            angle: angle,

            transparentCorners: false,
        });

        this.selectable = false;
        this._startingPoint = { x: left, y: top };

        let _temp = this;
        this.on({
            'scaling': function (e) {
                var obj = this,
                    w = obj.width * obj.scaleX,
                    h = obj.height * obj.scaleY,
                    s = obj.strokeWidth;

                obj.set({
                    'height': h,
                    'width': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            },
            'deselected': function (evt) {
               //console.log("Deselected", evt);
                this.selectable = false;
            },
            'modified': function (evt) {
                //This should update the annotation COORDS
                var lastPoint = fabric.util.rotateVector({ x: _temp.width, y: _temp.height }, fabric.util.degreesToRadians(_temp.angle));
                //console.log("modified fired!!", _temp.left, _temp.top, _temp.left + lastPoint.x, _temp.top + lastPoint.y);
            }
        });

    },

    setDimentions: function (imagePoint) {
        this.dim = imagePoint;
        this.set({ left: (this._startingPoint.x > imagePoint.x) ? imagePoint.x : this._startingPoint.x, top: (this._startingPoint.y > imagePoint.y) ? imagePoint.y : this._startingPoint.y, width: Math.abs(this._startingPoint.x - imagePoint.x), height: Math.abs(this._startingPoint.y - imagePoint.y) });
    },

    setDescription: function (descr) {
        this.annotation = descr;
    },

    setTitle: function (title) {
        this.title = title;
    },

    setStroke: function (stroke) {
        this.stroke = stroke;
    },

    setStrokeWidth: function(width) {
        this.strokeWidth = width;
        this.strokeDashArray = [5*width, 5*width];
    },

    save: function () {
        let ret = {
            title: this.title,
            text: this.annotation,
            stroke: this.stroke,
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height,
            //Têm de ser injectadas depois do construtor.
            angle: this.angle,
        }
		console.log("rect from ("+this.left.toFixed(0)+","+this.top.toFixed(0)+
		") with width "+this.width.toFixed(0)+" and height "+this.height.toFixed(0)+" and angle "+this.angle);
        return ret;
    }

});