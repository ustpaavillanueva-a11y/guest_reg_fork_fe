import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuestService } from '../../../core/services/guest.service';
import { Guest } from '../../../core/models';
import { GuestPdfPreviewComponent } from '../../admin/guest-list/guest-pdf-preview.component';
import { RegistrationPdfContentComponent } from '../../../shared/components/registration-pdf-content/registration-pdf-content.component';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-registration-pdf',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink, MatDialogModule, RegistrationPdfContentComponent],
  template: `
    @if (loading()) {
      <div class="loading">
        <mat-spinner diameter="40" />
        <p>Loading registration...</p>
      </div>
    } @else if (guest()) {
      <!-- Action Bar (no-print) -->
      <div class="action-bar no-print">
        <button mat-button routerLink="/guest-registration">
          <mat-icon>arrow_back</mat-icon> New Registration
        </button>
        <div class="action-buttons">
          <button mat-flat-button color="primary" (click)="viewPdfModal()">
            <mat-icon>fullscreen</mat-icon> View PDF
          </button>
          <button mat-flat-button color="primary" (click)="downloadAllPdf()">
            <mat-icon>download</mat-icon> Download PDF
          </button>
          <button mat-stroked-button (click)="printPdf()">
            <mat-icon>print</mat-icon> Print
          </button>
        </div>
      </div>

      <app-registration-pdf-content #pdfContentEl [guest]="guest()!" />
    } @else {
      <div class="loading">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #ccc">error_outline</mat-icon>
        <p>Registration not found.</p>
        <button mat-flat-button color="primary" routerLink="/guest-registration">Back to Registration</button>
      </div>
    }
  `,
  styles: `
    /* ============ Action Bar ============ */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      gap: 16px;
      color: #666;
    }

    /* ============ Print Styles ============ */
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
      div.no-print,
      div.action-bar,
      .no-print,
      .action-bar {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      }
    }
  `,
})
export class RegistrationPdfComponent implements OnInit {
  guest = signal<Guest | null>(null);
  loading = signal(true);

  @ViewChild('pdfContentEl', { read: ElementRef }) pdfContentEl?: ElementRef<HTMLElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private guestService = inject(GuestService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.guestService.getById(id).subscribe({
      next: (guest) => {
        this.guest.set(guest);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  printPdf(): void {
    window.print();
  }

  downloadAllPdf(): void {
    const guest = this.guest();
    if (!guest || !this.pdfContentEl) return;

    // Clone the PDF content to avoid modifying the visible page
    const clonedContent = this.pdfContentEl.nativeElement.cloneNode(true) as HTMLElement;

    // Generate PDF with html2pdf - optimized for A4 single page
    const fileName = `Registration_${guest.lastName}_${new Date().getTime()}.pdf`;
    const options: any = {
      margin: [5, 5, 5, 5],  // Minimal margins for A4 fit
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(clonedContent).save();
  }

  viewPdfModal(): void {
    const guest = this.guest();
    if (!guest) return;

    this.dialog.open(GuestPdfPreviewComponent, {
      width: '95vw',
      maxHeight: '98vh',
      maxWidth: '1400px',
      data: guest
    });
  }
}
