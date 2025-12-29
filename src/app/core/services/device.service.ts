import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, of, map } from 'rxjs';

import { Device } from '../models/Device';
import { Pagination } from '../models/Pagination';
import { DeviceFilter } from '../models/device-filter.model';
import { APP_SETTINGS } from '../config/app.settings';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private settings = inject(APP_SETTINGS);
  private http = inject(HttpClient);
  private notifier = inject(NotificationService);

  private devicesUrl = `${this.settings.apiUrl}/devices`;

  private devicesState = new BehaviorSubject<Pagination<Device> | null>(null);

  public state$ = this.devicesState.asObservable();

  public devices$ = this.devicesState.pipe(
    map(pagination => pagination?.content || [])
  );

  public totalDevices$ = this.devicesState.pipe(
    map(pagination => pagination?.totalElements || 0)
  );

  public totalPages$ = this.devicesState.pipe(
    map(pagination => pagination?.totalPages || 0)
  );

  getDevices(filter: DeviceFilter = {}, page: number = 0, size: number = 10): Observable<Pagination<Device>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'id,asc');

    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof DeviceFilter];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString()); // .toString() por seguridad
      }
    });

    return this.http.get<Pagination<Device>>(this.devicesUrl, { params }).pipe(
      tap(response => {
        this.devicesState.next(response);
      }),
    );
  }

  getDevice(id: string, forceRefresh: boolean = false): Observable<Device> {
    if (!forceRefresh) {
      const cachedDevice = this.devicesState.getValue()?.content?.find(d => d.id === id);
      if (cachedDevice) {
        return of(cachedDevice);
      }
    }
    return this.http.get<Device>(`${this.devicesUrl}/${id}`);
  }

  addDevice(newDevice: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(this.devicesUrl, newDevice).pipe(
      tap(() => {
        // NOTA: En paginación, usualmente NO agregamos manualmente al state local
        // porque no sabemos si el nuevo item va en la página 1 o la 10.
        // Lo ideal es que el componente llame a getDevices() tras el éxito.
        this.notifier.success("Equipo creado exitosamente!");
      })
    );
  }

  updateDevice(id: string, deviceData: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${this.devicesUrl}/${id}`, deviceData).pipe(
      tap(updatedDevice => {
        const currentState = this.devicesState.getValue();
        if (!currentState) return; // Seguridad
        const updatedList = currentState.content.map(d =>
          d.id === id ? updatedDevice : d
        );
        this.devicesState.next({
          ...currentState,
          content: updatedList
        });
      }),
      tap(() => {
        this.notifier.success("Equipo actualizado exitosamente!");
      })
    );
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.devicesUrl}/${id}`).pipe(
      tap(() => {
        const currentState = this.devicesState.getValue();
        if (!currentState) return;
        const filteredList = currentState.content.filter(d => d.id !== id);
        this.devicesState.next({
          ...currentState,
          content: filteredList,
          totalElements: currentState.totalElements - 1
        });
      }),
      tap(() => {
        this.notifier.success("Equipo eliminado exitosamente!");
      })
    );
  }
}
