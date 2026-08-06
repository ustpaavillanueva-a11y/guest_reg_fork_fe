import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotelSettingsService } from '../../../core/services/hotel-settings.service';
import { HotelSettings } from '../../../core/models';

@Component({
  selector: 'app-hotel-settings',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2>Hotel Settings</h2>

    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner /></div>
        } @else {
          <form [formGroup]="settingsForm" (ngSubmit)="onSave()" class="settings-form">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Hotel Name</mat-label>
                <input matInput formControlName="hotelName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Default Check-in Time</mat-label>
                <input matInput formControlName="defaultCheckInTime" type="time" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Default Check-out Time</mat-label>
                <input matInput formControlName="defaultCheckOutTime" type="time" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Smoking Fee (₱)</mat-label>
                <input matInput formControlName="smokingFee" type="number" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Corkage Fee (%)</mat-label>
                <input matInput formControlName="corkageFeePercent" type="number" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Total Rooms</mat-label>
                <input matInput formControlName="totalRooms" type="number" min="0" />
                <mat-hint>Used to compute occupancy rate in Booking Analytics</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contact Number</mat-label>
                <input matInput formControlName="contactNumber" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="address" rows="3"></textarea>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="settingsForm.invalid || saving()">
              @if (saving()) {
                <mat-spinner diameter="20" />
              } @else {
                Save Settings
              }
            </button>
          </form>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    h2 { margin-bottom: 24px; color: #1a1a2e; }
    .settings-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `,
})
export class HotelSettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);

  private fb = inject(FormBuilder);
  private settingsService = inject(HotelSettingsService);
  private snackBar = inject(MatSnackBar);

  settingsForm = this.fb.nonNullable.group({
    hotelName: ['', Validators.required],
    defaultCheckInTime: ['14:00'],
    defaultCheckOutTime: ['11:00'],
    smokingFee: [5000],
    corkageFeePercent: [30],
    totalRooms: [0],
    contactNumber: [''],
    email: [''],
    address: [''],
  });

  constructor() {}

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSave(): void {
    if (this.settingsForm.invalid) return;
    this.saving.set(true);

    this.settingsService.updateSettings(this.settingsForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Settings saved!', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Save failed', 'Close', { duration: 3000 });
      },
    });
  }
}
