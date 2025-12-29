import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { DeviceService } from '../../services/device.service';
import { Device, DeviceStatusEnum, DeviceTypeEnum } from '../../models/Device';
import { DeviceFilter } from '../../models/device-filter.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-device-table',
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
export class DeviceTableComponent implements OnInit, OnDestroy {

  // ==========================================================
  // 1. VIEW CHILDREN & DIALOGS
  // ==========================================================
  @ViewChild('createDeviceDialog') createDeviceDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;

  private activeDialogRef?: MatDialogRef<any>;

  // ==========================================================
  // 2. DEPENDENCIES
  // ==========================================================
  private readonly deviceService = inject(DeviceService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  // ==========================================================
  // 3. AG GRID CONFIGURATION
  // ==========================================================
  private gridApi!: GridApi<Device>;

  public defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  // Callback para optimizar el renderizado de filas por ID
  public getRowId = (params: GetRowIdParams) => params.data.id;

  public colDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'name', headerName: 'Nombre', editable: true, flex: 1 },
    {
      field: 'type',
      headerName: 'Tipo',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: Object.values(DeviceTypeEnum) },
      width: 140
    },
    { field: 'brand', headerName: 'Marca', editable: true, flex: 1.5 },
    {
      field: 'status',
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
      pinned: 'right',
      filter: false,
      sortable: false,
      cellRendererParams: {
        // Usamos arrow function para mantener el contexto 'this'
        onDeleteClicked: (device: Device) => this.confirmarEliminacion(device),
      }
    }
  ];

  // ==========================================================
  // 4. COMPONENT STATE (Reactive)
  // ==========================================================
  // Datos directos del Store del servicio
  public rowData$ = this.deviceService.devices$;
  public totalDevices$ = this.deviceService.totalDevices$; // Necesario para el paginador
  public totalPages$ = this.deviceService.totalPages$; // Necesario para el paginador

  public filter: DeviceFilter = { globalSearch: '' };
  public pageSize = 10;
  public currentPage = 1; // 1-based para lógica visual, 0-based para API

  // ==========================================================
  // 5. FORM STATE
  // ==========================================================
  public deviceForm!: FormGroup;
  public filterForm!: FormGroup;
  public selectedDevice: Device | null = null;
  public readonly deviceTypeList = Object.values(DeviceTypeEnum);
  public readonly deviceStatusList = Object.values(DeviceStatusEnum);


  // ==========================================================
  // 6. LIFECYCLE HOOKS
  // ==========================================================
  ngOnInit(): void {
    this.initForm();
    this.initFilterForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    // Si tienes suscripciones manuales extras, agrégalas aquí.
    // rowData$ y totalDevices$ se limpian solos gracias al AsyncPipe en HTML.
  }

  // ==========================================================
  // 7. GRID EVENTS (Grid Ready, Page Change, Edit)
  // ==========================================================

  onGridReady(params: GridReadyEvent<Device>) {
    this.gridApi = params.api;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    const id = event.data.id;
    const campoEditado = event.colDef.field;
    const nuevoValor = event.newValue;

    // Validación básica para no enviar basura
    if (!campoEditado || event.oldValue === nuevoValor) return;

    const cambios: Partial<Device> = {
      [campoEditado]: nuevoValor
    };

    this.deviceService.updateDevice(id, cambios).subscribe({
        error: () => {
             // Opcional: Revertir cambio en celda si falla API
             // this.gridApi.undoCellEditing();
        }
    });
  }

  // ==========================================================
  // 8. DIALOG ACTIONS (Open, Save, Delete, Close)
  // ==========================================================

  abrirModalCreacion() {
    this.deviceForm.reset({
        deviceType: DeviceTypeEnum.LAPTOP // Valor por defecto
    });
    this.activeDialogRef = this.dialog.open(this.createDeviceDialog, {
      width: '500px',
      disableClose: true
    });
  }

  guardarNuevoEquipo() {
    if (this.deviceForm.invalid) return;

    const formData = this.deviceForm.value;
    console.log('🚀 CREATE: Enviando al backend:', formData);

    this.deviceService.addDevice(formData).subscribe({
      next: () => {
        // NOTA: No usamos applyTransaction. Recargamos datos para ver
        // el nuevo ítem en la posición correcta según ordenamiento del backend.
        this.loadData();
        this.cerrarDialogo();
      },
      error: (err) => console.error('Error creando equipo', err)
    });
  }

  confirmarEliminacion(device: Device) {
    this.selectedDevice = device;
    this.activeDialogRef = this.dialog.open(this.deleteConfirmDialog, {
      width: '400px'
    });
  }

  procederEliminacion() {
    const deviceToDelete = this.selectedDevice;
    if (!deviceToDelete) return;

    console.log('🗑️ DELETE: Eliminando ID:', deviceToDelete.id);

    this.deviceService.deleteDevice(deviceToDelete.id).subscribe({
      next: () => {
        // El servicio ya actualizó el State local, el Grid se refresca solo.
        this.cerrarDialogo();
      },
      error: (err) => console.error('Error eliminando', err)
    });
  }

  cerrarDialogo() {
    this.activeDialogRef?.close();
    this.selectedDevice = null;
  }

  // ==========================================================
  // 9. PRIVATE HELPERS
  // ==========================================================

  private initForm(): void {
    this.deviceForm = this.fb.group({
      name: ['', Validators.required],
      type: [DeviceTypeEnum.LAPTOP, Validators.required],
      brand: ['', Validators.required],
    });
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      globalSearch: [''],
      name: [''],
      brand: [''],
      type: [null],
      status: [null]
    });

    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(values => {
      this.filter = {
        ...values,
        type: values.type || undefined,
        status: values.status || undefined
      };

      this.currentPage = 1; // IMPORTANTE: Volver a página 1 al filtrar
      this.loadData();
    });
  }

  public clearFilters(): void {
    this.filterForm.reset();
  }

  private loadData(): void {
    // API usa paginación base 0, Angular Material base 0, pero visualmente...
    // Mantenemos consistencia: PageIndex viene del Paginator (0-based)
    this.deviceService.getDevices(this.filter, this.currentPage - 1, this.pageSize)
        .subscribe(); // La respuesta actualiza el BehaviorSubject en el servicio
  }
}
