import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

import { ActivatedRoute, Params } from '@angular/router';

import { ViewerService } from '../../services/viewer.service';

import {Observable} from "rxjs";

var jQuery = require('jquery');

@Component({
    selector: 'img-adjustments',
    templateUrl: './img-adjustments.component.html',
    styleUrls: ['./img-adjustments.component.css'],
    //providers: [ViewerService],
})


export class ImageAdjustmentsWindowComponent implements OnInit, Listner {

    brightControl: Control;
    contrastControl: Control;
    gammaControl: Control;

    rgbControl: RGBControl;

    my_arr: number[] = [];

    clicks: Observable<{}>;
    result: Observable<{}>;

    constructor(private viewerService: ViewerService) {
        this.brightControl = new Control(0, this);
        this.contrastControl = new Control(0, this);
        this.gammaControl = new Control(1, this);

        this.rgbControl = new RGBControl(0, this);
    }

    ngOnInit() {

    }

    changeFilters(): void {
        //console.log("Change Filters");
        let filters: any[] = [];

        if (this.brightControl.enabled) {
            filters.push({ name: "BRIGHTNESS", value: +this.brightControl.value });
        }
        if (this.contrastControl.enabled) {
            filters.push({ name: "CONTRAST", value: +this.contrastControl.value });
        }
        if (this.gammaControl.enabled) {
            filters.push({ name: "GAMMA", value: +this.gammaControl.value });
        }
        if (this.rgbControl.enabled) {
            filters.push({ name: "COLOR", value: [+this.rgbControl.red, +this.rgbControl.green, +this.rgbControl.blue] });
        }

        this.viewerService.filterChanged.emit(filters);
    }


}

interface Listner {
    changeFilters(): void;
}

class Control {

    constructor(value: number, callback: Listner) {
        this.initialValue = value;
        this._value = value;
        this._enabled = false;
        this.callback = callback;
    }

    initialValue: number;
    _value: number;
    _enabled: boolean;
    callback: any;

    set value(val: number) {
        this._value = val;
        if (this._enabled)
            this.callback.changeFilters();
    }

    get value() {
        return this._value;
    }

    set enabled(val: boolean) {
        this._enabled = val;
        this.callback.changeFilters();
    }

    get enabled() {
        return this._enabled;
    }

    reset() {
        this.value = this.initialValue;
    }
}

class RGBControl extends Control {

    constructor(value: number, callback: Listner) {
        super(0, callback);
        this._red = value;
        this._green = value;
        this._blue = value;
    }

    _red: number;
    _green: number;
    _blue: number;

    set red(val: number) {
        this._red = val;
        if (this._enabled)
            this.callback.changeFilters();
    }

    set green(val: number) {
        this._green = val;
        if (this._enabled)
            this.callback.changeFilters();
    }

    set blue(val: number) {
        this._blue = val;
        if (this._enabled)
            this.callback.changeFilters();
    }

    get red() {
        return this._red;
    }

    get green() {
        return this._green;
    }

    get blue() {
        return this._blue;
    }

    reset() {
        this.red = this.initialValue;
        this.green = this.initialValue;
        this.blue = this.initialValue;
    }
}