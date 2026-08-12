import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { PdfExtractorService, ExtractedGuestData } from '../../../core/services/pdf-extractor.service';
import { HotelSettingsService } from '../../../core/services/hotel-settings.service';
import { TempUploadService, TempUploadResult } from '../../../core/services/temp-upload.service';
import { PolicyTemplate } from '../../../core/models';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatListModule,
    MatTableModule,
  ],
  template: `
    <div class="pdf-upload-container">
      <!-- Header -->
      <div class="upload-header">
        <h1>📄 Register Guest with PDF</h1>
        <p>Upload a check-in form to auto-fill guest information</p>
      </div>

      <!-- Main Content -->
      <div class="content-wrapper">
        <!-- Step 1: Upload -->
        @if (!extractedData()) {
          <mat-card class="upload-card">
            <mat-card-content>
              <div class="upload-zone" (drop)="onFileDrop($event)" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)"
                [class.drag-over]="isDragging()">
                <div class="upload-icon">
                  <mat-icon>cloud_upload</mat-icon>
                </div>
                <h3>Drag & Drop PDF Here</h3>
                <p>or click to browse</p>
                
                <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" hidden />
                <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="isLoading()">
                  @if (isLoading()) {
                    <ng-container>
                      <mat-spinner diameter="24" />
                    </ng-container>
                  } @else {
                    <ng-container>
                      <mat-icon>attach_file</mat-icon> Choose PDF
                    </ng-container>
                  }
                </button>
              </div>

              @if (isLoading()) {
                <div class="loading-state">
                  <mat-spinner diameter="48" />
                  <p>Extracting data from PDF...</p>
                </div>
              }

              <div class="manual-entry-divider">
                <span>No printed reservation?</span>
                <button mat-button (click)="startManualEntry()" [disabled]="isLoading()">
                  <mat-icon>edit_note</mat-icon> Enter Guest Details Manually
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Choose from already-uploaded PDFs -->
          <mat-card class="temp-uploads-card">
            <mat-card-header>
              <mat-card-title>Or Choose from Uploaded PDFs</mat-card-title>
              <button mat-icon-button (click)="loadTempUploads()" [disabled]="isLoadingTempUploads()" title="Refresh">
                <mat-icon>refresh</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              @if (isLoadingTempUploads()) {
                <div class="loading-state">
                  <mat-spinner diameter="32" />
                </div>
              } @else if (tempUploads().length === 0) {
                <p class="empty-hint">No uploaded PDFs available.</p>
              } @else {
                <table mat-table [dataSource]="tempUploads()" class="full-width">
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

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let item">
                      <button
                        mat-stroked-button
                        color="primary"
                        (click)="useUploadedPdf(item)"
                        [disabled]="isLoading() || fetchingUploadId() === item.id"
                      >
                        @if (fetchingUploadId() === item.id) {
                          <mat-spinner diameter="18" />
                        } @else {
                          <ng-container>Use this PDF</ng-container>
                        }
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="tempUploadColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: tempUploadColumns"></tr>
                </table>
              }
            </mat-card-content>
          </mat-card>
        }

        <!-- Step 2: Review & Edit -->
        @if (extractedData() && !isConfirmed()) {
          <mat-card class="review-card">
            <mat-card-header>
              @if (isManualEntry()) {
                <ng-container>
                  <mat-card-title>Enter Guest Details</mat-card-title>
                  <p class="subtitle">Fill in the guest and reservation information below</p>
                </ng-container>
              } @else {
                <ng-container>
                  <mat-card-title>Review Extracted Data</mat-card-title>
                  <p class="subtitle">Check and correct extracted information below</p>
                </ng-container>
              }
            </mat-card-header>

            <mat-card-content>
              <!-- Error Messages -->
              @if (extractedData()?.errors && extractedData()!.errors!.length > 0) {
                <div class="error-section">
                  <mat-icon class="error-icon">warning</mat-icon>
                  <div>
                    <h4>⚠️ Extraction Issues</h4>
                    <mat-list>
                      @for (error of extractedData()!.errors!; track error) {
                        <mat-list-item>{{ error }}</mat-list-item>
                      }
                    </mat-list>
                    <p class="error-hint">Please review and correct the fields below</p>
                  </div>
                </div>
              }

              <!-- Edit Form -->
              <form [formGroup]="editForm" class="edit-form">
                <div class="section-title">
                  <mat-icon>person</mat-icon>
                  <h3>Personal Information</h3>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width-field">
                    <mat-label>Full Name *</mat-label>
                    <input matInput formControlName="fullName" />
                    @if (editForm.get('fullName')?.hasError('required') && editForm.get('fullName')?.touched) {
                      <mat-error>Required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phoneNumber" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email" />
                  </mat-form-field>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Country</mat-label>
                    <input matInput formControlName="country" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Vehicle Plate No</mat-label>
                    <input matInput formControlName="vehiclePlateNo" />
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <div class="section-title">
                  <mat-icon>hotel</mat-icon>
                  <h3>Reservation Details</h3>
                </div>

                <div class="form-row three-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Reservation Number *</mat-label>
                    <input matInput formControlName="reservationNumber" />
                    @if (editForm.get('reservationNumber')?.hasError('required') && editForm.get('reservationNumber')?.touched) {
                      <mat-error>Required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Room Number *</mat-label>
                    <input matInput formControlName="roomNumber" />
                    @if (editForm.get('roomNumber')?.hasError('required') && editForm.get('roomNumber')?.touched) {
                      <mat-error>Required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Room Type</mat-label>
                    <input matInput formControlName="roomType" placeholder="e.g., JUNIOR EXECUTIVE (KING BED)" />
                  </mat-form-field>
                </div>

                <div class="form-row three-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Check-in Date *</mat-label>
                    <input matInput formControlName="checkInDate" type="date" />
                    @if (editForm.get('checkInDate')?.hasError('required') && editForm.get('checkInDate')?.touched) {
                      <mat-error>Required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Check-out Date</mat-label>
                    <input matInput formControlName="checkOutDate" type="date" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Check-in Time</mat-label>
                    <input matInput formControlName="checkInTime" type="time" />
                  </mat-form-field>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Check-out Time</mat-label>
                    <input matInput formControlName="checkOutTime" type="time" />
                  </mat-form-field>

                  <div class="checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="validIdPresented" />
                      Valid ID Presented
                    </label>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="section-title">
                  <mat-icon>gavel</mat-icon>
                  <h3>Policies Acknowledged</h3>
                </div>

                @if (policies().length > 0) {
                  @for (category of policyCategories(); track category.key) {
                    @if (category.items.length > 0) {
                      <div class="policy-category-block">
                        <div class="policy-category-title">
                          <mat-icon>{{ category.icon }}</mat-icon>
                          <span>{{ category.label }}</span>
                        </div>
                        <ul class="policy-items-list">
                          @for (policy of category.items; track policy.id) {
                            <li>{{ policy.content }}</li>
                          }
                        </ul>
                      </div>
                    }
                  }
                } @else {
                  <p class="policy-loading">Loading policies...</p>
                }
              </form>
            </mat-card-content>

            <!-- Action Buttons -->
            <mat-card-actions align="end">
              <button mat-button (click)="resetUpload()">
                <mat-icon>close</mat-icon> Cancel
              </button>
              <button mat-raised-button color="primary" (click)="confirmAndProceed()" [disabled]="editForm.invalid">
                <mat-icon>check</mat-icon> Confirm & Proceed to Signature
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .pdf-upload-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .upload-header {
      text-align: center;
      margin-bottom: 40px;

      h1 {
        color: #1a1a2e;
        margin-bottom: 8px;
      }

      p {
        color: #666;
      }
    }

    .upload-zone {
      border: 3px dashed #C41E3A;
      border-radius: 12px;
      padding: 60px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &.drag-over {
        background-color: #fff3e0;
        border-color: #f57c00;
      }

      .upload-icon {
        font-size: 64px;
        color: #C41E3A;
        margin-bottom: 16px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
        }
      }

      h3 {
        margin-bottom: 8px;
        color: #1a1a2e;
      }

      p {
        color: #666;
        margin-bottom: 16px;
      }
    }

    .temp-uploads-card {
      margin-top: 20px;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .empty-hint {
        color: #666;
        text-align: center;
        padding: 24px 0;
      }

      .full-width {
        width: 100%;
      }
    }

    .manual-entry-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;

      p {
        color: #666;
      }
    }

    .review-card {
      margin-top: 20px;

      mat-card-header {
        margin-bottom: 24px;

        mat-card-title {
          margin-bottom: 8px;
        }

        .subtitle {
          color: #666;
          margin: 0;
        }
      }
    }

    .error-section {
      display: flex;
      gap: 16px;
      padding: 16px;
      background-color: #ffebee;
      border-left: 4px solid #c41e3a;
      border-radius: 4px;
      margin-bottom: 24px;

      .error-icon {
        color: #c41e3a;
        font-size: 32px;
        margin-top: 4px;
      }

      h4 {
        margin-top: 0;
        color: #c41e3a;
      }

      mat-list {
        background: transparent;
        max-height: 150px;
        overflow-y: auto;
      }

      mat-list-item {
        font-size: 13px;
        height: auto;
        padding: 8px 0;
      }

      .error-hint {
        font-size: 12px;
        color: #666;
        margin-top: 8px;
        font-style: italic;
      }
    }

    .edit-form {
      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 24px 0 16px 0;
        padding-top: 16px;

        mat-icon {
          color: #C41E3A;
        }

        h3 {
          margin: 0;
          color: #1a1a2e;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 16px;

        &.two-col {
          grid-template-columns: repeat(2, 1fr);
        }

        &.three-col {
          grid-template-columns: repeat(3, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr !important;
        }
      }

      .full-width-field {
        width: 100%;
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        padding-top: 8px;

        label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;

          input[type="checkbox"] {
            cursor: pointer;
          }
        }
      }

      .no-companions {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 16px;
      }

      .policy-category-block {
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .policy-category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #C41E3A;
        font-weight: 600;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .policy-items-list {
        list-style-position: inside;
        margin: 0;
        padding-left: 16px;
        font-size: 13px;
        color: #333;

        li {
          margin-bottom: 6px;
          line-height: 1.4;
        }
      }

      .policy-loading {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 16px;
      }
    }

    mat-card-actions {
      padding: 16px;
      gap: 12px;
    }
  `,
})
export class PdfUploadComponent implements OnInit {
  extractedData = signal<ExtractedGuestData | null>(null);
  editForm!: FormGroup;
  isLoading = signal(false);
  isDragging = signal(false);
  isConfirmed = signal(false);
  isManualEntry = signal(false);
  policies = signal<PolicyTemplate[]>([]);
  tempUploads = signal<TempUploadResult[]>([]);
  isLoadingTempUploads = signal(false);
  fetchingUploadId = signal<string | null>(null);
  tempUploadColumns = ['fileName', 'createdAt', 'actions'];

