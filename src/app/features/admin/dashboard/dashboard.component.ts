import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { GuestService } from '../../../core/services/guest.service';
import { GuestStatistics, Guest } from '../../../core/models';
import { GuestPdfPreviewComponent } from '../guest-list/guest-pdf-preview.component';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatTableModule, MatDividerModule, MatButtonModule, MatDialogModule, DatePipe],
  template: `
    <h2>Dashboard</h2>

    <!-- Stats Cards -->
    <div class="stats-grid">
      @for (stat of stats(); track stat.label) {
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <!-- Recent Guests -->
    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Recent Registrations</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="recentGuests()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Guest Name</th>
            <td mat-cell *matCellDef="let guest">{{ guest.lastName }}, {{ guest.firstName }}</td>
          </ng-container>

          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let guest">{{ guest.phoneNumber || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="country">
            <th mat-header-cell *matHeaderCellDef>Country</th>
            <td mat-cell *matCellDef="let guest">{{ guest.country || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="registeredBy">
            <th mat-header-cell *matHeaderCellDef>Registered By</th>
            <td mat-cell *matCellDef="let guest">
              {{ guest.registeredBy?.firstName }} {{ guest.registeredBy?.lastName }}
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let guest">{{ guest.createdAt | date: 'short' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let guest">
              <button mat-icon-button color="primary" (click)="viewGuest(guest)">
                <mat-icon>visibility</mat-icon>
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    .table-card {
      margin-top: 16px;
    }

    .full-width {
      width: 100%;
    }
  `,
})
export class DashboardComponent implements OnInit {
  stats = signal<{ label: string; value: number; icon: string; color: string }[]>([]);
  recentGuests = signal<Guest[]>([]);
  displayedColumns = ['name', 'phone', 'country', 'registeredBy', 'date', 'actions'];

  constructor(private guestService: GuestService, private dialog: MatDialog) {}

  ngOnInit(): void {
    const periods = [
      { period: 'today' as const, label: 'Today', icon: 'today', color: '#C41E3A' },
      { period: 'week' as const, label: 'This Week', icon: 'date_range', color: '#1976d2' },
      { period: 'month' as const, label: 'This Month', icon: 'calendar_month', color: '#388e3c' },
      { period: 'year' as const, label: 'This Year', icon: 'calendar_today', color: '#f57c00' },
    ];

    periods.forEach((p) => {
      this.guestService.getStatistics(p.period).subscribe((data) => {
        this.stats.update((current) => [
          ...current,
          { label: p.label, value: data.totalGuests, icon: p.icon, color: p.color },
        ]);
      });
    });

    this.guestService.getByPeriod('today').subscribe((guests) => this.recentGuests.set(guests));
  }

  viewGuest(guest: Guest): void {
    this.dialog.open(GuestPdfPreviewComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: guest
    });
  }
}
