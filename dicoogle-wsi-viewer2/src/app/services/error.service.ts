import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Injectable()
export class ErrorService {

    errorMessage: string;

    constructor() {
        this.errorMessage = " page not found";
    }

}