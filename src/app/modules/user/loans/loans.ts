import { Component } from '@angular/core';
import { LoanTableComponent } from '../../../core/components/loan-table/loan-table.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-loans',
  imports: [LoanTableComponent, MatCardModule, MatButtonModule, MatDividerModule],
  templateUrl: './loans.html',
  styleUrl: './loans.scss',
})
export class Loans {

}
