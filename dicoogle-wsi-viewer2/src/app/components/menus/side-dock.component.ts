import {
    Component, OnInit, EventEmitter, Output, Input, trigger,
    state,
    style,
    transition,
    animate
} from '@angular/core';

import { ActivatedRoute, Params } from '@angular/router';

import { WindowsService } from '../../services/windows.service';

var jQuery = require('jquery');

//declare var __DEV__: boolean;

@Component({
    selector: 'side-dock',
    templateUrl: './side-dock.component.html',
    styleUrls: ['./side-dock.component.css'],
    animations: [
        /*trigger('flyInOut', [
            state('in', style({ transform: 'translateX(0)' })),

            transition('void => *', [style({ transform: 'translateY(100%)' }), animate(100)]),

            transition('* => void', [animate(100, style({ transform: 'translateY(-100%)' }))])
        ]),
        trigger('shrinkOut', [
            state('in', style({ height: '*' })),

            transition('void => *', animate('400ms ease-in')),

            transition('* => void', [style({ height: '*' }), animate(250, style({ height: 0 }))])
        ]),
        trigger('heroState', [
            state('inactive', style({ transform: 'translateX(0) scale(1)' })),
            state('active', style({ transform: 'translateX(0) scale(1.1)' })),
            transition('inactive => active', animate('100ms ease-in')),
            transition('active => inactive', animate('100ms ease-out')),
            transition('void => inactive', [
                style({ transform: 'translateX(-100%) scale(1)' }),
                animate(100)
            ]),
            transition('inactive => void', [
                animate(100, style({ transform: 'translateX(100%) scale(1)' }))
            ]),
            transition('void => active', [
                style({ transform: 'translateX(0) scale(0)' }),
                animate(200)
            ]),
            transition('active => void', [
                animate(200, style({ transform: 'translateX(0) scale(0)' }))
            ])
        ]),*/
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
    ]
})

export class SideDockComponent implements OnInit {

    @Input()
    set containerPosition(position: any) {
        //console.log("Position: ", position);
        this.top = position.top + position.height + 6;
        this.left = position.left;
    }

    top: number;
    left: number;

    constructor(private windowsService: WindowsService) {

    }

    ngOnInit() {

    }

}
