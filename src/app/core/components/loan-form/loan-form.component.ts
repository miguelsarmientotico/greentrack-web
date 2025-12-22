import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { User } from '../../models/User';
import { Device } from '../../models/Device';
import { UserService } from '../../services/user.service';
import { DeviceService } from '../../services/device.service';
import { LoanService } from '../../services/loan.service';
import { MatStepperModule } from '@angular/material/stepper';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-loan-form',
  imports: [
    CommonModule,
    AgGridAngular,
    MatStepperModule,
    MatPaginatorModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './loan-form.component.html',
  styleUrls: ['./loan-form.component.scss']
})
export class LoanFormComponent implements OnInit {

  snackBar = inject(MatSnackBar);

  userFormGroup!: FormGroup;
  deviceFormGroup!: FormGroup;

  selectedUser: { id: string, fullName: string } | null = null;
  selectedDevice: { id: string, name: string } | null = null;

  userRowData: User[] = [];
  totalUsers = 0;
  userPageSize = 10;
  userCurrentPage = 0;

  userColDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: true,
      width: 50,
      headerCheckboxSelection: false
    },
    { field: 'id', hide: true },
    { field: 'username', headerName: 'Usuario', flex: 1 },
    { field: 'fullName', headerName: 'Nombre Completo', flex: 1.5 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'role', headerName: 'Rol', width: 120 }
  ];

  deviceRowData: Device[] = [];
  totalDevices = 0;
  devicePageSize = 10;
  deviceCurrentPage = 0;

  deviceColDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: true,
      width: 50
    },
    { field: 'id', hide: true },
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'deviceType', headerName: 'Tipo', width: 140 },
    { field: 'brand', headerName: 'Marca', flex: 1 },
    { field: 'deviceStatus', headerName: 'Estado', width: 120 }
  ];

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private userService: UserService,
    private deviceService: DeviceService,
    private loanService: LoanService,
  ) {}

  ngOnInit() {
    this.userFormGroup = this._formBuilder.group({
      selectedUserId: ['', Validators.required]
    });
    this.deviceFormGroup = this._formBuilder.group({
      selectedDeviceId: ['', Validators.required]
    });
    this.loadUsers();
    this.loadDevices();
  }

  loadUsers() {
    this.userService.getUsers(this.userCurrentPage, this.userPageSize).subscribe(res => {
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

  onUserPageChange(event: any) {
    this.userCurrentPage = event.pageIndex;
    this.userPageSize = event.pageSize;
    this.loadUsers();
  }

  loadDevices() {
    this.deviceService.getDevices(this.deviceCurrentPage, this.devicePageSize).subscribe(res => {
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

  onDevicePageChange(event: any) {
    this.deviceCurrentPage = event.pageIndex;
    this.devicePageSize = event.pageSize;
    this.loadDevices();
  }

  crearPrestamo() {
    if(!this.selectedUser || !this.selectedDevice) return;

    const loanPayload = {
      employeeId: this.selectedUser.id,
      deviceId: this.selectedDevice.id,
    };

    console.log('Enviando Payload:', loanPayload);

    this.loanService.addLoan(loanPayload).subscribe({
      next: () => {
        this.snackBar.open('Prestamo Creado', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/u/loans']);
      },
      error: (err) => console.error('Error creando usuario', err)
    });
  }
}
