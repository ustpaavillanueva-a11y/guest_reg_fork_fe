import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GuestService } from '../../../core/services/guest.service';
import { Guest } from '../../../core/models';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-registration-pdf',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
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
          <button mat-flat-button color="primary" (click)="downloadAllPdf()">
            <mat-icon>download</mat-icon> Download PDF
          </button>
          <button mat-stroked-button (click)="printPdf()">
            <mat-icon>print</mat-icon> Print
          </button>
        </div>
      </div>

      <!-- PDF Content -->
      <div class="pdf-page" id="pdfContent">
        <!-- Header -->
        <div class="pdf-header">
          <div class="logo-section">
            <div class="logo-icon">K</div>
            <h1>Kekehyu Business Hotel</h1>
          </div>
        </div>

        @for (reservation of guest()!.reservations; track reservation.id; let ri = $index) {
          @if (ri > 0) {
            <div class="page-break"></div>
            <div class="pdf-header">
              <div class="logo-section">
                <div class="logo-icon">K</div>
                <h1>Kekehyu Business Hotel</h1>
              </div>
            </div>
          }

          <!-- Guest & Reservation Info Grid -->
          <div class="info-grid">
            <div class="info-row three-col">
              <div class="info-cell">
                <span class="label">Name</span>
                <span class="value">{{ guest()!.lastName }}, {{ guest()!.firstName }}{{ guest()!.middleName ? ' ' + guest()!.middleName : '' }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Check in Date</span>
                <span class="value">{{ reservation.checkInDate | date: 'MM/dd/yyyy' }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Check out Date</span>
                <span class="value">{{ reservation.checkOutDate ? (reservation.checkOutDate | date: 'MM/dd/yyyy') : '—' }}</span>
              </div>
            </div>

            <div class="info-row three-col">
              <div class="info-cell">
                <span class="label">Reservation Number</span>
                <span class="value">{{ reservation.reservationNumber }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Room Type</span>
                <span class="value">{{ reservation.roomType?.name || '—' }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Room Number</span>
                <span class="value">{{ reservation.roomNumber }}</span>
              </div>
            </div>

            <div class="info-row three-col">
              <div class="info-cell">
                <span class="label">Phone Number</span>
                <span class="value">{{ guest()!.phoneNumber || '—' }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Email</span>
                <span class="value">{{ guest()!.email || '—' }}</span>
              </div>
              <div class="info-cell">
                <span class="label">Country</span>
                <span class="value">{{ guest()!.country || '—' }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-cell">
                <span class="label">VEHICLE PLATE NO. :</span>
                <span class="value">{{ guest()!.vehiclePlateNo || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Accompanying Guests -->
          <div class="section">
            <h2>ACCOMPANYING / SHARING GUESTS</h2>
            <p class="note"><em>All accompanying guests must be registered for safety and security.</em>
              <strong> Valid ID Presented:</strong> {{ guest()!.validIdPresented ? '☑ Yes ☐ No' : '☐ Yes ☑ No' }}
            </p>
            <p class="note"><em>(NO ID, NO ENTRY policy strictly enforced)</em></p>

            <table class="companion-table">
              <thead>
                <tr>
                  <th style="width: 40px">#</th>
                  <th>Name</th>
                  <th style="width: 120px">Valid ID Presented</th>
                  <th style="width: 140px">Signature</th>
                </tr>
              </thead>
              <tbody>
                @for (ag of reservation.accompanyingGuests; track ag.id; let j = $index) {
                  <tr>
                    <td>{{ j + 1 }}.</td>
                    <td>{{ ag.lastName }}, {{ ag.firstName }}{{ ag.middleName ? ' ' + ag.middleName : '' }}</td>
                    <td>{{ ag.validIdPresented ? '☑ Yes ☐ No' : '☐ Yes ☑ No' }}</td>
                    <td>
                      @if (ag.signature) {
                        <img [src]="ag.signature" class="sig-img-small" alt="Signature" />
                      } @else {
                        <span class="blank-line"></span>
                      }
                    </td>
                  </tr>
                }
                @for (_ of emptyRows(reservation.accompanyingGuests.length); track $index) {
                  <tr class="empty-row">
                    <td>{{ reservation.accompanyingGuests.length + $index + 1 }}.</td>
                    <td><span class="blank-line"></span></td>
                    <td>☐ Yes ☐ No</td>
                    <td><span class="blank-line"></span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Check-in / Check-out times -->
          <div class="section times-section">
            <p><strong>Check-in:</strong> {{ reservation.checkInTime || '2:00 PM' }}</p>
            <p><strong>Check-out:</strong> {{ reservation.checkOutTime || '11:00 AM' }}
              <em> Early check-in or late check-out is subject to availability and may incur additional charges.</em>
            </p>
          </div>

          <!-- Housekeeping Policy -->
          <div class="section">
            <h2>HOUSEKEEPING POLICY</h2>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyHousekeeping1 ? '☑' : '☐' }}</span>
              I understand that <strong>make-up room service is upon request only</strong>.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyHousekeeping2 ? '☑' : '☐' }}</span>
              I acknowledge that housekeeping staff are <strong>not allowed to enter the room without guest consent</strong>.
            </div>
          </div>

          <!-- Hotel Policies -->
          <div class="section">
            <h2>HOTEL POLICIES (PLEASE CHECK TO ACKNOWLEDGE)</h2>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policySmoking ? '☑' : '☐' }}</span>
              Smoking inside rooms is prohibited. A <strong>₱5,000 smoking fee</strong> applies for violations.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyCorkage ? '☑' : '☐' }}</span>
              A <strong>30% corkage fee</strong> applies to outside food and beverages.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyNoPets ? '☑' : '☐' }}</span>
              <strong>No pets allowed</strong> on hotel premises.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyNegligence ? '☑' : '☐' }}</span>
              Guests are responsible for any loss, damage, or incidents caused by negligence.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyMinors ? '☑' : '☐' }}</span>
              Minors must be accompanied by a responsible adult in accordance with local laws.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyParking ? '☑' : '☐' }}</span>
              Parking is limited and subject to availability.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policySafe ? '☑' : '☐' }}</span>
              The hotel is not liable for loss, theft, or damage to personal belongings. A <strong>digital in-room safe</strong> is provided.
            </div>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyForceMajeure ? '☑' : '☐' }}</span>
              In cases of force majeure (e.g., natural disasters), hotel policies may be adjusted as necessary.
            </div>
          </div>

          <!-- Data Privacy -->
          <div class="section">
            <h2>DATA PRIVACY</h2>
            <div class="policy-item">
              <span class="checkbox">{{ guest()!.agreement.policyDataPrivacy ? '☑' : '☐' }}</span>
              I acknowledge that my personal information will be handled confidentially in accordance with data privacy regulations.
            </div>
          </div>

          <!-- Guest Acknowledgment -->
          <div class="section">
            <h2>GUEST ACKNOWLEDGMENT</h2>
            <p class="acknowledgment-text">
              I hereby acknowledge that I have read, understood, and agree to abide by the
              Terms &amp; Conditions of Kekehyu Business Hotel.
            </p>

            <div class="sig-row">
              <div class="sig-field">
                <span class="label">Guest Printed Name:</span>
                <span class="value underline">{{ guest()!.agreement.guestPrintedName || '' }}</span>
              </div>
            </div>
            <div class="sig-row">
              <div class="sig-field sig-vertical">
                @if (guest()!.agreement.guestSignature) {
                  <img [src]="guest()!.agreement.guestSignature" class="sig-img" alt="Guest Signature" />
                } @else {
                  <span class="value underline sig-blank"></span>
                }
                <span class="label label-bottom">Guest Signature:</span>
              </div>
            </div>
            <div class="sig-row">
              <div class="sig-field">
                <span class="label">Date:</span>
                <span class="value underline">{{ guest()!.agreement.signatureDate | date: 'MM/dd/yyyy' }}</span>
              </div>
            </div>
          </div>

          <!-- Front Desk Section -->
          <div class="section front-desk-section">
            <h2>FOR FRONT DESK USE ONLY</h2>
            <div class="sig-row">
              <div class="sig-field">
                <span class="label">Processed by:</span>
                <span class="value underline">{{ guest()!.agreement.processedByName || '' }}</span>
              </div>
            </div>
            <div class="sig-row">
              <div class="sig-field sig-vertical">
                @if (guest()!.agreement.processedBySignature) {
                  <img [src]="guest()!.agreement.processedBySignature" class="sig-img" alt="Front Desk Signature" />
                } @else {
                  <span class="value underline sig-blank"></span>
                }
                <span class="label label-bottom">Signature:</span>
              </div>
            </div>
            <div class="sig-row">
              <div class="sig-field">
                <span class="label">Remarks:</span>
                <span class="value underline">{{ guest()!.agreement.remarks || '' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
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

    /* ============ PDF Page ============ */
    .pdf-page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px 24px;
      border: 1px solid #ddd;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #222;
      line-height: 1.3;
    }

    /* ============ Header ============ */
    .pdf-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #C41E3A;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: #C41E3A;
      color: white;
      font-size: 28px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .pdf-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #C41E3A;
      letter-spacing: 0.5px;
    }

    /* ============ Info Grid ============ */
    .info-grid {
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #eee;
    }
    .info-row.three-col .info-cell {
      flex: 1;
    }
    .info-cell {
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
    }
    .info-cell .label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-cell .value {
      font-weight: 600;
      font-size: 13px;
      color: #111;
    }

    .divider {
      border-top: 2px solid #333;
      margin: 16px 0;
    }

    /* ============ Sections ============ */
    .section {
      margin-bottom: 8px;
    }
    .section h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 4px;
      color: #111;
    }
    .note {
      font-size: 12px;
      margin: 0 0 4px;
      color: #444;
    }

    /* ============ Companion Table ============ */
    .companion-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: 10px;
    }
    .companion-table th,
    .companion-table td {
      border: 1px solid #ccc;
      padding: 6px 10px;
      text-align: left;
    }
    .companion-table th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }
    .blank-line {
      display: inline-block;
      width: 100%;
      border-bottom: 1px solid #999;
      min-width: 80px;
      height: 14px;
    }
    .empty-row td {
      color: #aaa;
    }

    /* ============ Times ============ */
    .times-section p {
      margin: 2px 0;
      font-size: 12px;
    }

    /* ============ Policy Items ============ */
    .policy-item {
      font-size: 12px;
      margin: 3px 0;
      padding-left: 4px;
    }
    .checkbox {
      margin-right: 6px;
      font-size: 14px;
    }
    .acknowledgment-text {
      font-size: 9px;
      margin: 0 0 4px;
      line-height: 1.2;
    }

    /* ============ Signature Rows ============ */
    .sig-row {
      margin: 3px 0;
    }
    .sig-field {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .sig-field.sig-vertical {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .sig-field .label {
      font-weight: 700;
      font-size: 9px;
      white-space: nowrap;
      margin-top: 1px;
    }
    .sig-field .label.label-bottom {
      margin-top: 0;
    }
    .sig-blank {
      display: block;
      height: 30px;
      width: 100%;
      max-width: 180px;
      border-bottom: 1px solid #333;
    }
    .sig-field .value.underline {
      flex: 1;
      border-bottom: 1px solid #333;
      min-height: 14px;
      font-weight: 500;
      font-size: 10px;
      padding-bottom: 1px;
    }
    .sig-img {
      height: 30px;
      max-width: 160px;
      object-fit: contain;
    }
    .sig-img-small {
      height: 30px;
      max-width: 120px;
      object-fit: contain;
    }

    .front-desk-section {
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #333;
    }

    .page-break {
      page-break-before: always;
      margin: 32px 0;
      border-top: 2px dashed #ccc;
    }

    /* ============ Print Styles ============ */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
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
      .pdf-page {
        border: none;
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .page-break {
        page-break-before: always;
        border: none;
        margin: 0;
      }
    }
  `,
})
export class RegistrationPdfComponent implements OnInit {
  guest = signal<Guest | null>(null);
  loading = signal(true);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private guestService = inject(GuestService);

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
    if (!guest) return;

    // Clone the PDF content to avoid modifying the visible page
    const pdfContent = document.getElementById('pdfContent');
    if (!pdfContent) return;

    const clonedContent = pdfContent.cloneNode(true) as HTMLElement;

    // Remove no-print elements
    clonedContent.querySelectorAll('.no-print, .action-bar').forEach(el => {
      (el as HTMLElement).remove();
    });

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

  emptyRows(currentCount: number): number[] {
    const min = 3;
    const remaining = min - currentCount;
    return remaining > 0 ? Array(remaining).fill(0) : [];
  }
}
