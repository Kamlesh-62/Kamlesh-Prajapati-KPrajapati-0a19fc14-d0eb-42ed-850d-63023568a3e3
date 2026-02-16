import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { OrganizationsService } from '../../services/organizations.service';
import { Organization } from '../../models/organization.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly organizationsService = inject(OrganizationsService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orgs = signal<Organization[]>([]);
  readonly orgsLoading = signal(true);
  readonly orgsError = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    organizationId: ['', [Validators.required]],
  });

  constructor(
    private readonly auth: AuthService,
    public readonly theme: ThemeService
  ) {}

  ngOnInit() {
    this.loadOrganizations();
  }

  private loadOrganizations() {
    this.orgsLoading.set(true);
    this.orgsError.set(null);
    const preferredId = this.route.snapshot.queryParamMap.get('orgId');

    this.organizationsService.list().subscribe({
      next: (orgs) => {
        this.orgs.set(orgs);
        this.orgsLoading.set(false);
        const selectedId = preferredId && orgs.some((org) => org.id === preferredId)
          ? preferredId
          : orgs[0]?.id ?? '';
        if (selectedId) {
          this.form.patchValue({ organizationId: selectedId });
        }
      },
      error: () => {
        this.orgsError.set('Unable to load organizations');
        this.orgsLoading.set(false);
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { name, email, password, organizationId } = this.form.value;
    if (!name || !email || !password || !organizationId) return;
    this.auth.register({ name, email, password, organizationId }).subscribe({
      next: (response) => {
        this.auth.handleLoginSuccess(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Registration failed');
        this.loading.set(false);
      },
    });
  }
}
