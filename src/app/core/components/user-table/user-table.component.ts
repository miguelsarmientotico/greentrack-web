import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { BtnCellRenderer } from './btn-cell-renderer.component';

import { User } from '../../models/User';
import { RoleEnum } from '../../enum/RoleEnum';

import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Pagination } from '../../models/Pagination';

@Component({
  selector: 'app-user-table',
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
    MatPaginatorModule
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss']
})
export class UserTableComponent implements OnInit {

  @ViewChild('createUserDialog') createUserDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;
  @ViewChild('resetPassDialog') resetPassDialog!: TemplateRef<any>;

  totalUsers = 0;
  pageSize = 10;
  currentPage = 1;

  private gridApi!: GridApi<User>;

  userForm!: FormGroup;
  resetPassForm!: FormGroup;

  selectedUser: User | null = null;

  rolesList = Object.values(RoleEnum);
  statusList = ['ACTIVO', 'INACTIVO'];

  private activeDialogRef?: MatDialogRef<any>;

  rowData: User[] = [];

  colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'username', headerName: 'Usuario', editable: false, flex: 1 },
    { field: 'fullName', headerName: 'Nombre Completo', editable: true, flex: 1.5 },
    { field: 'email', headerName: 'Email', editable: true, flex: 1.5 },
    {
      field: 'userStatus',
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
      cellRendererParams: {
        onDeleteClicked: (user: User) => this.confirmarEliminacion(user),
        onResetClicked: (user: User) => this.abrirModalResetPassword(user)
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

  private getUsersSubscription: Subscription | undefined;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private dialog: MatDialog // Inyección del servicio de Material Dialog
  ) {}

  ngOnInit(): void {
    this.loadElements();
    // Formulario de Creación
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [RoleEnum.USER, Validators.required],
    });

    // Formulario para Reset Password (solo un campo)
    this.resetPassForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  loadElements(): void {
    this.getUsersSubscription = this.userService.getUsers(this.currentPage, this.pageSize).subscribe({
      next: (res: Pagination<User>) => {
        this.rowData = res.content;
        this.totalUsers = res.totalElements;
      },
      error: (error) => {
      }
    });
  }


  onGridReady(params: GridReadyEvent<User>) {
    this.gridApi = params.api;
  }

  ngOnDestroy(): void {
    if (this.getUsersSubscription) {
      this.getUsersSubscription.unsubscribe();
    }
  }

  // --- UPDATE (Edición en línea) ---
  onCellValueChanged(event: CellValueChangedEvent) {
    const id = event.data.id;

    // 1. Obtenemos el nombre del campo que se editó (ej: "price", "name", "email")
    const campoEditado = event.colDef.field;
    const nuevoValor = event.newValue;

    if (!campoEditado) return; // Seguridad por si acaso

    // 2. CREAMOS EL OBJETO DINÁMICO
    // Usamos los corchetes [] para que la clave sea el valor de la variable
    const cambios: Partial<User> = {
      [campoEditado]: nuevoValor
    };

    this.userService.updateUser(id, cambios).subscribe({
      next: (res) => console.log('Actualizado OK'),
      error: (err) => {
        console.error('Error al actualizar', err);
        // Opcional: Revertir cambio en la grilla si falla
      }
    });
  }

  // --- CREATE (Nuevo Usuario) ---
  abrirModalCreacion() {
    this.activeDialogRef = this.dialog.open(this.createUserDialog, {
      width: '500px',
      disableClose: true
    });
  }

  guardarNuevoUsuario() {
    if (this.userForm.invalid) return;

    const formData = this.userForm.value;
    const payloadParaBackend = { ...formData }; // ID null

    console.log('🚀 CREATE: Enviando al backend:', payloadParaBackend);

    this.userService.addUser(payloadParaBackend).subscribe({
      next: (usuarioCreado) => {
        // Ag-Grid: Agregar la fila visualmente con los datos reales del back
        //this.gridApi.applyTransaction({ add: [usuarioCreado] });
        this.gridApi.applyTransaction({ add: [usuarioCreado] });
        this.activeDialogRef?.close();
      },
      error: (err) => console.error('Error creando usuario', err)
    });

    this.activeDialogRef?.close();
    // ---------------------------------------------------
  }

  // --- DELETE (Eliminar Usuario) ---
  confirmarEliminacion(user: User) {
    this.selectedUser = user;
    // Abrimos el template de confirmación
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, {
      width: '400px'
    });
  }

  procederEliminacion() {
    if (!this.selectedUser) return;

    console.log('🗑️ DELETE: Eliminando ID:', this.selectedUser.id);

    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.gridApi.applyTransaction({ remove: [this.selectedUser!] });
        this.activeDialogRef?.close();
        this.selectedUser = null;
      },
      error: (err) => console.error('Error eliminando', err)
    });

    this.activeDialogRef?.close();
    this.selectedUser = null;
    // ------------------
  }

  // --- RESET PASSWORD (Cambio de contraseña) ---
  abrirModalResetPassword(user: User) {
    this.selectedUser = user;
    this.resetPassForm.reset();

    // Abrimos el template de reset password
    this.activeDialogRef = this.dialog.open(this.resetPassDialog, {
      width: '400px'
    });
  }

  guardarNuevaPassword() {
    if (this.resetPassForm.invalid || !this.selectedUser) return;

    const newPass = this.resetPassForm.get('newPassword')?.value;

    console.log(`🔑 RESET PASS: ID ${this.selectedUser.id} -> Nueva pass: ${newPass}`);

    this.userService.updateUser(this.selectedUser.id, {
      password: newPass
    }).subscribe({
      next: (res) => console.log('Actualizado OK'),
      error: (err) => {
        console.error('Error al actualizar', err);
        // Opcional: Revertir cambio en la grilla si falla
      }
    });

    this.activeDialogRef?.close();
    this.selectedUser = null;
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedUser = null;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadElements();
  }
}
