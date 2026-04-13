import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { GuestService } from '../../../core/services/guest.service';
import { AuthService } from '../../../core/services/auth.service';
import { Guest } from '../../../core/models';
import { GuestPdfPreviewComponent } from '../../admin/guest-list/guest-pdf-preview.component';

@Component({
  selector: 'app-my-registrations',
  imports: [MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatDialogModule, DatePipe],
  template: `
    <h2>My Registrations</h2>

    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="guests()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Guest Name</th>
            <td mat-cell *matCellDef="let g">{{ g.lastName }}, {{ g.firstName }}</td>
          </ng-container>

          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let g">{{ g.phoneNumber || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="country">
            <th mat-header-cell *matHeaderCellDef>Country</th>
            <td mat-cell *matCellDef="let g">{{ g.country || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let g">{{ g.createdAt | date: 'short' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let g">
              <button mat-icon-button color="primary" (click)="viewGuest(g)" [disabled]="loadingGuestId() === g.id">
                @if (loadingGuestId() === g.id) {
                  <mat-spinner diameter="20" />
                } @else {
                  <mat-icon>visibility</mat-icon>
                }
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    h2 { margin-bottom: 24px; color: #1a1a2e; }
    .full-width { width: 100%; }
  `,
})
export class MyRegistrationsComponent implements OnInit {
  guests = signal<Guest[]>([]);
  loadingGuestId = signal<string | null>(null);
  displayedColumns = ['name', 'phone', 'country', 'date', 'actions'];

  constructor(
    private guestService: GuestService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.guestService.getAll().subscribe((guests) => this.guests.set(guests));
  }

  viewGuest(guest: Guest): void {
    this.loadingGuestId.set(guest.id);

    // Fetch full guest data with all reservations
    this.guestService.getById(guest.id).subscribe({
      next: (fullGuest) => {
        this.loadingGuestId.set(null);
        this.dialog.open(GuestPdfPreviewComponent, {
          width: '95vw',
          maxHeight: '98vh',
          maxWidth: '1400px',
          data: fullGuest
        });
      },
      error: () => {
        this.loadingGuestId.set(null);
      }
    });
  }
}
