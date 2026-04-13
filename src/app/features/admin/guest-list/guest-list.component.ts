import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuestService } from '../../../core/services/guest.service';
import { AuthService } from '../../../core/services/auth.service';
import { Guest } from '../../../core/models';
import { GuestPdfPreviewComponent } from './guest-pdf-preview.component';

@Component({
  selector: 'app-guest-list',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DatePipe,
    FormsModule,
  ],
  template: `
    <h2>Guest List</h2>

    <mat-card>
      <mat-card-content>
        <div class="table-header">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search guests</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()" placeholder="Name, phone, email..." />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <table mat-table [dataSource]="filteredGuests()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let guest">{{ guest.lastName }}, {{ guest.firstName }} {{ guest.middleName }}</td>
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
              @if (isSuperAdmin()) {
                <button mat-icon-button color="warn" (click)="deleteGuest(guest)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        <mat-paginator
          [length]="allGuests().length"
          [pageSize]="10"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPage($event)"
        />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    h2 { margin-bottom: 24px; color: #1a1a2e; }
    .table-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .search-field { width: 350px; }
    .full-width { width: 100%; }
  `,
})
export class GuestListComponent implements OnInit {
  allGuests = signal<Guest[]>([]);
  filteredGuests = signal<Guest[]>([]);
  searchTerm = '';
  loadingGuestId = signal<string | null>(null);
  displayedColumns = ['name', 'phone', 'country', 'registeredBy', 'date', 'actions'];

  constructor(
    private guestService: GuestService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests(): void {
    this.guestService.getAll().subscribe((guests) => {
      this.allGuests.set(guests);
      this.filteredGuests.set(guests);
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredGuests.set(
      this.allGuests().filter(
        (g) =>
          g.firstName.toLowerCase().includes(term) ||
          g.lastName.toLowerCase().includes(term) ||
          (g.middleName?.toLowerCase().includes(term) ?? false) ||
          (g.phoneNumber?.toLowerCase().includes(term) ?? false) ||
          (g.email?.toLowerCase().includes(term) ?? false)
      )
    );
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('super_admin');
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

  deleteGuest(guest: Guest): void {
    if (!confirm(`Delete guest "${guest.lastName}, ${guest.firstName}"?`)) return;

    this.guestService.delete(guest.id).subscribe({
      next: () => {
        this.snackBar.open('Guest deleted', 'Close', { duration: 3000 });
        this.loadGuests();
      },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 }),
    });
  }

  onPage(event: PageEvent): void {
    // Pagination handled by mat-paginator with dataSource
  }
}
