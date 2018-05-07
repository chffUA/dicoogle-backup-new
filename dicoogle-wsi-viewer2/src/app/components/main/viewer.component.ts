import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';

import { ActivatedRoute, Params, Router } from '@angular/router';

import { SideDockComponent } from "../menus/side-dock.component";
import { TopMenuComponent } from "../menus/top-menu.component";

import { ViewerService } from '../../services/viewer.service';
import { ErrorService } from '../../services/error.service';
import { WindowsService } from '../../services/windows.service';
import { AnnotationService } from '../../services/annotation.service';

import { FabricOverlayController, AnnotationTypes } from '../overlays/fabric-overlays';
import { Point, ImagePoint } from '../../classes/point';

var OpenSeadragon = require('../../../resources/scripts/openseadragon');
require('../../../resources/scripts/openseadragon-filtering');
require('../../../resources/scripts/OpenSeadragonScalebar/openseadragon-scalebar');
require('../../../resources/scripts/openseadragon-fabricjs-overlay');

var jQuery = require('jquery');
var screenfull = require('screenfull');
import '../../scripts/WADOTileSource';

declare var __DEV__: boolean;
declare var Caman: any;
declare var fabric: any;
declare var eventjs: any;

var caman = Caman;
caman.Store.put = function () { };

@Component({
    selector: 'main-viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.css'],
    //providers: [ViewerService],
})

export class ViewerComponent implements OnInit, AfterViewInit {
    //@ViewChild(SideDockComponent) dock: ViewContainerRef;
    //@ViewChild(SideDockComponent, {read: ViewContainerRef}) dock:ViewContainerRef;
    //@ViewChild(TopMenuComponent) menu: TopMenuComponent;
    wado_source: any;
    seriesInstanceUID: string;
    studyInstanceUID: string;
    viewer: any;
    standardMouseTracker: any;

	lastZoomValue: number;
    lastFlipValue: number;
    lastMouseUpdate: number;
    minMouseUpdateDelay: number;

    overlayController: FabricOverlayController;
    navigatorContainerPosition = { top: 0, left: 0, width: 0, height: 0 };

    longpress_timer: any;
	
    db: string;
    server: any;

    constructor(private route: ActivatedRoute, private viewerService: ViewerService, private errorService: ErrorService, private windowsService: WindowsService, private router: Router, private annotationService: AnnotationService) {
        this.viewerService.filterChanged.debounceTime(500).subscribe((obj: any[]) => this.filterChangedHandler(obj));
        this.viewerService.resetClicked.subscribe((obj: any[]) => this.resetZoomClicked(obj));
        this.viewerService.fullscreenClicked.subscribe((obj: any[]) => this.toggleFullscreen());

        this.viewerService.startDrawingOverlay.subscribe((ann_type: AnnotationTypes) => this.drawAnnotation(ann_type));
        this.viewerService.endDrawingOverlay.subscribe((obj: any) => this.activateMouseTrackers());
        this.longpress_timer = undefined;
		
		//ignore useless commands
		this.lastZoomValue = -1;
        this.lastFlipValue = -1;
        this.lastMouseUpdate = new Date().getTime(); //ms
        this.minMouseUpdateDelay = 2000; //ms
		
		//get db from service
        this.db = this.viewerService.getDB();
        /*MongoClient.connect(this.db, function(err: any, dbo: any) {
        if(!err) {
            this.server = dbo.db("???");
            console.log("component linked to db: "+this.db);
        }
        });	*/
    }
	
	//method that listens to messages sent by db is at the end of ngOnInit()
	
	//method that handles messages received from db
	replicate(msg: any) {
		if (msg.name == "ZOOM") {
			this.lastZoomValue = msg.value;
            this.viewer.viewport.zoomTo(msg.value);

		} else if (msg.name == "FLIP") {
            this.lastFlipValue = msg.value;
            this.viewer.viewport.setRotation(msg.value);

        } else if (msg.name == "FILTERS") {
            this.filterChangedHandler(msg.value);

        } else if (msg.name == "ANNOTATION") {
            this.overlayController.replicateAnnotation(msg);
        
        } else if (msg.name == "DELETE") {
            this.overlayController.removeReplicatedAnnotation(msg.value);
        
        } else if (msg.name == "MOUSE") {
            //may handle multiple overlay types later on
            //this.viewer.addOverlay('c1', new OpenSeadragon.Point(0.1968,0.1262), 'RIGHT');
           /* this.viewer.overlays.push(
                {id: 'right-arrow-overlay-1',
                x: 0.1968,
                y: 0.1262,
                placement: 'RIGHT'});
            console.log(this.viewer.overlays);*/
        
        } else if (msg.name == "PAN") {
            let imageDimens = this.viewer.world.getItemAt(0).getContentSize();
            this.viewer.viewport.panTo(
                new OpenSeadragon.Point(msg.x/imageDimens.x,msg.y/imageDimens.y), 
                false);
        }

        //missing map coords, mouse coords
	}

