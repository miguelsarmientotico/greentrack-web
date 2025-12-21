import { HttpClient, HttpParams, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Device, DeviceStatusEnum } from '../models/Device';
import { Observable, map, of, tap, catchError, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';
import { Pagination } from '../models/Pagination';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private devicesUrl = inject(APP_SETTINGS).apiUrl + '/devices';
  private devices: Device[] = [];

  constructor(private http: HttpClient) { }

  getDevices(page?: number, limit?: number): Observable<Pagination<Device>> {
    const options = new HttpParams()
    .set('page', page || 1)
    .set('limit', limit || 10);
    return this.http.get<Pagination<Device>>(this.devicesUrl, {
      params: options
    }).pipe(
        catchError(this.handleError)
      );
  }

  getDevice(id: string): Observable<Device> {
    const device = this.devices.find(p => p.id === id);
    return of(device!);
  }

  addDevice(newDevice: Partial<Device>): Observable<Device> {
    console.log("new device: ", newDevice);
    return this.http.post<Device>(this.devicesUrl, newDevice).pipe(
      map(device => {
        this.devices.push(device);
        return device;
      })
    );
  }

  updateDevice(id: string, deviceData: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${this.devicesUrl}/${id}`, {
      ...deviceData
    }).pipe(
      map(device => {
        const index = this.devices.findIndex(p => p.id === id);
        this.devices[index] = {
            ...this.devices[index],
            ...deviceData
        }
        return device;
      })
    );
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.devicesUrl}/${id}`).pipe(
      tap(() => {
        const index = this.devices.findIndex(p => p.id === id);
        this.devices.splice(index, 1);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let message = '';

    switch(error.status) {
      case 0:
        message = 'Client error';
        break;
      case HttpStatusCode.InternalServerError:
        message = 'Server error';
        break;
      case HttpStatusCode.BadRequest:
        message = 'Request error';
        break;
      default:
        message = 'Unknown error';
    }

    console.error(message, error.error);

    return throwError(() => error);
  }

}
