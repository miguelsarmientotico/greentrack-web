import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Material
import { MatStepperModule } from '@angular/material/stepper';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// AG Grid
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';

// Services & Models
import { User } from '../../models/User';
import { Device } from '../../models/Device';
import { UserService } from '../../services/user.service';
import { DeviceService } from '../../services/device.service';
import { LoanService } from '../../services/loan.service';

@Component({
  selector: 'app-loan-form',
  imports: [
    CommonModule,
    AgGridAngular,
    ReactiveFormsModule, // Importante para los formControls de búsqueda
    MatStepperModule,
    MatPaginatorModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './loan-form.component.html',
  styleUrls: ['./loan-form.component.scss']
})
export class LoanFormComponent implements OnInit, OnDestroy {

  private snackBar = inject(MatSnackBar);
  private sub = new Subscription(); // Para gestionar la limpieza de observadores

  // --- STEP 1: USUARIOS ---
  userFormGroup!: FormGroup;
  userSearchControl = new FormControl(''); // Filtro Global Usuario
  selectedUser: { id: string, fullName: string } | null = null;

  userRowData: User[] = [];
  totalUsers = 0;
  userPageSize = 10;
  userCurrentPage = 0;

  userColDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, width: 50, headerCheckboxSelection: false },
    { field: 'id', hide: true },
    { field: 'username', headerName: 'Usuario', flex: 1 },
    { field: 'fullName', headerName: 'Nombre Completo', flex: 1.5 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'role', headerName: 'Rol', width: 120 }
  ];

  // --- STEP 2: EQUIPOS ---
  deviceFormGroup!: FormGroup;
  deviceSearchControl = new FormControl(''); // Filtro Global Equipo
  selectedDevice: { id: string, name: string } | null = null;

  deviceRowData: Device[] = [];
  totalDevices = 0;
  devicePageSize = 10;
  deviceCurrentPage = 0;

  deviceColDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, width: 50 },
    { field: 'id', hide: true },
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'type', headerName: 'Tipo', width: 140 },
    { field: 'brand', headerName: 'Marca', flex: 1 },
    { field: 'status', headerName: 'Estado', width: 120 }
  ];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private userService: UserService,
    private deviceService: DeviceService,
    private loanService: LoanService,
  ) {}

  ngOnInit() {
    this.initForms();
    this.initSearchListeners();
    this.loadUsers();
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe(); // Limpieza de memoria
  }

  private initForms() {
    this.userFormGroup = this._formBuilder.group({
      selectedUserId: ['', Validators.required]
    });
    this.deviceFormGroup = this._formBuilder.group({
      selectedDeviceId: ['', Validators.required]
    });
  }

  private initSearchListeners() {
    // Listener Usuarios
    this.sub.add(
      this.userSearchControl.valueChanges.pipe(
        debounceTime(500), // Espera 500ms al dejar de escribir
        distinctUntilChanged()
      ).subscribe(() => {
        this.userCurrentPage = 0; // Resetear paginación al buscar
        this.loadUsers();
      })
    );

    // Listener Equipos
    this.sub.add(
      this.deviceSearchControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe(() => {
        this.deviceCurrentPage = 0;
        this.loadDevices();
      })
    );
  }

  // ==========================
  // LÓGICA USUARIOS
  // ==========================
  loadUsers() {
    const filter = {
      globalSearch: this.userSearchControl.value || ''
    };

    this.userService.getUsers(filter, this.userCurrentPage, this.userPageSize).subscribe(res => {
      this.userRowData = res.content;
      this.totalUsers = res.totalElements;
    });
  }

  onUserSelectionChanged(event: SelectionChangedEvent) {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const user = selectedRows[0];
      this.selectedUser = { id: user.id, fullName: user.fullName };
      this.userFormGroup.patchValue({ selectedUserId: user.id });
    } else {
      this.selectedUser = null;
      this.userFormGroup.patchValue({ selectedUserId: '' });
    }
  }

  onUserPageChange(event: PageEvent) {
    this.userCurrentPage = event.pageIndex;
    this.userPageSize = event.pageSize;
    this.loadUsers();
  }

  // ==========================
  // LÓGICA EQUIPOS
  // ==========================
  loadDevices() {
    const filter = {
      globalSearch: this.deviceSearchControl.value || ''
    };

    this.deviceService.getDevices(filter, this.deviceCurrentPage, this.devicePageSize).subscribe(res => {
      this.deviceRowData = res.content;
      this.totalDevices = res.totalElements;
    });
  }

  onDeviceSelectionChanged(event: SelectionChangedEvent) {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const device = selectedRows[0];
      this.selectedDevice = { id: device.id, name: device.name };
      this.deviceFormGroup.patchValue({ selectedDeviceId: device.id });
    } else {
      this.selectedDevice = null;
      this.deviceFormGroup.patchValue({ selectedDeviceId: '' });
    }
  }

  onDevicePageChange(event: PageEvent) {
    this.deviceCurrentPage = event.pageIndex;
    this.devicePageSize = event.pageSize;
    this.loadDevices();
  }

  // ==========================
  // ACCIÓN FINAL
  // ==========================
  crearPrestamo() {
    if(!this.selectedUser || !this.selectedDevice) return;

    const loanPayload = {
      employeeId: this.selectedUser.id,
      deviceId: this.selectedDevice.id,
    };

    this.loanService.addLoan(loanPayload).subscribe({
      next: () => {
        this.snackBar.open('Préstamo creado con éxito', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/u/loans']);
      },
      error: (err) => {
        console.error('Error creando préstamo', err);
        this.snackBar.open('Error al crear préstamo', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
