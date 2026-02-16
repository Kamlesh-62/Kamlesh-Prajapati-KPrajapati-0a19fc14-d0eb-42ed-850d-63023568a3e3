import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuditLogService } from '../../services/audit-log.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent {
  readonly logs = computed(() => this.auditService.logs());
  readonly loading = computed(() => this.auditService.loading());
  readonly user = computed(() => this.auth.user());

  constructor(
    private readonly auditService: AuditLogService,
    private readonly auth: AuthService,
    public readonly theme: ThemeService
  ) {
    this.auditService.loadLogs();
  }

  logout() {
    this.auth.logout();
  }
}
