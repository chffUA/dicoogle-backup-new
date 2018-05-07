import { ViewerService } from '../../services/viewer.service';

var OpenSeadragon = require('../../../resources/scripts/openseadragon');
require('../../../resources/scripts/openseadragon-fabricjs-overlay');

var RectangleAnn = require('./rectangle-an');
var RulerAnn = require('./ruler-an');

declare var fabric: any;

var jQuery = require('jquery');

import { AnnotationPopupComponent } from "../windows/annotation-popup.component";
import { WindowsService } from '../../services/windows.service';
import { AnnotationService } from '../../services/annotation.service';
import { Point } from '../../classes/point';

export class FabricOverlayController {

    //Configurations
    maximum_annotation_width = 50;
    minimum_annotation_width = 5;
    deprecatedBrowser: boolean;

    osd_innertracker: any;
    fabric_innertracker:any;

    annotations: any[] = [];
    overlay: any;

    state: State;

    viewer: any; // Openseadragon Object;

    mouseTracker: any;
    controller: any = undefined;
    resizeTracker: any;
    drawingType: AnnotationTypes;

    selectedIndexAnnot: number;

    viewer_resolution: number;


    constructor(viewer: any, private viewerService: ViewerService, private windowsService: WindowsService, private annotationService: AnnotationService, private seriesInstanceUid: string) {
        this.viewerService.rotationChanged.subscribe((obj: number) => this.rotationChanged(obj));
        this.windowsService.saveAnnotationClicked.subscribe((obj: any) => this.saveAnnotation(obj));
        this.windowsService.removePopupEvent.subscribe((obj: any) => this.removeAnnotation(obj));
        this.windowsService.downloadAnnotationClicked.subscribe((obj: any) => this.downloadAnnotation(obj));

        this.state = State.Disabled;
        this.viewer = viewer;

        this.viewer_resolution = viewer.scalebarInstance.pixelsPerMeter;

        let _tt = this;
        this.osd_innertracker = this.viewer.innerTracker;
        this.fabric_innertracker = new OpenSeadragon.MouseTracker({
            element: viewer.container,
            startDisabled: true,
            clickTimeThreshold: this.osd_innertracker.clickTimeThreshold,
            clickDistThreshold: 	this.osd_innertracker.clickDistThreshold,
            dblClickTimeThreshold: this.osd_innertracker.dblClickTimeThreshold,
            dblClickDistThreshold: this.osd_innertracker.dblClickDistThreshold,
            stopDelay: undefined,
            enterHandler: undefined, 
            exitHandler: undefined,
            pressHandler: undefined,
            nonPrimaryPressHandler: undefined, 	
            releaseHandler: undefined,
            nonPrimaryReleaseHandler: undefined,
            moveHandler: undefined,
            scrollHandler: this.osd_innertracker.scrollHandler,
            clickHandler: undefined, 
            dblClickHandler:undefined, 
            dragHandler: undefined,
            dragEndHandler: undefined,
            pinchHandler: undefined,
            keyDownHandler: undefined, 
            keyUpHandler: undefined, 
            keyHandler: undefined,
            focusHandler: undefined, 
            blurHandler: undefined, 
        });
        
        this.viewer.addHandler("zoom", (evt: any) => {
            let m = this.getAnnotationsStrokeWidth();
            this.annotations.forEach((item, index) => {
                item.setStrokeWidth(m);
            });
        });

        this.mouseTracker = new OpenSeadragon.MouseTracker({
            element: viewer.container,
            dragHandler: (event: any) => {
                let webPoint = event.position;
                let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
                let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
                let canvas = _tt.overlay.fabricCanvas();

                //tt.coordinates_changed({ x: Math.round(imagePoint.x * 100) / 100, y: Math.round(imagePoint.y * 100) / 100 });

                if (_tt.controller == undefined) {
                    if (canvas.getActiveObject())
                        return false;

                    switch (_tt.drawingType) {
                        case AnnotationTypes.RECT:
                            _tt.controller = new RectangleAnn.RectangleAnn(imagePoint.x, imagePoint.y, 0, 0, 0);
                            break;
                        case AnnotationTypes.RULER:
                            _tt.controller = new RulerAnn.RulerAnn(imagePoint, imagePoint, _tt.viewer_resolution);
                            break;
                    }

                    _tt.controller.setStrokeWidth(this.getAnnotationsStrokeWidth());

                    canvas.add(_tt.controller);
                    canvas.setActiveObject(_tt.controller);
                } else {
                    _tt.controller.setDimentions(imagePoint);
                    //console.log("DRAG: ", _this.controller.left, _this.controller.top, w, h, webPoint, imagePoint);
                }

                _tt.overlay.resizecanvas();
            },
            dragEndHandler: function (event: any) {
                //let webPoint = event.position;
                //let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
                //let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
                let canvas = _tt.overlay.fabricCanvas();
                canvas.deactivateAll();
                //console.log("DRAG END: ", webPoint, viewportPoint, imagePoint);

                _tt.overlay.resizecanvas();

                _tt.annotations.push(_tt.controller);
                _tt.endDrawing();

                // obj[] = [mouse.x, mouse.y, annotation, fill]
                _tt.selectedIndexAnnot = _tt.annotations.length - 1;
                _tt.windowsService.setupAnnotation([event.position.x, event.position.y, "", "black", ""]);
                _tt.controller = undefined;
            }
        });        
        
        this.deprecatedBrowser = (<any>window).PointerEvent && ( (<any>window).navigator.pointerEnabled || OpenSeadragon.Browser.vendor !== OpenSeadragon.BROWSERS.IE );
        
        this.overlay = viewer.fabricjsOverlay();
        let canvas = this.overlay.fabricCanvas();        
        if(!this.deprecatedBrowser){
            canvas.upperCanvasEl.addEventListener("mousedown", (event:any) => {
                if(this.state == State.Enabled){
                    event.stopPropagation();
                }else if(this.state == State.PendingDisable){
                    this.state = State.Disabled;
                    event.stopPropagation();
                }
            });
        }
    }

