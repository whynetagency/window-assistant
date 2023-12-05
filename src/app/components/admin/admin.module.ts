import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin.component';
import { CanvasComponent } from './canvas/canvas.component';
import { AdminRoutingModule } from './admin-routing.module';
import {ClipboardModule} from "ngx-clipboard";
import {TypeaheadModule} from "ngx-bootstrap/typeahead";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgxIntlTelInputModule} from "ngx-intl-tel-input";
import {AppModule} from "../../app.module";

@NgModule({
  declarations: [
    AdminComponent,
    CanvasComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        ClipboardModule,
        TypeaheadModule,
        FormsModule,
        NgxIntlTelInputModule,
        ReactiveFormsModule
    ]
})
export class AdminModule { }