    toggleFullscreen(): void {
        if (screenfull.enabled) {
            screenfull.toggle();
        } else {
            // Ignore or do something else
        }
    }

    rotationChange(angle: number): void {
        let currentAngle = this.viewer.viewport.getRotation();
        this.viewer.viewport.setRotation(currentAngle + angle);
		let val: number = currentAngle+angle;
		if (val<0) val = 360 + val;
		if (val>=360) val = val - 360;
		
		if (val != this.lastFlipValue) {
            this.viewerService.informDatabase({name: "FLIP", value: val});
            //this.replicate({name: "MOUSE"});
			this.lastFlipValue = val;
		}
    }

    ngOnInit(): void {
        this.route.queryParams.forEach((params: Params) => {
            //console.log(params);
            this.seriesInstanceUID = params['seriesuid'];
            this.studyInstanceUID = params['studyuid'];
            //console.log(seriesInstanceUID);

            this.wado_source = new OpenSeadragon.WADOTileSource(this.studyInstanceUID, this.seriesInstanceUID);

            var success = this.wado_source.requestPyramidInformation();

            if (success) {
                this.viewer = OpenSeadragon({
                    id: "viewermain",
                    prefixUrl: "static/images/",
                    showNavigator: true,
                    tileSources: this.wado_source,
                    showNavigationControl: false,
                    showRotationControl: false,
                    showFullPageControl: false,
                    navigatorAutoFade: false,
                    crossOriginPolicy: 'Anonymous',
                    debugMode: false,
                    overlays: []
                });

                if (this.wado_source.resolution) {
                    this.viewer.scalebar({
                        xOffset: 5,
                        yOffset: 0,
                        barThickness: 3,
                        color: '#555555',
                        fontColor: '#333333',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        pixelsPerMeter: 1000 / this.wado_source.resolution, // From mm to meter
                        fontSize: "1.5em",
                        stayInsideImage: false
                    });
                }

                this.getNavContainerPosition();

                this.viewer.addHandler("resized", (evt: any) => { this.getNavContainerPosition() });

                let tt = this;
                this.standardMouseTracker = new OpenSeadragon.MouseTracker({
                    element: this.viewer.container,
                    moveHandler: function (event: any) {
                        let webPoint = event.position;
                        let viewportPoint = tt.viewer.viewport.pointFromPixel(webPoint);
                        let imagePoint = tt.viewer.viewport.viewportToImageCoordinates(viewportPoint);

                        let x: any;
                        let y: any;
                        x = Math.round(imagePoint.x * 100) / 100;
                        y = Math.round(imagePoint.y * 100) / 100;

                        let isInsideImage = !(x < 0 || y < 0 || x > tt.wado_source.width || y > tt.wado_source.height);

                        let p = new ImagePoint(x, y, isInsideImage);

                        tt.coordinates_changed(p);
                    }
                });
                this.standardMouseTracker.setTracking(true);
                
                //InnerMouseTracker setup!!                
                let innerTracker = this.viewer.innerTracker;
                innerTracker.pressHandler = (event:any) => {
                    this.longpress_timer = setTimeout( (event:any) => {
                        this.overlayController.enableEditMode(event); 
                    }, 800, event);
                };
                innerTracker.releaseHandler = (event:any) => {
                    //get center of window (x,y)
                    let cx = window.innerWidth/2;
                    let cy = window.innerHeight/2;
                    //get corresponding image point
                    let webPoint = event.position;
                    let viewportPoint = tt.viewer.viewport.pointFromPixel(new OpenSeadragon.Point(cx,cy));
                    let imagePoint = tt.viewer.viewport.viewportToImageCoordinates(viewportPoint);
                    this.viewerService.informDatabase({name: "PAN", x: Math.round(imagePoint.x), y: Math.round(imagePoint.y)});
                    clearTimeout(this.longpress_timer);                                      
                };
                let n = innerTracker.dragHandler;
                innerTracker.dragHandler = (event:any) => {
                    clearTimeout(this.longpress_timer);                                      
                    n(event);
                };

                this.viewer.addHandler("rotate", (evt: any) => { this.rotate_changed(this.viewer.viewport.getRotation()) });

                this.viewer.addHandler("zoom", (evt: any) => {
                    let base_magnification = 10 / (1000 * tt.wado_source.resolution); // from mm to um
                    let viewportZoom = tt.viewer.viewport.getZoom(true);
                    let zoom = tt.viewer.viewport.viewportToImageZoom(viewportZoom);
                    let current_magnification = +(zoom * base_magnification).toFixed(2);

                    //console.log("ZOOM LEVELS: ", base_magnification, viewportZoom, zoom, current_magnification);

                    this.zoom_changed(current_magnification);
                });

                this.initFabricsOverlay();
            } else {
                this.errorService.errorMessage = "could not find the desired base image for the seriesInstanceUID provided";
                this.router.navigate(['/error']);
            }
        });

        //start querying the db periodically to update
        var querydb = setInterval(function(){
            /*var query = { address: "Park Lane 38" };
  dbo.collection("customers").find(query).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
  });*/

  //for r in result: this.replicate(r)
            console.log("queried")
        }, 1250);

    }

