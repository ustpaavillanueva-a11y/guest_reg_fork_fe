import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface TempUploadResult {
  id?: string;
  fileName?: string;
  message?: string;
  url?: string;
  fileUrl?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class TempUploadService {
  constructor(private api: ApiService, private http: HttpClient) {}

  upload(pdfFile: File): Observable<TempUploadResult> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    return this.api.post<TempUploadResult>('/temp-uploads', formData);
  }

  list(): Observable<TempUploadResult[]> {
    return this.api.get<TempUploadResult[]>('/temp-uploads');
  }

  fetchAsFile(fileUrl: string, fileName: string): Observable<File> {
    return this.http
      .get(fileUrl, { responseType: 'blob' })
      .pipe(map((blob) => new File([blob], fileName, { type: 'application/pdf' })));
  }
}
