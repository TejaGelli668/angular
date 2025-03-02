import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessRequestComponent } from './components/access-request/access-request.component';
 
const routes: Routes = [
  { path: '', redirectTo: 'access-request', pathMatch: 'full' }, // Redirect default path
  { path: 'access-request', component: AccessRequestComponent } // Load component
];
 
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }