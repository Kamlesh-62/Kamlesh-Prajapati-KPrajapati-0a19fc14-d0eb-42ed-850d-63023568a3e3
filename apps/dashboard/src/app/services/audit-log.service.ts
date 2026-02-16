import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { AuditLogEntry } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly logsSignal = signal<AuditLogEntry[]>([]);
  private readonly loadingSignal = signal(false);

  readonly logs = computed(() => this.logsSignal());
  readonly loading = computed(() => this.loadingSignal());

  constructor(private readonly http: HttpClient) {}

  loadLogs() {
    this.loadingSignal.set(true);
    this.http.get<AuditLogEntry[]>(`${API_BASE_URL}/audit-log`).subscribe({
      next: (logs) => {
        this.logsSignal.set(logs);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
      },
    });
  }
}
