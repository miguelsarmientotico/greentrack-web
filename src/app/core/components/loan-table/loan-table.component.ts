import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Material
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// AG Grid
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, GetRowIdParams } from 'ag-grid-community';

// Custom
import { BtnCellRenderer } from './btn-cell-renderer.component'; // Asegúrate de que este renderer tenga el botón de devolver y eliminar
import { LoanService } from '../../services/loan.service';
import { Loan, LoanStatusEnum } from '../../models/Loan';
import { LoanFilter } from '../../models/loan-filter.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loan-table',
  imports: [
    CommonModule, AgGridAngular, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatPaginatorModule,
    MatSnackBarModule,
    RouterModule
  ],
  providers: [DatePipe],
  templateUrl: './loan-table.component.html',
  styleUrls: ['./loan-table.component.scss'] // Usar mismos estilos que Device/User
})
export class LoanTableComponent implements OnInit, OnDestroy {

  // =====================================
  // 1. DIALOGS & DEPENDENCIES
  // =====================================
  @ViewChild('createLoanDialog') createLoanDialog!: TemplateRef<any>;
  @ViewChild('returnConfirmDialog') returnConfirmDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;

  private readonly loanService = inject(LoanService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  private activeDialogRef?: MatDialogRef<any>;

  // =====================================
  // 2. GRID CONFIG
  // =====================================
  private gridApi!: GridApi<Loan>;

  public getRowId = (params: GetRowIdParams) => params.data.id;

  public defaultColDef: ColDef = {
    sortable: true, filter: true, resizable: true
  };

  public readonly loanStatusList = Object.values(LoanStatusEnum);

  public colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'employee.fullName', headerName: 'Empleado', flex: 1.5 },
    { field: 'device.name', headerName: 'Equipo', flex: 1.5 },
    {
      field: 'issuedAt',
      headerName: 'Fecha Inicio',
      flex: 1,
      valueFormatter: (params) => {
        return this.datePipe.transform(params.value, 'dd/MM/yyyy HH:mm') || '';
      }
    },
    {
      field: 'returnedAt',
      headerName: 'Fecha Fin',
      flex: 1,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return this.datePipe.transform(params.value, 'dd/MM/yyyy HH:mm') || '';
      }
    },
    {
      field: 'status',
      headerName: 'Estado',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: this.loanStatusList },
      width: 130,
      cellStyle: (params) => {
        if (params.value === LoanStatusEnum.ACTIVO) {
          return { color: 'green', fontWeight: 'bold' };
        }
        if (params.value === LoanStatusEnum.DEVUELTO) {
          return { color: 'gray' } as any;
        }
        return undefined;
      }
    },
    {
      headerName: 'Acciones',
      cellRenderer: BtnCellRenderer,
      width: 140,
      pinned: 'right',
      filter: false, sortable: false,
      cellRendererParams: {
        // Asumiendo que tu renderer tiene estos outputs
        onReturnClicked: (loan: Loan) => this.confirmarDevolucion(loan),
        onDeleteClicked: (loan: Loan) => this.confirmarEliminacion(loan)
      }
    }
  ];

  // =====================================
  // 3. STATE (Reactive)
  // =====================================
  public loans$ = this.loanService.loans$;
  public totalLoans$ = this.loanService.totalLoans$;

  public filter: LoanFilter = { globalSearch: '' };
  public pageSize = 10;
  public currentPage = 1;

  public selectedLoan: Loan | null = null;

  // =====================================
  // 4. FORMS
  // =====================================
  public loanForm!: FormGroup;   // Crear
  public filterForm!: FormGroup; // Filtrar

  // =====================================
  // 5. LIFECYCLE
  // =====================================
  ngOnInit(): void {
    this.initForms();
    this.initFilterForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    // Clean up handled by AsyncPipe
  }

  // =====================================
  // 6. INITIALIZATION
  // =====================================
  private initForms(): void {
    this.loanForm = this.fb.group({
      employeeId: ['', Validators.required],
      deviceId: ['', Validators.required],
      // Puedes agregar issuedAt aquí si quieres permitir fechas retroactivas
    });
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      globalSearch: [''],
      employeeFullName: [''],
      deviceName: [''],
      status: [null]
    });

    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(values => {
      this.filter = {
        ...values,
        status: values.status || undefined
      };
      this.currentPage = 1;
      this.loadData();
    });
  }

  private loadData(): void {
    this.loanService.getLoans(this.filter, this.currentPage - 1, this.pageSize)
      .subscribe();
  }

  // =====================================
  // 7. EVENTS
  // =====================================
  onGridReady(params: GridReadyEvent<Loan>) {
    this.gridApi = params.api;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  clearFilters() {
    this.filterForm.reset();
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    const id = event.data.id;
    const campoEditado = event.colDef.field;
    const nuevoValor = event.newValue;

    if (!campoEditado || event.oldValue === nuevoValor) return;

    const cambios: Partial<Loan> = { [campoEditado]: nuevoValor };

    this.loanService.updateLoan(id, cambios).subscribe({
      error: () => this.loadData() // Revertir si falla (recargando)
    });
  }

  // =====================================
  // 8. DIALOG LOGIC
  // =====================================

  // CREAR
  abrirModalCreacion() {
    this.loanForm.reset();
    this.activeDialogRef = this.dialog.open(this.createLoanDialog, { width: '500px', disableClose: true });
  }

  guardarNuevoPrestamo() {
    if (this.loanForm.invalid) return;
    this.loanService.addLoan(this.loanForm.value).subscribe({
      next: () => {
        this.loadData();
        this.cerrarDialogo();
      }
    });
  }

  // DEVOLVER
  confirmarDevolucion(loan: Loan) {
    if (loan.status === LoanStatusEnum.DEVUELTO) {
        this.snackBar.open('Este equipo ya fue devuelto', 'Cerrar', { duration: 3000 });
        return;
    }
    this.selectedLoan = loan;
    this.activeDialogRef = this.dialog.open(this.returnConfirmDialog, { width: '400px' });
  }

  procederDevolucion() {
    if (!this.selectedLoan) return;
    this.loanService.returnLoan(this.selectedLoan.id).subscribe({
      next: () => this.cerrarDialogo()
    });
  }

  // ELIMINAR
  confirmarEliminacion(loan: Loan) {
    this.selectedLoan = loan;
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, { width: '400px' });
  }

  procederEliminacion() {
    if (!this.selectedLoan) return;
    this.loanService.deleteLoan(this.selectedLoan.id).subscribe({
      next: () => this.cerrarDialogo()
    });
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedLoan = null;
  }
}
