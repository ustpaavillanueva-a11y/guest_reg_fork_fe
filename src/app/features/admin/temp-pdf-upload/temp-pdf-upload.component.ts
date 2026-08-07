import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TempUploadService, TempUploadResult } from '../../../core/services/temp-upload.service';

@Component({
  selector: 'app-temp-pdf-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="upload-container">
      <div class="upload-header">
        <h1>📄 Upload Guest Registration PDF</h1>
        <p>Uploaded files are stored temporarily and auto-delete after 1 hour</p>
      </div>

      <mat-card class="upload-card">
        <mat-card-content>
          <div
            class="upload-zone"
            [class.drag-over]="isDragging()"
            (drop)="onFileDrop($event)"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
          >
            <div class="upload-icon">
              <mat-icon>cloud_upload</mat-icon>
            </div>
            <h3>Drag & Drop PDF Here</h3>
            <p>or click to browse</p>

            <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" hidden />
            <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="isUploading()">
              @if (isUploading()) {
                <mat-spinner diameter="24" />
              } @else {
                <ng-container>
                  <mat-icon>attach_file</mat-icon> Choose PDF
                </ng-container>
              }
            </button>
          </div>

          @if (isUploading()) {
            <div class="loading-state">
              <mat-spinner diameter="40" />
              <p>Uploading…</p>
            </div>
          }

          @if (lastResult(); as result) {
            <div class="result-banner">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>{{ lastFileName() }}</strong> uploaded successfully.
                <p class="hint">{{ result.message ?? 'This file will be automatically deleted in 1 hour.' }}</p>
                @if (result.url ?? result.fileUrl; as url) {
                  <a [href]="url" target="_blank" rel="noopener">View uploaded file</a>
                }
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .upload-container {
      max-width: 640px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    .upload-header {
      text-align: center;
      margin-bottom: 24px;

      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0; color: #666; }
    }
    .upload-card { padding: 8px; }
    .upload-zone {
      border: 3px dashed #C41E3A;
      border-radius: 12px;
      padding: 56px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &.drag-over {
        background-color: #fff3e0;
        border-color: #f57c00;
      }

      .upload-icon {
        font-size: 56px;
        color: #C41E3A;
        margin-bottom: 12px;

        mat-icon { font-size: 56px; width: 56px; height: 56px; }
      }

      h3 { margin: 0 0 4px; }
      p { margin: 0 0 20px; color: #666; }
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px 0 8px;
      color: #666;
    }
    .result-banner {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      background: #e8f5e9;
      color: #1b5e20;

      mat-icon { color: #2e7d32; }
      .hint { margin: 4px 0 0; font-size: 13px; color: #33691e; }
      a { display: inline-block; margin-top: 8px; }
    }
  `,
})
export class TempPdfUploadComponent {
  isDragging = signal(false);
  isUploading = signal(false);
  lastResult = signal<TempUploadResult | null>(null);
  lastFileName = signal('');

  constructor(private tempUploadService: TempUploadService, private snackBar: MatSnackBar) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
    input.value = '';
  }

  private uploadFile(file: File): void {
    if (!file.type.includes('pdf')) {
      this.snackBar.open('Please upload a PDF file', 'Close', { duration: 3000 });
      return;
    }

    this.isUploading.set(true);
    this.lastResult.set(null);

    this.tempUploadService.upload(file).subscribe({
      next: (result) => {
        this.isUploading.set(false);
        this.lastFileName.set(file.name);
        this.lastResult.set(result ?? {});
        this.snackBar.open('PDF uploaded successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isUploading.set(false);
        this.snackBar.open(err.error?.message ?? 'Upload failed', 'Close', { duration: 3000 });
      },
    });
  }
}
