import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TempUploadResult {
  message?: string;
  url?: string;
  fileUrl?: string;
  id?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class TempUploadService {
  constructor(private api: ApiService) {}

  upload(pdfFile: File): Observable<TempUploadResult> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    return this.api.post<TempUploadResult>('/temp-uploads', formData);
  }
}
