import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, Chart, LinearScale, CategoryScale, BarController, BarElement, Legend, Tooltip } from 'chart.js';
import { GuestService } from '../../../core/services/guest.service';
import { GuestStatistics, Guest } from '../../../core/models';
import { GuestPdfPreviewComponent } from '../guest-list/guest-pdf-preview.component';
import { PwaInstallService } from './pwa-install.service';

// Register Chart.js components
Chart.register(LinearScale, CategoryScale, BarController, BarElement, Legend, Tooltip);

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatTableModule, MatDividerModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule, MatTooltipModule, BaseChartDirective, DatePipe],
  template: `
    <div class="header">
      <h2>Dashboard</h2>
      @if (pwaInstall.canInstall()) {
        <button mat-raised-button color="accent" (click)="installApp()" matTooltip="Install as app for offline access">
          <mat-icon>download</mat-icon> Install App
        </button>
      }
    </div>

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

    <!-- Monthly Comparison Chart -->
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>Monthly Guest Comparison (This Year vs Last Year)</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (monthlyChartData && monthlyChartOptions) {
          <div class="chart-container">
            <canvas 
              baseChart 
              [type]="'bar'" 
              [data]="monthlyChartData"
              [options]="monthlyChartOptions">
            </canvas>
          </div>
        } @else {
          <div class="loading-state">
            <mat-spinner diameter="40" />
            <p>Loading monthly data...</p>
          </div>
        }
      </mat-card-content>
    </mat-card>

    <!-- Recent Guests -->
    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Recent Registrations</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="recentGuests()" class="full-width">
          
          <ng-container matColumnDef="reservationNumber">
            <th mat-header-cell *matHeaderCellDef>Reservation #</th>
            <td mat-cell *matCellDef="let guest">
              @if (guest.reservations && guest.reservations.length > 0) {
                {{ guest.reservations.map(r => r.reservationNumber).join(', ') }}
              } @else {
                -
              }
            </td>
          </ng-container>
          
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
              <button mat-icon-button color="primary" (click)="viewGuest(guest)" [disabled]="loadingGuestId() === guest.id">
                @if (loadingGuestId() === guest.id) {
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h2 {
      margin: 0;
      color: #1a1a2e;
      flex: 1;
    }

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

    .chart-card {
      margin-bottom: 32px;
    }

    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .loading-state p {
      color: #666;
      margin: 0;
    }
  `,
})
export class DashboardComponent implements OnInit {
  stats = signal<{ label: string; value: number; icon: string; color: string }[]>([]);
  recentGuests = signal<Guest[]>([]);
  loadingGuestId = signal<string | null>(null);
  displayedColumns = ['reservationNumber', 'name', 'phone', 'country', 'registeredBy', 'date', 'actions'];
  
  monthlyChartData: any;
  monthlyChartOptions: ChartConfiguration['options'];

  constructor(
    private guestService: GuestService,
    private dialog: MatDialog,
    public pwaInstall: PwaInstallService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeChartOptions();
  }

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

    // Fetch monthly comparison data for chart
    this.guestService.getMonthlyComparison().subscribe({
      next: (data) => {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        this.monthlyChartData = {
          labels: data.months,
          datasets: [
            {
              label: `${currentYear}`,
              data: data.thisYear,
              backgroundColor: '#388e3c',
              borderColor: '#2e7d32',
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: '#81c784',
            },
            {
              label: `${lastYear}`,
              data: data.lastYear,
              backgroundColor: '#ff9800',
              borderColor: '#f57c00',
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: '#ffb74d',
            },
          ],
        };
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load monthly comparison data:', err);
      },
    });
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

  installApp(): void {
    this.pwaInstall.installApp();
  }

  private initializeChartOptions(): void {
    this.monthlyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: { size: 12, weight: 500 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle' as const,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' as const },
          bodyFont: { size: 12 },
          borderColor: '#ddd',
          borderWidth: 0,
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${context.parsed.y} guests`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawOnChartArea: true,
            drawTicks: true,
          },
          ticks: {
            font: { size: 11 },
            color: '#666',
            stepSize: 5,
          },
          title: {
            display: true,
            text: 'Number of Guests',
            font: { size: 12, weight: 'bold' as const },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 11 },
            color: '#666',
          },
          title: {
            display: true,
            text: 'Month',
            font: { size: 12, weight: 'bold' as const },
          },
        },
      },
    } as ChartConfiguration['options'];
  }
}
