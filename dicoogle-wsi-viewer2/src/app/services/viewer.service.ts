import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { ImagePoint } from '../classes/point';
//import { Hero } from './hero';
//import { HEROES } from './mock-heroes';

@Injectable()
export class ViewerService {

    public filterChanged: EventEmitter<any[]>;

    public zoomChanged: EventEmitter<number>;
    public coordinatesChanged: EventEmitter<ImagePoint>;
    public rotationChanged: EventEmitter<number>;
    public resetClicked: EventEmitter<any>;
    public fullscreenClicked: EventEmitter<any>;

    public startDrawingOverlay: EventEmitter<any>;
    public endDrawingOverlay: EventEmitter<any>;
	
    public db: string;
    public server: any;

    constructor(db: string) {
        this.filterChanged = new EventEmitter<any[]>();

        this.zoomChanged = new EventEmitter<number>();
        this.coordinatesChanged = new EventEmitter<ImagePoint>();
        this.rotationChanged = new EventEmitter<number>();

        this.resetClicked = new EventEmitter<any>();
        this.fullscreenClicked = new EventEmitter<any>();

        this.startDrawingOverlay = new EventEmitter<any>();
        this.endDrawingOverlay = new EventEmitter<any>();
		
		//db instantiation here
		
		this.db = db;
		/*MongoClient.connect(this.db, function(err: any, dbo: any) {
        if(!err) {
            this.server = dbo.db("???");
            console.log("component linked to db: "+this.db);
        }
        });	*/

    }
	
	public getDB() {
		return this.db;
	}

    public changeFilter(object: any[]) {
        this.filterChanged.emit(object);
    }

    public changeZoomInfo(object: number) {
        this.zoomChanged.emit(object);
    }

    public changeCoordinatesInfo(object: ImagePoint) {
        this.coordinatesChanged.emit(object);
    }

    public changeRotationInfo(object: number) {
        this.rotationChanged.emit(object);
    }

    public resetZoom() {
        this.resetClicked.emit();
    }

    public fullscreen() {
        this.fullscreenClicked.emit();
    }
	
	//my stuff
	
    public informDatabase(json: any) { //{name, value}
    /*dbo.collection("customers").insertOne(json, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });*/
		console.log(JSON.stringify(json));
	}
}