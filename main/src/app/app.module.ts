import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { AppComponent } from './app.component';
import { AccessRequestComponent } from './components/access-request/access-request.component';
import { AccessRequestService } from './services/access-request.service';
 
@NgModule({
  declarations: [
    AppComponent,
    AccessRequestComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule // Add HttpClientModule here
  ],
  providers: [AccessRequestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
