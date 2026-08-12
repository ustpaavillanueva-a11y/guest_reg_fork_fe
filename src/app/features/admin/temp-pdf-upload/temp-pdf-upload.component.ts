import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { TempUploadService, TempUploadResult } from '../../../core/services/temp-upload.service';

@Component({
  selector: 'app-temp-pdf-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="upload-container">
      <div class="upload-header">
        <h1>📄 Upload Guest Registration PDF</h1>
        <p>Uploaded files are stored temporarily and auto-delete after 23 hours</p>
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
            <p>or click to browse (multiple files allowed)</p>

            <input #fileInput type="file" accept=".pdf" multiple (change)="onFileSelected($event)" hidden />
            <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="isUploading()">
              @if (isUploading()) {
                <mat-spinner diameter="24" />
              } @else {
                <ng-container>
                  <mat-icon>attach_file</mat-icon> Choose PDFs
                </ng-container>
              }
            </button>
          </div>

          @if (uploadProgress(); as progress) {
            <div class="loading-state">
              <mat-spinner diameter="40" />
              <p>Uploading {{ progress.current }} of {{ progress.total }}…</p>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <mat-card class="list-card">
        <mat-card-header>
          <mat-card-title>Uploaded PDFs</mat-card-title>
          <button mat-icon-button (click)="loadUploads()" [disabled]="isLoadingList()" title="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (isLoadingList()) {
            <div class="loading-state">
              <mat-spinner diameter="32" />
            </div>
          } @else if (uploads().length === 0) {
            <p class="empty-hint">No files uploaded yet.</p>
          } @else {
            <table mat-table [dataSource]="uploads()" class="full-width">
              <ng-container matColumnDef="fileName">
                <th mat-header-cell *matHeaderCellDef>File</th>
                <td mat-cell *matCellDef="let item">{{ item.fileName ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Uploaded</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.createdAt ? (item.createdAt | date: 'short') : '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="expiresAt">
                <th mat-header-cell *matHeaderCellDef>Time Left</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.expiresAt) {
                    <span [class.expired-label]="timeLeft(item.expiresAt) === 'Expired'">
                      {{ timeLeft(item.expiresAt) }}
                    </span>
                  } @else {
                    —
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.url ?? item.fileUrl; as url) {
                    <a mat-icon-button [href]="url" target="_blank" rel="noopener" title="View">
                      <mat-icon>visibility</mat-icon>
                    </a>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .upload-container {
      max-width: 720px;
      margin: 0 auto;
      padding: 24px 16px 48px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .upload-header {
      text-align: center;

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
    .list-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .empty-hint {
      color: #666;
      text-align: center;
      padding: 24px 0;
    }
    .full-width { width: 100%; }
    .expired-label {
      color: #c62828;
      font-weight: 600;
    }
  `,
})
export class TempPdfUploadComponent implements OnInit, OnDestroy {
  isDragging = signal(false);
  isUploading = signal(false);
  isLoadingList = signal(false);
  uploadProgress = signal<{ current: number; total: number } | null>(null);
  uploads = signal<TempUploadResult[]>([]);
  displayedColumns = ['fileName', 'createdAt', 'expiresAt', 'actions'];

  private now = signal(Date.now());
  private clockIntervalId?: ReturnType<typeof setInterval>;

  constructor(private tempUploadService: TempUploadService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadUploads();
    // Ticks the "Time Left" countdown; also catches newly-expired rows so
    // they flip to "Expired" without the user needing to hit refresh.
    this.clockIntervalId = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  timeLeft(expiresAt: string): string {
    const remainingMs = new Date(expiresAt).getTime() - this.now();
    if (remainingMs <= 0) return 'Expired';

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Under an hour left: precise MM:SS countdown, since urgency is higher.
    // Otherwise a coarser "Hh MMm" reads better than a five-digit clock.
    if (hours === 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  loadUploads(): void {
    this.isLoadingList.set(true);
    this.tempUploadService.list().subscribe({
      next: (uploads) => {
        this.isLoadingList.set(false);
        this.uploads.set(uploads ?? []);
      },
      error: () => {
        this.isLoadingList.set(false);
        this.snackBar.open('Failed to load uploaded files', 'Close', { duration: 3000 });
      },
    });
  }

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
      this.uploadFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
    }
    input.value = '';
  }

  private async uploadFiles(files: File[]): Promise<void> {
    const pdfFiles = files.filter((f) => f.type.includes('pdf'));
    const skipped = files.length - pdfFiles.length;
    if (skipped > 0) {
      this.snackBar.open(
        skipped === files.length ? 'Please upload PDF files' : `Skipped ${skipped} non-PDF file(s)`,
        'Close',
        { duration: 3000 },
      );
    }
    if (pdfFiles.length === 0) return;

    this.isUploading.set(true);
    let succeeded = 0;
    let failed = 0;

    // Uploaded one at a time rather than in parallel, so a burst of files
    // doesn't hammer the free-tier backend instance all at once.
    for (let i = 0; i < pdfFiles.length; i++) {
      this.uploadProgress.set({ current: i + 1, total: pdfFiles.length });
      try {
        await firstValueFrom(this.tempUploadService.upload(pdfFiles[i]));
        succeeded++;
      } catch {
        failed++;
      }
    }

    this.isUploading.set(false);
    this.uploadProgress.set(null);

    if (failed === 0) {
      this.snackBar.open(
        succeeded === 1 ? 'PDF uploaded successfully' : `${succeeded} PDFs uploaded successfully`,
        'Close',
        { duration: 3000 },
      );
    } else {
      this.snackBar.open(`${succeeded} uploaded, ${failed} failed`, 'Close', { duration: 4000 });
    }

    this.loadUploads();
  }
}
