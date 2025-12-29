import { InjectionToken } from '@angular/core';

export interface AppSettings {
  title: string;
  version: string;
  apiUrl: string;
}

export const appSettings: AppSettings = {
  title: import.meta.env.NG_APP_TITLE,
  version: import.meta.env.NG_APP_VERSION,
  apiUrl: import.meta.env.NG_APP_API_URL
};

export const APP_SETTINGS = new InjectionToken<AppSettings>('app.settings', {
  providedIn: 'root',
  factory: () => appSettings
});
