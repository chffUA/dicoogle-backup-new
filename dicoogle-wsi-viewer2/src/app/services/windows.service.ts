import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Injectable()
export class WindowsService {

    displayImageAdjustments: boolean;
    displayImageInformation: boolean;
    displayDock: boolean;

    displayAnnotationPopup: boolean;

    public saveAnnotationClicked: EventEmitter<any>;
    public setupAnnotationPopupEvent: EventEmitter<any>;
    public removePopupEvent: EventEmitter<any>;
    public downloadAnnotationClicked: EventEmitter<any>;

    constructor() {
        this.displayImageAdjustments = false;
        this.displayImageInformation = false;
        this.displayDock = true;


        this.displayAnnotationPopup = false;

        this.saveAnnotationClicked = new EventEmitter<any>();
        this.setupAnnotationPopupEvent = new EventEmitter<any>();
        this.removePopupEvent = new EventEmitter<any>();
        this.downloadAnnotationClicked = new EventEmitter<any>();
    }


    public saveAnnotation(object: any) {
        this.saveAnnotationClicked.emit(object);
    }

    public setupAnnotation(object: any[]) {
        this.setupAnnotationPopupEvent.emit(object);
    }

    public removeAnnotation() {
        this.removePopupEvent.emit();
    }

    public downloadAnnotation() {
        this.downloadAnnotationClicked.emit();
    }
}