import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { UserListResponse } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  list(params?: { page?: number; limit?: number; search?: string; orgId?: string }) {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.orgId) httpParams = httpParams.set('orgId', params.orgId);
    return this.http.get<UserListResponse>(`${API_BASE_URL}/users`, { params: httpParams });
  }
}
