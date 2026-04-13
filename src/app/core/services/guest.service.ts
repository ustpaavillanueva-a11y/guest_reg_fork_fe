import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Guest,
  CreateGuestRequest,
  GuestStatistics,
  StatisticsPeriod,
} from '../models';

@Injectable({ providedIn: 'root' })
export class GuestService {
  constructor(private api: ApiService) {}

  register(data: CreateGuestRequest): Observable<Guest> {
    return this.api.post<Guest>('/guests', data);
  }

  getAll(): Observable<Guest[]> {
    return this.api.get<Guest[]>('/guests');
  }

  getById(id: string): Observable<Guest> {
    return this.api.get<Guest>(`/guests/${id}`);
  }

  update(id: string, data: Partial<Guest>): Observable<Guest> {
    return this.api.patch<Guest>(`/guests/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/guests/${id}`);
  }

  getStatistics(period: StatisticsPeriod): Observable<GuestStatistics> {
    return this.api.get<GuestStatistics>('/guests/statistics', { period });
  }

  getByPeriod(period: StatisticsPeriod): Observable<Guest[]> {
    return this.api.get<Guest[]>('/guests/period', { period });
  }

  uploadPdf(guestId: string, pdfFile: File): Observable<{ message: string; pdfUrl: string }> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    return this.api.post<{ message: string; pdfUrl: string }>(`/guests/${guestId}/upload-pdf`, formData);
  }

  getMonthlyComparison(): Observable<{ months: string[]; thisYear: number[]; lastYear: number[] }> {
    return this.api.get<{ months: string[]; thisYear: number[]; lastYear: number[] }>('/guests/monthly-comparison');
  }
}
