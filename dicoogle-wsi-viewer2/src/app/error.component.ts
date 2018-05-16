import { Component, Input, OnInit } from '@angular/core';
import { ErrorService } from './services/error.service';

@Component({
    selector: 'error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.css']
})

export class ErrorComponent implements OnInit {
    @Input() message: string;
    
    constructor(
        private errorService: ErrorService,

        //private smth = require("script!./scripts/together.js")
    ) { 
        
    }

    ngOnInit(): void {
        this.message = this.errorService.errorMessage;
        //this.smth.TogetherJs(); 
    }
}