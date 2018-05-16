require("script!../../../resources/scripts/fabric.js");
var convert = require('convert-units');


const supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

export let RulerAnn = fabric.util.createClass(fabric.Object, {
    uid: undefined,
    title: "",
    annotation: "",
    resolution: 0,

    type: 'ruler',
    _fontStyle: "48px serif",
    _fontHeightInImagePixel: 50,
    barHeight: 20,

    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,

    //Resolution in pixels per meter.
    initialize: function (pt1, pt2, resolution) {
        this.callSuper('initialize', {
            originX: 'left',
            originY: 'top',

            fill: 'rgba(0,0,0,0)',
            stroke: 'black',
            strokeWidth: 5,
            strokeDashArray: [15, 15],

            transparentCorners: false,
        });
        this.resolution = resolution;

        this.selectable = false;
        this.centerTransform = false;

        this.setControlsVisibility({
            bl: false,
            br: false,
            mb: false,
            ml: true,
            mr: true,
            mt: false,
            tl: false,
            tr: false,
            mtr: false,
        });

        let _tmp = this;

        this.on({
            'scaling': function (e) {
                let inverseTransform = fabric.util.invertTransform(_tmp.canvas.viewportTransform);
                let point = fabric.util.transformPoint(e.e, inverseTransform, false);
                let corner = _tmp.canvas._currentTransform.corner;

                _tmp.set(_tmp.canvas._currentTransform.original);

                if (corner == 'ml') {
                    _tmp._setX1(point);
                } else if (corner == 'mr') {
                    _tmp._setX2(point);
                }
                //console.log("ON SCALING: ", inverseTransform, e.e.x, e.e.y, point, corner, _tmp.canvas._currentTransform);                
            },
            // 'selected': function () {

            // },
            'deselected': function (evt) {
                //console.log("Deselected", evt);
                this.selectable = false;
            },
            // 'modified': function (evt) {
            //     //This should update the annotation COORDS
            //     var lastPoint = fabric.util.rotateVector({ x: _temp.width, y: _temp.height }, fabric.util.degreesToRadians(_temp.angle));
            //     console.log("modified fired!!", _temp.left, _temp.top, _temp.left + lastPoint.x, _temp.top + lastPoint.y);
            // }
        });

        let settings = {
            angle: 0, //trocar para degaus
            x1: pt1.x,
            y1: pt1.y,
            x2: pt2.x,
            y2: pt2.y,
            height: this.barHeight * 2 + this._fontHeightInImagePixel,
        };

        this.set(settings);

        this._setWidthHeight();
    },

    getStartPoint: function () {
        return { x: this.x1, y: this.y1 };
    },

    getEndPoint: function () {
        return { x: this.x2, y: this.y2 };
    },

    _setWidthHeight: function () {
        //flaten points to extract the angle.
        let pt1 = new fabric.Point(this.x1, this.y1);
        let pt2_o = new fabric.Point(this.x2, this.y2);

        let angle = Math.atan2(pt2_o.y - pt1.y, pt2_o.x - pt1.x);
        this.angle = fabric.util.radiansToDegrees(angle);
        this.angle_r = angle;

        let pt2_t = fabric.util.rotatePoint(pt2_o, pt1, -angle);

        this.left = this.x1;
        this.top = this.y1 - this.barHeight;
        this.width = Math.abs(pt2_t.x - this.x1);
        //console.log("_SET WIDTH height: ", this.x1, this.x2, this.y1, this.y2, this.left, this.top, this.width);
    },

    _set: function (key, value) {
        this.callSuper('_set', key, value);

        switch (key) {
            case 'left':
                this.x1 = this.left;
                break;
            case 'top':
                this.y1 = this.top + this.barHeight;
                break;
        }

        return this;
    },

    _setX1: function (imagePoint) {
        this.set({ x1: imagePoint.x, y1: imagePoint.y });
        this._setWidthHeight();
    },

    _setX2: function (imagePoint) {
        this.set({ x2: imagePoint.x, y2: imagePoint.y });
        this._setWidthHeight();
    },

    setDimentions: function (imagePoint) {
        this._setX2(imagePoint);
    },

    rotateMatrix: function (rotation, tx, ty) {
        return [Math.cos(rotation), Math.sin(rotation), -Math.sin(rotation), Math.cos(rotation), tx, ty];
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
        this.barHeight = 5 * width;
        this.strokeDashArray = [5*width, 5*width];

        let fontPixels = 5*+width.toFixed(0);
        this._fontStyle = `${fontPixels}px serif`;
        this._fontHeightInImagePixel = (fontPixels + width).toFixed(0);
    },

    save: function () {
        let ret = {
            title: this.title,
            text: this.annotation,
            stroke: this.stroke,
            startingPoint: this.getStartPoint(),
            endingPoint: this.getEndPoint(),

            //Têm de ser injectadas depois do construtor.
            //FALTA A COR.
        }
        return ret;
    },

    //OVERIDES AND EXTENDS
    setCoords: function () {

        let vpt = this.getViewportTransform();
        let trf = fabric.util.qrDecompose(vpt);
        let cvpt = fabric.util.multiplyTransformMatrices(vpt, this.rotateMatrix(this.angle_r, this.left, this.top + this.barHeight), false);

        let tl = fabric.util.transformPoint(new fabric.Point(0, -this.barHeight), cvpt),
            tr = fabric.util.transformPoint(new fabric.Point(this.width, -this.barHeight), cvpt),
            bl = fabric.util.transformPoint(new fabric.Point(0, this.barHeight), cvpt),
            br = fabric.util.transformPoint(new fabric.Point(this.width, +this.barHeight), cvpt),
            ml = fabric.util.transformPoint(new fabric.Point(0, 0), cvpt),
            mt = fabric.util.transformPoint(new fabric.Point(this.width / 2, -this.barHeight), cvpt),
            mr = fabric.util.transformPoint(new fabric.Point(this.width, 0), cvpt),
            mb = fabric.util.transformPoint(new fabric.Point(this.width / 2, +this.barHeight), cvpt),
            mtr = new fabric.Point(0, 0);
        // debugging

        this.oCoords = {
            // corners
            tl: tl, tr: tr, br: br, bl: bl,
            // middle
            ml: ml, mt: mt, mr: mr, mb: mb,
            // rotating point
            mtr: mtr
        };

        // set coordinates of the draggable boxes in the corners used to scale/rotate the image
        this._setCornerCoords && this._setCornerCoords();

        return this;
    },

    transform: function (ctx) {
        ctx.translate(this.left, this.top + this.barHeight);
        ctx.rotate(this.angle_r);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Boolean} noTransform
     */
    _render: function (ctx, noTransform) {
        ctx.beginPath();
        if (noTransform) {
            //  Line coords are distances from left-top of canvas to origin of line.
            //  To render line in a path-group, we need to translate them to
            //  distances from center of path-group to center of line.
            var cp = this.getCenterPoint();
            ctx.translate(
                cp.x - this.strokeWidth / 2,
                cp.y - this.strokeWidth / 2
            );
        }

        if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {
            // move from center (of virtual box) to its left/top corner
            // we can't assume x1, y1 is top left and x2, y2 is bottom right
            ctx.beginPath();
            fabric.util.drawDashedLine(ctx, 0, 0, this.width, 0, this.strokeDashArray);
            ctx.closePath();
        }

        var origStrokeStyle = ctx.strokeStyle;
        ctx.strokeStyle = this.stroke;

        ctx.moveTo(0, this.barHeight);
        ctx.lineTo(0, -this.barHeight);

        ctx.moveTo(this.width, this.barHeight);
        ctx.lineTo(this.width, -this.barHeight);

        ctx.stroke();

        let r = this.width / this.resolution;
        let c = convert(r).from('m').toBest();
        let text = `${+c.val.toFixed(2)} ${c.unit}`;

        ctx.fillStyle = 'black';
        ctx.font = this._fontStyle;
        let txt_measures = ctx.measureText(text);
        ctx.fillText(text, this.width - txt_measures.width-20, this._fontHeightInImagePixel);
        ctx.strokeStyle = origStrokeStyle;
    },
});