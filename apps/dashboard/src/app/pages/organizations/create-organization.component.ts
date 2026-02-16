import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { OrganizationsService } from '../../services/organizations.service';
import { Organization } from '../../models/organization.models';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-organization.component.html',
})
export class CreateOrganizationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizations = inject(OrganizationsService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orgs = signal<Organization[]>([]);
  readonly orgsLoading = signal(true);
  readonly orgsError = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentId: [''],
  });

  constructor(public readonly theme: ThemeService) {}

  ngOnInit() {
    this.loadOrganizations();
  }

  private loadOrganizations() {
    this.orgsLoading.set(true);
    this.orgsError.set(null);
    this.organizations.list().subscribe({
      next: (orgs) => {
        this.orgs.set(orgs);
        this.orgsLoading.set(false);
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
    const { name, parentId } = this.form.value;
    if (!name) return;

    this.organizations
      .create({ name, parentId: parentId ? parentId : null })
      .subscribe({
      next: (org) => {
        this.loading.set(false);
        this.router.navigate(['/register'], { queryParams: { orgId: org.id } });
      },
      error: () => {
        this.error.set('Organization creation failed');
        this.loading.set(false);
      },
    });
  }
}
