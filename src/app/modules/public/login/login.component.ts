import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // <--- Importante
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // <--- Feedback
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    RouterModule
  ]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router); // <--- Inyectar Router
  private snackBar = inject(MatSnackBar); // <--- Inyectar SnackBar

  hidePassword = signal(true);
  isLoading = signal(false); // <--- Para controlar el estado de carga

  loginForm = this.fb.group({
    username: ['', [Validators.required]], // Puedes agregar Validators.email si aplica
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  togglePassword(event: MouseEvent) {
    this.hidePassword.update(value => !value);
    event.stopPropagation();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true); // Activar spinner o deshabilitar botón
    const { username, password } = this.loginForm.getRawValue();

    // SUSCRIPCIÓN AL OBSERVABLE (Crucial)
    this.authService.login(username ?? '', password ?? '').subscribe({
      next: () => {
        // 1. Login exitoso
        this.isLoading.set(false);
        // 2. Redirección al Dashboard
        this.router.navigate(['/u']);
      },
      error: (err) => {
        // 3. Manejo de error
        this.isLoading.set(false);
        console.error('Login fallido', err);

        this.snackBar.open('Credenciales incorrectas o error en servidor', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar'] // Puedes estilizar esto en global.scss
        });
      }
    });
  }
}
