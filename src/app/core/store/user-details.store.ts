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

  private profileSubject = new BehaviorSubject<Profile>(this.loadProfileFromStorage());

  getProfile() {
    this.http.get<Profile>('/api/profile').subscribe({
      next: (response) => {
        this.setProfile(response);
      },
      error: (err) => console.error('Error fetching profile', err)
    });
  }

  setProfile(newProfile: Partial<Profile>) {
    const current = this.profileSubject.value;
    const updated = { ...current, ...newProfile };
    this.profileSubject.next(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  reset() {
    this.setProfile(DEFAULT_PROFILE);
  }

  private loadProfileFromStorage(): Profile {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_PROFILE };
  }

  get profileSnapshot(): Profile {
    return this.profileSubject.value;
  }
}
