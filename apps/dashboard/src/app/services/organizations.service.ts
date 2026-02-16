import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { CreateOrganizationRequest, Organization } from '../models/organization.models';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Organization[]>(`${API_BASE_URL}/organizations`);
  }

  create(payload: CreateOrganizationRequest) {
    return this.http.post<Organization>(`${API_BASE_URL}/organizations`, payload);
  }
}