    private getAnnotationsStrokeWidth(){
        let viewportZoom = this.viewer.viewport.getZoom(true);
        let zoom = Math.min(this.viewer.viewport.viewportToImageZoom(viewportZoom), 1);
        let m = this.minimum_annotation_width + (1-zoom)*this.maximum_annotation_width;
        //console.log("ZOOM LEVELS: ", viewportZoom, zoom, m);
        return m;
    }

    drawOverlay(viewer: any) {
        let canvas = this.overlay.fabricCanvas();
        canvas.on("selection:cleared", (event :any) => {
            //console.log(event.e);            
            this.state = (this.deprecatedBrowser) ? State.Disabled: State.PendingDisable;
            this.viewer.innerTracker.setTracking(true);
            this.viewer.outerTracker.setTracking(true);
            this.fabric_innertracker.setTracking(false);
            //console.log("Edit Mode: Disabled");
        });
        this.populateAnnotations();
    }

    enableEditMode(event:any){
        if(this.state != State.Disabled)
            return false;

        let canvas = this.overlay.fabricCanvas();
        let target = canvas.findTarget(event.originalEvent);
        if (target) {
            target.selectable = true;
            canvas.setActiveObject(target);
            this.state = State.Enabled;
            this.viewer.innerTracker.setTracking(false);
            this.viewer.outerTracker.setTracking(false);
            this.fabric_innertracker.setTracking(true);
            //console.log("Edit Mode: Enabled");

            this.annotations.forEach((item, index) => {
                if (item == target) {
                    this.selectedIndexAnnot = index;
                }
            });
            // obj[] = [mouse.x, mouse.y, annotation, fill]
            this.windowsService.setupAnnotation([event.position.x, event.position.y, target.annotation, target.stroke, target.title]);
        }
        return true;
    }

    startDrawing(viewer: any, type: AnnotationTypes) {
        this.state = State.Drawing;
        this.drawingType = type;
        this.mouseTracker.setTracking(true);  
            
    }

    endDrawing() {
        this.state = State.Disabled;
        this.mouseTracker.setTracking(false);
        this.viewerService.endDrawingOverlay.emit();
        
    }

    rotationChanged(degrees: number) {
        /*if(degrees == 0){
            for(let i in this.annotations){
                this.annotations[i].setInteraction(true);
            }
        }else{
            for(let i in this.annotations){
                this.annotations[i].setInteraction(false);
            }
        }*/
    }