  policyCategories = () => [
    { key: 'housekeeping', label: 'Housekeeping Policies', icon: 'cleaning_services', items: this.policies().filter(p => p.category === 'housekeeping') },
    { key: 'hotel', label: 'Hotel Policies', icon: 'hotel', items: this.policies().filter(p => p.category === 'hotel') },
    { key: 'data_privacy', label: 'Data Privacy Policy', icon: 'privacy_tip', items: this.policies().filter(p => p.category === 'data_privacy') },
  ];

  constructor(
    private pdfExtractor: PdfExtractorService,
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private hotelSettingsService: HotelSettingsService,
    private tempUploadService: TempUploadService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.hotelSettingsService.getActivePolicies().pipe(
      catchError(() => of([]))
    ).subscribe(policies => {
      this.policies.set(policies);
    });

    this.loadTempUploads();
  }

  loadTempUploads(): void {
    this.isLoadingTempUploads.set(true);
    this.tempUploadService.list().subscribe({
      next: (uploads) => {
        this.isLoadingTempUploads.set(false);
        this.tempUploads.set(uploads ?? []);
      },
      error: () => {
        this.isLoadingTempUploads.set(false);
        this.snackBar.open('Failed to load uploaded PDFs', 'Close', { duration: 3000 });
      },
    });
  }

