import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

// AG Grid
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, GetRowIdParams } from 'ag-grid-community';

// Custom
import { BtnCellRenderer } from './btn-cell-renderer.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/User';
import { UserFilter } from '../../models/user-filter.model';
import { RoleEnum } from '../../enum/RoleEnum';
import { UserStatusEnum } from '../../enum/UserStatusEnum';

@Component({
  selector: 'app-user-table',
  imports: [
    CommonModule, AgGridAngular, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatPaginatorModule
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'] // Usamos el mismo SCSS
})
export class UserTableComponent implements OnInit, OnDestroy {

  // =====================================
  // 1. DIALOGS & DEPENDENCIES
  // =====================================
  @ViewChild('createUserDialog') createUserDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;
  @ViewChild('resetPassDialog') resetPassDialog!: TemplateRef<any>;

  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private activeDialogRef?: MatDialogRef<any>;

  // =====================================
  // 2. GRID CONFIG
  // =====================================
  private gridApi!: GridApi<User>;

  public getRowId = (params: GetRowIdParams) => params.data.id;

  public defaultColDef: ColDef = {
    sortable: true, filter: true, resizable: true
  };

  // Listas para Selects
  public readonly rolesList = Object.values(RoleEnum);
  public readonly statusList = Object.values(UserStatusEnum);

  public colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'username', headerName: 'Usuario', editable: false, flex: 1 },
    { field: 'fullName', headerName: 'Nombre Completo', editable: true, flex: 1.5 },
    { field: 'email', headerName: 'Email', editable: true, flex: 1.5 },
    {
      field: 'status', // Asegúrate de que el campo en BD sea 'status' o 'userStatus'
      headerName: 'Estado',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: this.statusList },
      width: 120
    },
    {
      field: 'role',
      headerName: 'Rol',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: this.rolesList },
      width: 120
    },
    {
      headerName: 'Acciones',
      cellRenderer: BtnCellRenderer,
      width: 140,
      pinned: 'right',
      filter: false, sortable: false,
      cellRendererParams: {
        onDeleteClicked: (user: User) => this.confirmarEliminacion(user),
        onResetClicked: (user: User) => this.abrirModalResetPassword(user)
      }
    }
  ];

  // =====================================
  // 3. STATE (Reactive)
  // =====================================
  // Observables directos del servicio
  public users$ = this.userService.users$;
  public totalUsers$ = this.userService.totalUsers$;

  public filter: UserFilter = { globalSearch: '' };
  public pageSize = 10;
  public currentPage = 1;

  public selectedUser: User | null = null;

  // =====================================
  // 4. FORMS
  // =====================================
  public userForm!: FormGroup;      // Para crear
  public resetPassForm!: FormGroup; // Para cambiar pass
  public filterForm!: FormGroup;    // Para filtrar

  // =====================================
  // 5. LIFECYCLE
  // =====================================
  ngOnInit(): void {
    this.initForms();
    this.initFilterForm(); // Iniciar filtros
    this.loadData();
  }

  ngOnDestroy(): void {
    // Las suscripciones async pipe se limpian solas
  }

  // =====================================
  // 6. INITIALIZATION
  // =====================================
  private initForms(): void {
    // Formulario de Creación
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [RoleEnum.USER, Validators.required],
    });

    // Formulario de Reset Password
    this.resetPassForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      globalSearch: [''],
      username: [''],
      fullName: [''],
      email: [''],
      role: [null],
      status: [null]
    });

    // Suscripción a cambios en filtros
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(values => {
      this.filter = {
        ...values,
        role: values.role || undefined,
        status: values.status || undefined
      };
      this.currentPage = 1; // Reset a pág 1
      this.loadData();
    });
  }

  private loadData(): void {
    this.userService.getUsers(this.filter, this.currentPage - 1, this.pageSize)
      .subscribe();
  }

  // =====================================
  // 7. EVENTS
  // =====================================

  onGridReady(params: GridReadyEvent<User>) {
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

    const cambios: Partial<User> = { [campoEditado]: nuevoValor };

    this.userService.updateUser(id, cambios).subscribe({
        error: () => { /* Manejar error si necesario */ }
    });
  }

  // =====================================
  // 8. DIALOG LOGIC
  // =====================================

  // CREAR
  abrirModalCreacion() {
    this.userForm.reset({ role: RoleEnum.USER });
    this.activeDialogRef = this.dialog.open(this.createUserDialog, { width: '500px', disableClose: true });
  }

  guardarNuevoUsuario() {
    if (this.userForm.invalid) return;
    this.userService.addUser(this.userForm.value).subscribe({
      next: () => {
        this.loadData(); // Recargar para ver el nuevo orden
        this.cerrarDialogo();
      }
    });
  }

  // ELIMINAR
  confirmarEliminacion(user: User) {
    this.selectedUser = user;
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, { width: '400px' });
  }

  procederEliminacion() {
    if (!this.selectedUser) return;
    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => this.cerrarDialogo()
    });
  }

  // RESET PASSWORD
  abrirModalResetPassword(user: User) {
    this.selectedUser = user;
    this.resetPassForm.reset();
    this.activeDialogRef = this.dialog.open(this.resetPassDialog, { width: '400px' });
  }

  guardarNuevaPassword() {
    if (this.resetPassForm.invalid || !this.selectedUser) return;
    const newPass = this.resetPassForm.get('newPassword')?.value;

    this.userService.updateUser(this.selectedUser.id, { password: newPass }).subscribe({
      next: () => this.cerrarDialogo()
    });
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedUser = null;
  }
}
