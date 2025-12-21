import { Component } from '@angular/core';
import { UserTableComponent } from '../../../core/components/user-table/user-table.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-users',
  imports: [UserTableComponent, MatCardModule, MatButtonModule, MatDividerModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {

}
