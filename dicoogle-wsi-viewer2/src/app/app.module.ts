import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { routing, appRoutingProviders } from './app.routing';
import { HttpModule } from '@angular/http';
import { DraggableModule } from './scripts/draggable';

import { AppComponent } from './app.component';
import { ViewerComponent } from './components/main/viewer.component';
import { TopMenuComponent } from './components/menus/top-menu.component';
import { SideDockComponent } from './components/menus/side-dock.component';
import { InfoWindowComponent } from './components/windows/info-window.component';
import { ImageAdjustmentsWindowComponent } from './components/windows/img-adjustments.component';
import { ErrorComponent } from './error.component';
import { AnnotationPopupComponent } from './components/windows/annotation-popup.component';

import { ViewerService } from './services/viewer.service';
import { WindowsService } from './services/windows.service';
import { ErrorService } from './services/error.service';
import { AnnotationService } from './services/annotation.service';

const viewerService = new ViewerService();
const windowsService = new WindowsService();
const errorService = new ErrorService();

@NgModule({
  imports: [
    BrowserModule, routing, FormsModule, HttpModule, DraggableModule
  ],
  declarations: [
    AppComponent, ViewerComponent, TopMenuComponent, SideDockComponent,
    InfoWindowComponent, ImageAdjustmentsWindowComponent, ErrorComponent,
    AnnotationPopupComponent
  ],
  providers: [
    { provide: ViewerService, useValue: viewerService },
    { provide: WindowsService, useValue: windowsService },
    { provide: ErrorService, useValue: errorService },
    AnnotationService
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }