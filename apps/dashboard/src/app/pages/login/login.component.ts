import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly auth: AuthService,
    public readonly theme: ThemeService
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.value;
    if (!email || !password) return;
    this.auth.login(email, password).subscribe({
      next: (response) => {
        this.auth.handleLoginSuccess(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}
