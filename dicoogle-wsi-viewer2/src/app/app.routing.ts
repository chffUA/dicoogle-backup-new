import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewerComponent } from './components/main/viewer.component';
import { ErrorComponent } from './error.component';

const appRoutes: Routes = [
    {
        path: 'viewer',
        component: ViewerComponent
    },
    {
        path: '',
        component: ViewerComponent
    },
    {
        path: 'error',
        component: ErrorComponent
    },
    {
        path: '**',
        redirectTo: 'error'
    }
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
