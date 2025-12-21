import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { LoanFormComponent } from '../../../../core/components/loan-form/loan-form.component';

@Component({
  selector: 'app-new-loan',
  imports: [LoanFormComponent, MatCardModule, MatButtonModule, MatDividerModule],
  templateUrl: './new-loan.html',
  styleUrl: './new-loan.scss',
})
export class NewLoan {}
