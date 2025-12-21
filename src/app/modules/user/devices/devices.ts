import { Component } from '@angular/core';
import { DeviceTableComponent } from '../../../core/components/device-table/device-table.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-devices',
  imports: [DeviceTableComponent, MatCardModule, MatButtonModule, MatDividerModule],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices {

}
