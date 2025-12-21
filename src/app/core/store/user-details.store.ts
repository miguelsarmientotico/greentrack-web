import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Profile,DEFAULT_PROFILE, } from '../models/account.types';

@Injectable({
  providedIn: 'root'
})
export class UserDetailsStore {

  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'account_profile';

  // 1. STATE (Equivalente a const profile = reactive(...))
  // Inicializamos leyendo de localStorage si existe (Persist logic)
  private profileSubject = new BehaviorSubject<Profile>(this.loadProfileFromStorage());

  // 3. ACTIONS

  /**
   * getProfile: Equivalente a tu fetch.
   * En Angular no necesitamos 'nextTick', el AsyncPipe o Zone.js
   * actualizan la vista automáticamente al emitir el nuevo valor.
   */
  getProfile() {
    this.http.get<Profile>('/api/profile').subscribe({
      next: (response) => {
        // Asumiendo que la API devuelve el objeto directo.
        // Si viene envuelto en { data: ... }, ajusta aquí.
        this.setProfile(response);
      },
      error: (err) => console.error('Error fetching profile', err)
    });
  }

  /**
   * setProfile: Actualiza el estado y guarda en LocalStorage
   * Equivalente a: Object.assign(profile, ...)
   */
  setProfile(newProfile: Partial<Profile>) {
    // 1. Obtener valor actual
    const current = this.profileSubject.value;

    // 2. Mezclar (Spread operator es el equivalente moderno a Object.assign)
    const updated = { ...current, ...newProfile };

    // 3. Emitir nuevo estado
    this.profileSubject.next(updated);

    // 4. PERSISTENCIA (Manual)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  reset() {
    // Volvemos a los valores por defecto
    this.setProfile(DEFAULT_PROFILE);
    // O si quieres borrar del storage al resetear:
    // localStorage.removeItem(this.STORAGE_KEY);
  }

  // --- Helpers Privados ---

  private loadProfileFromStorage(): Profile {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_PROFILE };
  }

  // Helper síncrono por si necesitas el valor sin suscribirte (snapshot)
  get profileSnapshot(): Profile {
    return this.profileSubject.value;
  }
}
