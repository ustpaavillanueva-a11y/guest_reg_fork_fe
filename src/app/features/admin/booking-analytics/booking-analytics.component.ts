import { Component, OnInit, signal, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  Chart,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  LineController,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from 'chart.js';
import { GuestService } from '../../../core/services/guest.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { BookingAnalytics, StatisticsPeriod } from '../../../core/models';

Chart.register(
  LinearScale, CategoryScale, BarController, BarElement,
  LineController, PointElement, LineElement, Legend, Tooltip,
);

@Component({
  selector: 'app-booking-analytics',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterLink,
    BaseChartDirective,
    DecimalPipe,
  ],
  template: `
    <h2>Booking Analytics</h2>

    <mat-button-toggle-group [(ngModel)]="selectedPeriod" (change)="loadAnalytics()">
      <mat-button-toggle value="today">Today</mat-button-toggle>
      <mat-button-toggle value="week">This Week</mat-button-toggle>
      <mat-button-toggle value="month">This Month</mat-button-toggle>
      <mat-button-toggle value="year">This Year</mat-button-toggle>
    </mat-button-toggle-group>

    @if (loading()) {
      <div class="loading-state"><mat-spinner diameter="40" /></div>
    } @else if (analytics(); as a) {
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon style="color:#1976d2">event_available</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ a.totalReservations }}</span>
              <span class="stat-label">Total Reservations</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon style="color:#388e3c">bedtime</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ a.avgLengthOfStayDays !== null ? (a.avgLengthOfStayDays | number: '1.1-1') + ' nights' : '-' }}</span>
              <span class="stat-label">Avg. Length of Stay</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon style="color:#f57c00">meeting_room</mat-icon>
            <div class="stat-info">
              @if (a.occupancyRatePercent !== null) {
                <span class="stat-value">{{ a.occupancyRatePercent | number: '1.0-1' }}%</span>
                <span class="stat-label">Occupancy Rate</span>
              } @else {
                <span class="stat-value stat-value--muted">-</span>
                <span class="stat-label">
                  Occupancy Rate
                  <a routerLink="/settings">(set Total Rooms)</a>
                </span>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon style="color:#C41E3A">cancel</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ a.cancellationRatePercent | number: '1.0-1' }}%</span>
              <span class="stat-label">
                Cancellation Rate
                <mat-icon
                  class="hint-icon"
                  matTooltip="Cancellation tracking isn't recorded yet in the registration flow — this will read 0% until that's built."
                  >info</mat-icon
                >
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Peak Day of Week (all-time)</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas baseChart [type]="'bar'" [data]="peakDayChartData" [options]="barChartOptions"></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Peak Month (all-time)</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas baseChart [type]="'bar'" [data]="peakMonthChartData" [options]="barChartOptions"></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="chart-card">
        <mat-card-header>
          <mat-card-title>Booking Forecast (trend &amp; seasonal estimate)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (forecastChartData) {
            <div class="chart-container">
              <canvas baseChart [type]="'line'" [data]="forecastChartData" [options]="lineChartOptions"></canvas>
            </div>
          } @else {
            <p class="empty-state">Kulang pa ang datos para sa forecast — kailangan ng hindi bababa sa 2 buwan ng history.</p>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    h2 { margin-bottom: 16px; color: #1a1a2e; }
    mat-button-toggle-group { margin-bottom: 24px; }

    .loading-state { display: flex; justify-content: center; padding: 48px; }

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

      mat-icon:first-child {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
    .stat-value--muted { color: #aaa; }
    .stat-label { font-size: 13px; color: #666; display: flex; align-items: center; gap: 4px; }
    .stat-label a { font-size: 12px; }

    .hint-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #999;
      cursor: help;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-card { margin-bottom: 0; }
    .chart-container { position: relative; height: 320px; width: 100%; }

    .empty-state { color: #666; text-align: center; padding: 32px 16px; }
  `,
})
export class BookingAnalyticsComponent implements OnInit {
  analytics = signal<BookingAnalytics | null>(null);
  loading = signal(true);
  selectedPeriod: StatisticsPeriod = 'today';

  peakDayChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  peakMonthChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  forecastChartData: ChartConfiguration<'line'>['data'] | null = null;

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  private guestService = inject(GuestService);
  private realtime = inject(RealtimeService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadAnalytics();

    merge(
      this.realtime.on('guest.created'),
      this.realtime.on('guest.updated'),
      this.realtime.on('guest.deleted'),
    )
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAnalytics());
  }

  loadAnalytics(): void {
    this.loading.set(true);
    this.guestService.getBookingAnalytics(this.selectedPeriod).subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load booking analytics:', err);
        this.loading.set(false);
      },
    });
  }

  private buildCharts(data: BookingAnalytics): void {
    this.peakDayChartData = {
      labels: data.peakDayOfWeek.map((d) => d.day.slice(0, 3)),
      datasets: [{ data: data.peakDayOfWeek.map((d) => d.count), backgroundColor: '#1976d2', borderRadius: 4 }],
    };

    this.peakMonthChartData = {
      labels: data.peakMonth.map((m) => m.month.slice(0, 3)),
      datasets: [{ data: data.peakMonth.map((m) => m.count), backgroundColor: '#388e3c', borderRadius: 4 }],
    };

    if (data.forecast) {
      const { historical, historicalMonths, predicted, months } = data.forecast;
      const labels = [...historicalMonths, ...months];

      // The last historical point doubles as the forecast series' first point
      // so the dashed line starts exactly where the solid line ends.
      const actualData: (number | null)[] = [...historical, ...predicted.map(() => null)];
      const forecastData: (number | null)[] = [
        ...historical.map((v, i) => (i === historical.length - 1 ? v : null)),
        ...predicted,
      ];

      this.forecastChartData = {
        labels,
        datasets: [
          { label: 'Actual', data: actualData, borderColor: '#388e3c', backgroundColor: 'transparent', tension: 0.3 },
          { label: 'Forecast', data: forecastData, borderColor: '#f57c00', backgroundColor: 'transparent', borderDash: [6, 4], tension: 0.3 },
        ],
      };
    } else {
      this.forecastChartData = null;
    }

    this.cdr.markForCheck();
  }
}
