import { InjectionToken } from '@angular/core';

export interface AppSettings {
  title: string;
  version: string;
  apiUrl: string;
}

export const appSettings: AppSettings = {
  title: import.meta.env.NG_APP_TITLE || 'GreenTrack',
  version: import.meta.env.NG_APP_VERSION || '1.0',
  apiUrl: import.meta.env.NG_APP_API_URL || 'http://localhost:8080/api/v1'
};

export const APP_SETTINGS = new InjectionToken<AppSettings>('app.settings', {
  providedIn: 'root',
  factory: () => appSettings
});
