import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

import { ActivatedRoute, Params } from '@angular/router';
import { ViewerService } from '../../services/viewer.service';

import { ImagePoint } from '../../classes/point';

var jQuery = require('jquery');

@Component({
    selector: 'info-window',
    templateUrl: './info-window.component.html',
    styleUrls: ['./info-window.component.css']
})

export class InfoWindowComponent implements OnInit {
    zoom: string;
    rotation: number;
    coordinates: string;

    constructor(private viewerService: ViewerService) {
        this.viewerService.zoomChanged.subscribe((obj: number) => this.zoomChanged(obj));
        this.viewerService.coordinatesChanged.subscribe((coords: ImagePoint) => this.coordinatesChanged(coords));
        this.viewerService.rotationChanged.subscribe((obj: number) => this.rotationChanged(obj));
    }

    ngOnInit() {
        this.zoom = "0x";
        this.rotation = 0;
        this.coordinates = "(0, 0)";
    }

    zoomChanged(level: number): void {
        this.zoom = level + "x";
    }

    coordinatesChanged(coords: ImagePoint): void {
        if (coords.isInsideImage)
            this.coordinates = `( ${Math.trunc(coords.x)} , ${Math.trunc(coords.y)} )`;
        else
            this.coordinates = "( ... , ... )";
    }

    rotationChanged(degree: number): void {
        this.rotation = degree;
    }
}