    ngAfterViewInit() {
    }

    getNavContainerPosition() {
        let jNavigator = jQuery(this.viewer.navigator.container);

        this.navigatorContainerPosition = jNavigator.offset();
        this.navigatorContainerPosition.width = jNavigator.width();
        this.navigatorContainerPosition.height = jNavigator.height();
    }

    @Output()
    navigatorResized = new EventEmitter();

    //Handlers

    filterChangedHandler(filterInfo: any[]) {
        if (filterInfo.length > 0) {

            this.viewer.setFilterOptions({
                filters: {
                    processors: function (context: any, callback: any) {
                        caman(context.canvas, function () {

                            for (let i in filterInfo) {

                                if (filterInfo[i].name === "BRIGHTNESS") {
                                    this.brightness(filterInfo[i].value);
                                } else if (filterInfo[i].name == "CONTRAST") {
                                    this.contrast(filterInfo[i].value);
                                } else if (filterInfo[i].name == "GAMMA") {
                                    this.gamma(filterInfo[i].value);
                                } else if (filterInfo[i].name == "COLOR") {
                                    this.channels({
                                        red: filterInfo[i].value[0],
                                        green: filterInfo[i].value[1],
                                        blue: filterInfo[i].value[2]
                                    });
                                }
                            }
                            // Do not forget to call this.render with the callback
                            this.render(callback);
                        });
                    }
                }
            });

        } else {

            this.viewer.setFilterOptions({
                filters: {
                    processors: []
                }
            });
        }
    }

    // events for image info div
    zoom_changed(zoomInfo: number): void {
		if (zoomInfo != this.lastZoomValue) {
			this.viewerService.zoomChanged.emit(zoomInfo);
			this.viewerService.informDatabase({name: "ZOOM", value: zoomInfo});
			this.lastZoomValue = zoomInfo;
		}
    }

    rotate_changed(angle: number): void {
        this.viewerService.rotationChanged.emit(angle);
    }

    coordinates_changed(coordinatesInfo: ImagePoint): void {
        /*let now = new Date().getTime();
        if (now-this.lastMouseUpdate>=this.minMouseUpdateDelay) {
            this.viewerService.informDatabase({name: "MOUSE", x: Math.floor(coordinatesInfo.x), y: Math.floor(coordinatesInfo.y), user: 0});
            this.lastMouseUpdate = now;
        }*/
        this.viewerService.coordinatesChanged.emit(coordinatesInfo);
    }

    resetZoomClicked(obj: any): void {
        this.viewer.viewport.goHome();
        //this.viewer.viewport.zoomTo(this.viewer.viewport.getHomeZoom());
    }

    //### overlays ###
    initFabricsOverlay() {
        this.overlayController = new FabricOverlayController(this.viewer, this.viewerService, this.windowsService, this.annotationService, this.seriesInstanceUID);
        this.overlayController.drawOverlay(this.viewer);
        
    }

    drawAnnotation(annotation_type: AnnotationTypes) {
        this.viewer.setMouseNavEnabled(false);
        this.standardMouseTracker.setTracking(false);
       //console.log("Entering in drawing mode:"); 
        this.overlayController.startDrawing(this.viewer, annotation_type);
        
    }

    activateMouseTrackers() {
        this.viewer.setMouseNavEnabled(true);
        this.standardMouseTracker.setTracking(true);
    }

    getResolution() {
        return this.wado_source.resolution;
    }
}