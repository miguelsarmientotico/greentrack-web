import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, GetRowIdParams } from 'ag-grid-community';
import { BtnCellRenderer } from './btn-cell-renderer.component';

import { Loan, LoanStatusEnum } from '../../models/Loan';

import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LoanService } from '../../services/loan.service';
import { Subscription } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Pagination } from '../../models/Pagination';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-loan-table',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatPaginatorModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './loan-table.component.html',
  styleUrls: ['./loan-table.component.scss']
})
export class LoanTableComponent implements OnInit {

  snackBar = inject(MatSnackBar);

  @ViewChild('createLoanDialog') createLoanDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;
  @ViewChild('returnConfirmDialog') returnConfirmDialog!: TemplateRef<any>;

  totalLoans = 0;
  pageSize = 10;
  currentPage = 1;

  private gridApi!: GridApi<Loan>;

  loanForm!: FormGroup;

  selectedLoan: Loan | null = null;

  private activeDialogRef?: MatDialogRef<any>;

  rowData: Loan[] = [];

  colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'employee.fullName', headerName: 'Empleado', editable: true, flex: 1 },
    { field: 'device.name', headerName: 'Equipo', editable: true, flex: 1 },
    {
      field: 'loanStatus',
      headerName: 'Estado',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: Object.values(LoanStatusEnum) },
      width: 120
    },
    {
      headerName: 'Acciones',
      cellRenderer: BtnCellRenderer,
      width: 140,
      cellRendererParams: {
        onReturnClicked: (loan: Loan) => this.confirmarDevolucion(loan),
      },
      pinned: 'right',
      filter: false,
      sortable: false
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  private getLoansSubscription: Subscription | undefined;

  constructor(
    private loanService: LoanService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadElements();
    this.loanForm = this.fb.group({
      employeeId: ['', Validators.required],
      deviceId: ['', Validators.required],
    });
  }

  loadElements(): void {
    this.getLoansSubscription = this.loanService.getLoans(this.currentPage, this.pageSize).subscribe({
      next: (res: Pagination<Loan>) => {
        this.rowData = res.content;
        this.totalLoans = res.totalElements;
      },
      error: (error) => {
      }
    });
  }

  onGridReady(params: GridReadyEvent<Loan>) {
    this.gridApi = params.api;
  }

  ngOnDestroy(): void {
    if (this.getLoansSubscription) {
      this.getLoansSubscription.unsubscribe();
    }
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    const id = event.data.id;
    const campoEditado = event.colDef.field;
    const nuevoValor = event.newValue;
    if (!campoEditado) return;
    const cambios: Partial<Loan> = {
      [campoEditado]: nuevoValor
    };
    this.loanService.updateLoan(id, cambios).subscribe({
      next: (res) => console.log('Actualizado OK'),
      error: (err) => {
        console.error('Error al actualizar', err);
      }
    });
  }

  abrirModalCreacion() {
    this.activeDialogRef = this.dialog.open(this.createLoanDialog, {
      width: '500px',
      disableClose: true
    });
  }

  guardarNuevoEquipo() {
    if (this.loanForm.invalid) return;
    const formData = this.loanForm.value;
    const payloadParaBackend = { ...formData };
    console.log('🚀 CREATE: Enviando al backend:', payloadParaBackend);

    this.loanService.addLoan(payloadParaBackend).subscribe({
      next: (usuarioCreado) => {
        this.gridApi.applyTransaction({ add: [usuarioCreado] });
        this.activeDialogRef?.close();
      },
      error: (err) => console.error('Error creando usuario', err)
    });

    this.activeDialogRef?.close();

  }

  public getRowId = (params: GetRowIdParams) => {
    return params.data.id;
  };

  confirmarDevolucion(loan: Loan) {
    this.selectedLoan = loan;
    this.activeDialogRef = this.dialog.open(this.returnConfirmDialog, {
      width: '400px'
    });
  }

  confirmarEliminacion(loan: Loan) {
    this.selectedLoan = loan;
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, {
      width: '400px'
    });
  }

  procederDevolucion() {
    const currentLoan = this.selectedLoan;
    if (!currentLoan) return;
    this.loanService.returnLoan(currentLoan.id).subscribe({
      next: () => {
        const rowToUpdate = {
          ...currentLoan,
          loanStatus: LoanStatusEnum.DEVUELTO
        };

        this.gridApi.applyTransaction({ update: [rowToUpdate] });

        this.activeDialogRef?.close();
        this.selectedLoan = null;
        this.snackBar.open('Equipo Devuelto', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },

      error: (err) => {
        console.error('Error eliminando', err);
      }
    });
  }

  procederEliminacion() {
    if (!this.selectedLoan) return;
    console.log('🗑️ DELETE: Eliminando ID:', this.selectedLoan.id);
    this.loanService.deleteLoan(this.selectedLoan.id).subscribe({
      next: () => {
        this.gridApi.applyTransaction({ remove: [this.selectedLoan!] });
        this.activeDialogRef?.close();
        this.selectedLoan = null;
      },
      error: (err) => console.error('Error eliminando', err)
    });
    this.activeDialogRef?.close();
    this.selectedLoan = null;
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedLoan = null;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadElements();
  }
}
