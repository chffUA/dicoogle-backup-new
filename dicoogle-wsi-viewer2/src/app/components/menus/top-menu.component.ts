import {
    Component, OnInit, EventEmitter, Output, trigger,
    state,
    style,
    transition,
    animate
} from '@angular/core';

import { ActivatedRoute, Params } from '@angular/router';
import { WindowsService } from '../../services/windows.service';
import { ViewerService } from '../../services/viewer.service';

import { AnnotationTypes } from '../overlays/fabric-overlays';

var jQuery = require('jquery');
require('../../../resources/scripts/02-bootstrap');
require('../../../resources/css/font-viewer.css');
//declare var __DEV__: boolean;

@Component({
    selector: 'top-menu',
    templateUrl: './top-menu.component.html',
    styleUrls: ['./top-menu.component.css'],
    animations: [
        trigger('flyInOut', [
            state('in', style({ transform: 'translateX(0)' })),

            transition('void => *', [style({ transform: 'translateX(100%)' }), animate(100)]),

            transition('* => void', [animate(100, style({ transform: 'translateX(100%)' }))])
        ])
    ]
})

export class TopMenuComponent implements OnInit {

    constructor(private windowsService: WindowsService, private viewerService: ViewerService) {

    }

    totalRotation = 0;
    isBarActive = true;
    isAutoHideActive = false;

    ngOnInit() {
        jQuery('.dropdown-toggle').dropdown();
    }

    @Output()
    fullScreenChange = new EventEmitter();

    fullscreenClick(): void {
        this.fullScreenChange.emit();
    }

    @Output()
    rotationChange = new EventEmitter();

    rotateClick(angle: number): void {
        this.totalRotation += angle;
        this.rotationChange.emit(angle);
    }

    imgAdjClick(): void {
        this.windowsService.displayImageAdjustments = !this.windowsService.displayImageAdjustments;
    }

    imgInfoClick(): void {
        this.windowsService.displayImageInformation = !this.windowsService.displayImageInformation;
    }

    hideShowClick(): void {
        this.windowsService.displayDock = !this.windowsService.displayDock;
        jQuery(".navigator").toggle(250);
        this.changeShownState();
        this.isAutoHideActive = !this.isAutoHideActive;
    }

    resetTotalClick(): void {
        this.windowsService.displayImageAdjustments = false;
        this.windowsService.displayImageInformation = false;
        this.rotationChange.emit(-this.totalRotation);
        this.totalRotation = 0;
        this.viewerService.changeFilter([]);
        this.viewerService.resetZoom();
    }

    fitClick(): void {
        this.viewerService.resetZoom();
    }

    changeShownState(): void {
        if (!this.isAutoHideActive) {
            this.isBarActive = true;
        } else {
            this.isBarActive = !this.isBarActive;
        }
    }

    startDrawingAnnotation(type: number) {
        switch (type) {
            case 0:
                this.viewerService.startDrawingOverlay.emit(AnnotationTypes.RECT);
                break;
            case 1:
                this.viewerService.startDrawingOverlay.emit(AnnotationTypes.RULER);
                break;
        }
    }
}
