import {
    Component, OnInit, EventEmitter,
    trigger,
    state,
    style,
    transition,
    animate
} from '@angular/core';

import { WindowsService } from '../../services/windows.service';

@Component({
    selector: 'annotation-popup',
    templateUrl: './annotation-popup.component.html',
    styleUrls: ['./annotation-popup.component.css'],
    animations: [
        trigger('scale', [
            state('active', style({ transform: 'scale(1)' })),
            transition('void => *', [
                style({ transform: 'scale(0)' }),
                animate(100)
            ]),
            transition('* => void', [
                animate(100, style({ transform: 'scale(0)' }))
            ])
        ])
    ],
})

export class AnnotationPopupComponent {

    annotationSize = [500, 200];
    //width = this.annotationSize[0] + "px";
    height = this.annotationSize[1] + "px";
    left: string;
    top: string;
    insertedText: string;
    pickedColor: string;
    title: string;

    constructor(private windowsService: WindowsService) {
        this.windowsService.setupAnnotationPopupEvent.subscribe((obj: any) => this.setup(obj));
        this.insertedText = "";
    }

    saveClick(): void {
        this.windowsService.saveAnnotation([this.insertedText, this.pickedColor, this.title]);
		//console.log("annotation saved, details below:");
		//console.log("annotation color: "+this.pickedColor+
		//"; title: "+this.title+
		//"; text: "+this.insertedText+
		//"; static relative dimens: "+this.left+" from left, "+this.top+" from top");
		//this.viewerService.informDatabase({name
		//this.viewerService.informDatabaseOfAnno({});
		//console.log("popup save click");
    }


    closeClick(): void {
        this.windowsService.displayAnnotationPopup = false;
		//console.log("annotation closed");
    }

    downloadClick(): void {
        this.windowsService.downloadAnnotation();
    }

    removeClick(): void {
        this.windowsService.removeAnnotation();
        this.closeClick();
    }

    private setup(obj: any) {
        // obj[] = [mouse.x, mouse.y, annotation, fill]
        this.windowsService.displayAnnotationPopup = true;


        if (obj[0] + this.annotationSize[0] > window.innerWidth) {
            this.left = window.innerWidth - this.annotationSize[0] + "px";
        } else {
            this.left = obj[0] + "px";
        }

        if (obj[1] + this.annotationSize[1] > window.innerHeight) {
            this.top = window.innerHeight - this.annotationSize[1] + "px";
        } else {
            this.top = obj[1] + "px";
        }

        this.insertedText = obj[2];
        this.pickedColor = obj[3];
        this.title = obj[4];

    }
}
