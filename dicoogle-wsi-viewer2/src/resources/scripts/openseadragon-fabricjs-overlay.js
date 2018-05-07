// OpenSeadragon canvas Overlay plugin 0.0.1 based on svg overlay plugin

(function () {

    if (!window.OpenSeadragon) {
        console.error('[openseadragon-canvas-overlay] requires OpenSeadragon');
        return;
    }


    // ----------
    OpenSeadragon.Viewer.prototype.fabricjsOverlay = function () {


        this._fabricjsOverlayInfo = new Overlay(this);
        return this._fabricjsOverlayInfo;
    };
    // static counter for multiple overlays differentiation
    var counter = (function () {
        var i = 1;

        return function () {
            return i++;
        }
    })();
    // ----------
    var Overlay = function (viewer) {
        var self = this;

        this._viewer = viewer;

        this._containerWidth = 0;
        this._containerHeight = 0;

        this._canvasdiv = document.createElement('div');
        this._canvasdiv.style.position = 'absolute';
        this._canvasdiv.style.left = 0;
        this._canvasdiv.style.top = 0;
        this._canvasdiv.style.width = '100%';
        this._canvasdiv.style.height = '100%';
        this._viewer.canvas.appendChild(this._canvasdiv);

        this._canvas = document.createElement('canvas');

        this._id = 'osd-overlaycanvas-' + counter();
        this._canvas.setAttribute('id', this._id);
        this._canvasdiv.appendChild(this._canvas);
        this.resize();
        this._fabricCanvas = new fabric.Canvas(this._id);
        // disable fabric selection because default click is tracked by OSD
        this._fabricCanvas.selection = false;
        // prevent OSD click elements on fabric objects
        /*this._fabricCanvas.on('mouse:down', function (options) {
            if (options.target) {
                options.e.preventDefault();
                options.e.stopPropagation();
            }
        });*/



        this._viewer.addHandler('update-viewport', function () {
            self.resize();
            self.resizecanvas();

        });

        this._viewer.addHandler('open', function () {
            self.resize();
            self.resizecanvas();
        });

        this.resize();
    };

    // ----------
    Overlay.prototype = {
        // ----------
        canvas: function () {
            return this._canvas;
        },
        fabricCanvas: function () {
            return this._fabricCanvas;
        },
        // ----------
        clear: function () {
            this._fabricCanvas.clearAll();
        },
        // ----------
        resize: function () {
            if (this._containerWidth !== this._viewer.container.clientWidth) {
                this._containerWidth = this._viewer.container.clientWidth;
                this._canvasdiv.setAttribute('width', this._containerWidth);
                this._canvas.setAttribute('width', this._containerWidth);
            }

            if (this._containerHeight !== this._viewer.container.clientHeight) {
                this._containerHeight = this._viewer.container.clientHeight;
                this._canvasdiv.setAttribute('height', this._containerHeight);
                this._canvas.setAttribute('height', this._containerHeight);
            }

        },
        resizecanvas: function () {

            var origin = new OpenSeadragon.Point(0, 0);
            var viewportZoom = this._viewer.viewport.getZoom(true);
            var image1 = this._viewer.world.getItemAt(0);
            var zoom = image1.viewportToImageZoom(viewportZoom);
            var rotation = this._viewer.viewport.getRotation();
            //this._viewer.viewport.setRotation(45);
            //var rotation = 45;

            //console.log("Origin: ", image1, viewportZoom, zoom);

            this._fabricCanvas.setWidth(this._containerWidth);
            this._fabricCanvas.setHeight(this._containerHeight);
            //this._fabricCanvas.setZoom(zoom);

            //console.log("ZOOM: ", this._containerWidth, this._containerHeight, zoom);

            var image1WindowPoint = image1.imageToWindowCoordinates(origin);
            var x = Math.round(image1WindowPoint.x);
            var y = Math.round(image1WindowPoint.y);
            var canvasOffset = this._canvasdiv.getBoundingClientRect();

            var pageScroll = OpenSeadragon.getPageScroll();
            if (pageScroll.x != 0 || pageScroll.y != 0)
                console.log("Huge error!!", pageScroll);

            //console.log("COORDS: ", canvasOffset.left - x + pageScroll.x, canvasOffset.top - y + pageScroll.y, x,y,canvasOffset);

            //this._fabricCanvas.absolutePan(new fabric.Point(canvasOffset.left - x + pageScroll.x, canvasOffset.top - y + pageScroll.y));
            var zoomPanMatrix = [zoom, 0, 0, zoom, x, y];
            var matrix = [Math.cos(this.radians(rotation)), Math.sin(this.radians(rotation)), -Math.sin(this.radians(rotation)), Math.cos(this.radians(rotation)), 0, 0];
            var fullMatrix = fabric.util.multiplyTransformMatrices(zoomPanMatrix, matrix, false);

            //console.log(this._fabricCanvas.viewportTransform, rot,Math.sin(this.radians(rot)), Math.cos(this.radians(rot)), this.radians(rot));
            //console.log(zoomPanMatrix, matrix);
            this._fabricCanvas.setViewportTransform(fullMatrix);
            //var rect = this._fabricCanvas.getObjects()[0];
            //rect.setCoords();
        },
        radians: function (degrees) {
            return degrees * Math.PI / 180;
        },
        degrees: function (radians) {
            return radians * 180 / Math.PI;
        },
    };

})();