  useUploadedPdf(item: TempUploadResult): void {
    const fileUrl = (item.url ?? item.fileUrl) as string | undefined;
    if (!fileUrl) {
      this.snackBar.open('This file is no longer available', 'Close', { duration: 3000 });
      return;
    }

    this.fetchingUploadId.set(item.id ?? null);
    this.tempUploadService.fetchAsFile(fileUrl, item.fileName ?? 'upload.pdf').subscribe({
      next: (file) => {
        this.fetchingUploadId.set(null);
        this.processFile(file);
      },
      error: () => {
        this.fetchingUploadId.set(null);
        this.snackBar.open('Failed to load the selected PDF', 'Close', { duration: 3000 });
      },
    });
  }

  private initializeForm(): void {
    this.editForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      phoneNumber: [''],
      email: [''],
      country: [''],
      vehiclePlateNo: [''],
      validIdPresented: [false],
      reservationNumber: ['', Validators.required],
      roomNumber: ['', Validators.required],
      roomType: [''],
      checkInDate: ['', Validators.required],
      checkOutDate: [''],
      checkInTime: ['14:00'],
      checkOutTime: ['11:00'],
      accompanyingGuests: [[]],
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
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private async processFile(file: File): Promise<void> {
    if (!file.type.includes('pdf')) {
      this.snackBar.open('Please upload a PDF file', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    try {
      const data = await this.pdfExtractor.extractGuestDataFromPdf(file);
      this.extractedData.set(data);
      this.populateForm(data);
      this.snackBar.open('✅ PDF processed successfully!', 'Close', { duration: 3000 });
      
      // User will manually click "Proceed to Registration" button
      // Removed auto-navigate to allow user to review extracted data first
    } catch (error) {
      console.error('File processing error:', error);
      this.snackBar.open('❌ Failed to process PDF', 'Close', { duration: 3000 });
    } finally {
      setTimeout(() => this.isLoading.set(false), 0);
    }
  }

  private populateForm(data: ExtractedGuestData): void {
    // Use room type name directly (supports multiple room types, comma-separated)
    this.editForm.patchValue({
      fullName: [data.firstName, data.middleName, data.lastName].filter(n => n).join(' ').trim(),
      phoneNumber: data.phoneNumber,
      email: data.email,
      country: data.country,
      vehiclePlateNo: data.vehiclePlateNo,
      validIdPresented: data.validIdPresented,
      reservationNumber: data.reservationNumber,
      roomNumber: data.roomNumber,
      roomType: data.roomType || '', // Keep as string name (supports multiple room types)
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      checkInTime: data.checkInTime || '14:00',
      checkOutTime: data.checkOutTime || '11:00',
      accompanyingGuests: data.accompanyingGuests || [],
    });
  }

  startManualEntry(): void {
    this.isManualEntry.set(true);
    this.initializeForm();
    this.extractedData.set({
      firstName: '',
      lastName: '',
      middleName: '',
      phoneNumber: '',
      email: '',
      country: '',
      vehiclePlateNo: '',
      validIdPresented: false,
      reservationNumber: '',
      roomNumber: '',
      roomType: '',
      checkInDate: '',
      checkOutDate: '',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      accompanyingGuests: [],
    });
  }

  resetUpload(): void {
    this.extractedData.set(null);
    this.isConfirmed.set(false);
    this.isManualEntry.set(false);
    this.initializeForm();
  }

  confirmAndProceed(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const { fullName, ...rest } = this.editForm.value;
    const formData = { ...rest, ...this.splitFullName(fullName) };

    // Store the extracted data in router history state and navigate to main guest registration
    this.router.navigate(
      ['/guest-registration'],
      {
        state: {
          preFilledData: formData,
          fromPdfUpload: true,
        },
      }
    );
  }

  // "First Middle Last" - the guest's own registered name always uses one
  // typed field now (see initializeForm), but downstream (guest-registration
  // component, the CreateGuestDto) still stores first/middle/last separately.
  private splitFullName(fullName: string): { firstName: string; lastName: string; middleName: string } {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', lastName: '', middleName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '', middleName: '' };
    if (parts.length === 2) return { firstName: parts[0], lastName: parts[1], middleName: '' };
    return { firstName: parts[0], lastName: parts[parts.length - 1], middleName: parts.slice(1, -1).join(' ') };
  }
}