    saveAnnotation(obj: any) {
        this.annotations[this.selectedIndexAnnot].annotation = obj[0];
        if (obj[1] != "rgba(0,0,0,0)") {
            this.annotations[this.selectedIndexAnnot].stroke = obj[1];
            this.overlay.fabricCanvas().renderAll();
        }
        this.annotations[this.selectedIndexAnnot].title = obj[2];

        this.annotationService.postAnnotation(this.annotations[this.selectedIndexAnnot], this.seriesInstanceUid).subscribe();
		
		let ann = this.annotations[this.selectedIndexAnnot];
		
		if (ann.type=="rectangle") {	
			this.viewerService.informDatabase({name: "ANNOTATION", type: ann.type, id: this.selectedIndexAnnot, 
			left: Math.floor(ann.left), top: Math.floor(ann.top), height: Math.floor(ann.height), width: Math.floor(ann.width), 
			stroke: ann.stroke, strokeWidth: ann.strokeWidth, title: ann.title, body: ann.annotation, angle: Math.floor(ann.angle)});
		} else if (ann.type=="ruler") {
			this.viewerService.informDatabase({name: "ANNOTATION", type: ann.type, id: this.selectedIndexAnnot, 
			x1: Math.floor(ann.x1), y1: Math.floor(ann.y1), x2: Math.floor(ann.x2), y2: Math.floor(ann.y2), 
			stroke: ann.stroke, strokeWidth: ann.strokeWidth, title: ann.title, body: ann.annotation});
		}
		
		/*for (var r in this.annotations[this.selectedIndexAnnot]) {
			console.log(r);
		}*/
    }

    replicateAnnotation(msg: any) {
        let ann: any = null;

        if (msg.type == "rectangle") {
            ann = new RectangleAnn.RectangleAnn(msg.left, 
                msg.top, msg.width, 
                msg.height, msg.angle);
        } else if (msg.type == "ruler") {
            ann = new RulerAnn.RulerAnn(new Point(msg.x1,msg.y1), 
                new Point(msg.x2,msg.y2), this.viewer_resolution);
        }

        ann.setDescription(msg.body);
        ann.setTitle(msg.title);
        ann.setStroke(msg.stroke);
        ann.setStrokeWidth(msg.strokeWidth);
        ann.uid = msg.id;

        this.overlay.fabricCanvas().add(ann);
        this.annotations.push(ann);
        this.annotations[msg.id] = ann;

        this.annotationService.postAnnotation(this.annotations[msg.id], this.seriesInstanceUid).subscribe();
    }

    removeReplicatedAnnotation(id: number) {
        let uid = this.annotations[id].uid;
        this.overlay.fabricCanvas().remove(this.annotations[id]);
        this.annotations.splice(id, 1);
        this.annotationService.deleteAnnotation(uid, this.seriesInstanceUid).subscribe();
    }

    removeAnnotation(obj: any) {
        let uid = this.annotations[this.selectedIndexAnnot].uid;
        this.overlay.fabricCanvas().remove(this.annotations[this.selectedIndexAnnot]);
        this.annotations.splice(this.selectedIndexAnnot, 1);

        //console.log(uid);
        this.annotationService.deleteAnnotation(uid, this.seriesInstanceUid).subscribe();
		this.viewerService.informDatabase({name: "DELETE", value: this.selectedIndexAnnot});
		//console.log("del "+this.selectedIndexAnnot);
    }

    downloadAnnotation(obj: any) {
        //this.annotationService.getAnnotation(this.selectedIndexAnnot.toString(), this.seriesInstanceUid).subscribe(res => { console.log(res); });
        this.annotationService.getAllAnnotations(this.seriesInstanceUid).subscribe(res => { console.log(res); });
    }

    populateAnnotations() {
        //console.log(this.overlay.fabricCanvas());
        this.annotationService.getAllAnnotations(this.seriesInstanceUid).subscribe(res => {
            let canvas = this.overlay.fabricCanvas();

            for (let i in res) {
                let ann: any = null;

                switch (res[i].type) {
                    case "rectangle":
                        ann = new RectangleAnn.RectangleAnn(res[i].annotation.left, res[i].annotation.top, res[i].annotation.width, res[i].annotation.height, res[i].annotation.angle);
                        break;

                    case "ruler":
                        ann = new RulerAnn.RulerAnn(res[i].annotation.startingPoint, res[i].annotation.endingPoint, this.viewer_resolution);
                        break;
                }

                if (ann != null) {
                    ann.setDescription(res[i].annotation.text);
                    ann.setTitle(res[i].annotation.title);
                    ann.setStroke(res[i].annotation.stroke);
                    ann.uid = res[i].uid;

                    canvas.add(ann);
                    this.annotations.push(ann);
                }
            }
        });
    }
}

enum State {
    Disabled,
    Drawing,
    Enabled,
    PendingDisable
}

export enum AnnotationTypes {
    RECT,
    RULER
}