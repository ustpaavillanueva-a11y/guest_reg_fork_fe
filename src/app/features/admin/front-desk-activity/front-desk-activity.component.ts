import { Component, OnInit, signal, input, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { FrontDeskActivity, StatisticsPeriod } from '../../../core/models';

@Component({
  selector: 'app-front-desk-activity',
  imports: [
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonToggleModule,
    FormsModule,
  ],
  template: `
    <h2>Front Desk Activity</h2>

    <mat-button-toggle-group [(ngModel)]="selectedPeriod" (change)="loadActivity()">
      <mat-button-toggle value="today">Today</mat-button-toggle>
      <mat-button-toggle value="week">This Week</mat-button-toggle>
      <mat-button-toggle value="month">This Month</mat-button-toggle>
      <mat-button-toggle value="year">This Year</mat-button-toggle>
    </mat-button-toggle-group>

    <mat-card class="activity-table">
      <mat-card-content>
        <table mat-table [dataSource]="activities()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Staff Name</th>
            <td mat-cell *matCellDef="let act">{{ act.user.firstName }} {{ act.user.lastName }}</td>
          </ng-container>

          <ng-container matColumnDef="totalHours">
            <th mat-header-cell *matHeaderCellDef>Total Hours</th>
            <td mat-cell *matCellDef="let act">{{ act.totalHours }}h {{ act.totalMinutes % 60 }}m</td>
          </ng-container>

          <ng-container matColumnDef="sessions">
            <th mat-header-cell *matHeaderCellDef>Sessions</th>
            <td mat-cell *matCellDef="let act">{{ act.sessions.length }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let act">
              @if (hasActiveSession(act)) {
                <mat-chip color="primary" highlighted>Online</mat-chip>
              } @else {
                <mat-chip>Offline</mat-chip>
              }
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
    mat-button-toggle-group { margin-bottom: 24px; }
    .activity-table { margin-top: 16px; }
    .full-width { width: 100%; }
  `,
})
export class FrontDeskActivityComponent implements OnInit {
  activities = signal<FrontDeskActivity[]>([]);
  selectedPeriod: StatisticsPeriod = 'today';
  displayedColumns = ['name', 'totalHours', 'sessions', 'status'];

  private realtime = inject(RealtimeService);
  private destroyRef = inject(DestroyRef);

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.loadActivity();

    this.realtime.on('session.changed')
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadActivity());
  }

  loadActivity(): void {
    this.sessionService.getFrontDeskActivity(this.selectedPeriod).subscribe((data) => {
      this.activities.set(data);
    });
  }

  hasActiveSession(activity: FrontDeskActivity): boolean {
    return activity.sessions.some((s) => s.isActive);
  }
}
