import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DashboardComponent } from '../../../core/components/dashboard/dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, DashboardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}
