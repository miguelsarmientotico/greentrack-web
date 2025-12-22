import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, GetRowIdParams } from 'ag-grid-community';
import { BtnCellRenderer } from './btn-cell-renderer.component';
import { Device, DeviceStatusEnum, DeviceTypeEnum } from '../../models/Device';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '../../services/device.service';
import { Subscription } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Pagination } from '../../models/Pagination';

@Component({
  selector: 'app-device-table',
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
  templateUrl: './device-table.component.html',
  styleUrls: ['./device-table.component.scss']
})
export class DeviceTableComponent implements OnInit {

  @ViewChild('createDeviceDialog') createDeviceDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;

  totalDevices = 0;
  pageSize = 10;
  currentPage = 1;

  private gridApi!: GridApi<Device>;

  deviceForm!: FormGroup;

  selectedDevice: Device | null = null;
  deviceTypeList = Object.values(DeviceTypeEnum);

  private activeDialogRef?: MatDialogRef<any>;

  rowData: Device[] = [];

  colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'name', headerName: 'Nombre', editable: true, flex: 1 },
    {
      field: 'deviceType',
      headerName: 'Tipo de Equipo',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: Object.values(DeviceTypeEnum) },
      width: 140
    },
    { field: 'brand', headerName: 'Marca', editable: true, flex: 1.5 },
    {
      field: 'deviceStatus',
      headerName: 'Estado',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: Object.values(DeviceStatusEnum) },
      width: 120
    },
    {
      headerName: 'Acciones',
      cellRenderer: BtnCellRenderer,
      width: 140,
      cellRendererParams: {
        onDeleteClicked: (device: Device) => this.confirmarEliminacion(device),
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

  private getDevicesSubscription: Subscription | undefined;

  constructor(
    private deviceService: DeviceService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadElements();
    this.deviceForm = this.fb.group({
      name: ['', Validators.required],
      deviceType: [DeviceTypeEnum.LAPTOP, Validators.required],
      brand: ['', Validators.required],
    });
  }

  loadElements(): void {
    this.getDevicesSubscription = this.deviceService.getDevices(this.currentPage, this.pageSize).subscribe({
      next: (res: Pagination<Device>) => {
        this.rowData = res.content;
        this.totalDevices = res.totalElements;
      },
      error: (error) => {
      }
    });
  }

  onGridReady(params: GridReadyEvent<Device>) {
    this.gridApi = params.api;
  }

  ngOnDestroy(): void {
    if (this.getDevicesSubscription) {
      this.getDevicesSubscription.unsubscribe();
    }
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    const id = event.data.id;
    const campoEditado = event.colDef.field;
    const nuevoValor = event.newValue;
    if (!campoEditado) return;
    const cambios: Partial<Device> = {
      [campoEditado]: nuevoValor
    };

    this.deviceService.updateDevice(id, cambios).subscribe({
      next: (res) => console.log('Actualizado OK'),
      error: (err) => {
        console.error('Error al actualizar', err);
      }
    });
  }

  abrirModalCreacion() {
    this.activeDialogRef = this.dialog.open(this.createDeviceDialog, {
      width: '500px',
      disableClose: true
    });
  }

  guardarNuevoEquipo() {
    if (this.deviceForm.invalid) return;
    const formData = this.deviceForm.value;
    const payloadParaBackend = { ...formData };
    console.log('🚀 CREATE: Enviando al backend:', payloadParaBackend);
    this.deviceService.addDevice(payloadParaBackend).subscribe({
      next: (usuarioCreado) => {
        this.gridApi.applyTransaction({ add: [usuarioCreado] });
        this.activeDialogRef?.close();
      },
      error: (err) => console.error('Error creando usuario', err)
    });

    this.activeDialogRef?.close();

  }

  confirmarEliminacion(device: Device) {
    this.selectedDevice = device;
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, {
      width: '400px'
    });
  }

  public getRowId = (params: GetRowIdParams) => {
    return params.data.id;
  };


  procederEliminacion() {
    const deviceToDelete = this.selectedDevice;
    if (!deviceToDelete) return;
    console.log('🗑️ DELETE: Eliminando ID:', deviceToDelete.id);
    this.deviceService.deleteDevice(deviceToDelete.id).subscribe({
      next: () => {
        this.gridApi.applyTransaction({ remove: [deviceToDelete] });
        this.activeDialogRef?.close();
        this.selectedDevice = null;
      },
      error: (err) => console.error('Error eliminando', err)
    });
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedDevice = null;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadElements();
  }
}
