import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Guest } from '../../../core/models';
import { GuestService } from '../../../core/services/guest.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-guest-pdf-preview',
  standalone: true,
  imports: [DatePipe, CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="pdf-preview-container">
      <div class="preview-actions">
        <button mat-raised-button color="primary" (click)="downloadPdf()" [disabled]="downloading()">
          @if (downloading()) {
            <ng-container>
              <mat-spinner diameter="20" />
            </ng-container>
          } @else {
            <ng-container>
              <mat-icon>download</mat-icon> Download PDF
            </ng-container>
          }
        </button>
      </div>

      <!-- Display PDF from Supabase if available -->
      @if (guest?.agreement?.pdfPath) {
        <div class="pdf-viewer">
          <iframe [src]="sanitizedPdfUrl" class="pdf-iframe"></iframe>
        </div>
      } @else if (generatingPdf()) {
        <div class="pdf-viewer">
          <div class="generating-state">
            <mat-spinner diameter="40" />
            <p>Generating PDF...</p>
          </div>
        </div>
      } @else if (guest?.reservations) {
        <!-- Fallback: Show template-based preview -->
        <div class="pdf-page" id="guestPdfContent">
        @for (reservation of guest!.reservations; track reservation.id; let ri = $index) {
          @if (ri > 0) {
            <div class="page-break"></div>
          }

          <!-- Header -->
          <div class="pdf-header">
            <div class="header-content">
              <div class="logo-box">K</div>
              <h1>Kekehyu Business Hotel</h1>
            </div>
            <div class="header-line"></div>
          </div>

          <!-- Guest Info Section -->
          <div class="info-section">
            <div class="info-row">
              <div class="info-col">
                <div class="info-label">NAME</div>
                <div class=\"info-value\">{{ guest?.lastName }}, {{ guest?.firstName }}{{ guest?.middleName ? ' ' + guest?.middleName : '' }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">RESERVATION DATE</div>
                <div class="info-value">{{ reservation.checkInDate | date: 'MM/dd/yyyy' }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">CHECK-OUT DATE</div>
                <div class="info-value">{{ reservation.checkOutDate ? (reservation.checkOutDate | date: 'MM/dd/yyyy') : '—' }}</div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-col">
                <div class="info-label">RESERVATION NUMBER</div>
                <div class="info-value">{{ reservation.reservationNumber }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">ROOM TYPE</div>
                <div class="info-value">{{ reservation.roomType?.name || '—' }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">ROOM NUMBER</div>
                <div class="info-value">{{ reservation.roomNumber }}</div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-col">
                <div class="info-label">PHONE NUMBER</div>
                <div class="info-value">{{ guest?.phoneNumber || '—' }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">EMAIL</div>
                <div class="info-value">{{ guest?.email || '—' }}</div>
              </div>
              <div class="info-col">
                <div class="info-label">COUNTRY</div>
                <div class="info-value">{{ guest?.country || '—' }}</div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-col">
                <div class="info-label">VEHICLE PLATE NO.</div>
                <div class="info-value">{{ guest?.vehiclePlateNo || '—' }}</div>
              </div>
              <div class="info-col"></div>
              <div class="info-col"></div>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- Accompanying Guests -->
          @if (reservation.accompanyingGuests && reservation.accompanyingGuests.length > 0) {
            <div class="section">
              <h3 class="section-header">ACCOMPANYING / SHARING GUESTS</h3>
              <p class="section-note">All accompanying guests must be registered for safety and security. Valid ID Presented: ☐ Yes ☐ No<br>(NO ID, NO ENTRY policy strictly enforced)</p>

              <table class="guests-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NAME</th>
                    <th>VALID ID PRESENTED</th>
                    <th>SIGNATURE</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ag of reservation.accompanyingGuests; track ag.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td>{{ ag.lastName }}, {{ ag.firstName }}{{ ag.middleName ? ' ' + ag.middleName : '' }}</td>
                      <td style="text-align: center;">☐ {{ ag.validIdPresented ? 'Yes' : 'No' }}</td>
                      <td>
                        @if (ag.signature) {
                          <img [src]="ag.signature" class="signature-thumb" />
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="section-divider"></div>
          }

          <!-- Check-in/out times -->
          <div class="section">
            <div class="check-times">
              <strong>Check-in:</strong> {{ reservation.checkInTime || '14:00:00' }} &nbsp; &nbsp;
              <strong>Check-out:</strong> {{ reservation.checkOutTime || '11:00:00' }} Early check-out is subject to unavailability and may incur additional charges.
            </div>
          </div>

          <!-- Housekeeping Policy -->
          <div class="section">
            <h3 class="section-header">HOUSEKEEPING POLICY</h3>
            <div class="policies-list">
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyHousekeeping1" disabled />
                <span>I understand that <strong>make-up room service is upon request only</strong></span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyHousekeeping2" disabled />
                <span>I acknowledge that housekeeping staff are <strong>not allowed to enter the room without guest consent</strong></span>
              </div>
            </div>
          </div>

          <!-- Hotel Policies -->
          <div class="section">
            <h3 class="section-header">HOTEL POLICIES (PLEASE CHECK TO ACKNOWLEDGE)</h3>
            <div class="policies-list">
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policySmoking" disabled />
                <span>Smoking inside rooms is prohibited. A ₱5,000 smoking fee applies for violations.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyCorkage" disabled />
                <span>A 20% corkage fee applied to outside food and beverages.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyNoPets" disabled />
                <span><strong>No pets allowed</strong> on hotel premises.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyNegligence" disabled />
                <span>Guests are responsible for any loss, damage, or incidents caused by negligence.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyMinors" disabled />
                <span>Minors must be accompanied by a responsible adult in accordance with local laws.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyParking" disabled />
                <span>Parking is limited and subject to availability.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policySafe" disabled />
                <span>The hotel is not liable for loss, theft, or damage to personal belongings. A digital in-room safe is provided.</span>
              </div>
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyForceMajeure" disabled />
                <span>In case of force majeure (e.g., natural disasters), hotel policies may be adjusted as necessary.</span>
              </div>
            </div>
          </div>

          <!-- Data Privacy -->
          <div class="section">
            <h3 class="section-header">DATA PRIVACY</h3>
            <div class="policies-list">
              <div class="policy-item">
                <input type="checkbox" [checked]="guest?.agreement?.policyDataPrivacy" disabled />
                <span>I acknowledge that my personal information will be handled confidentially in accordance with data privacy regulations.</span>
              </div>
            </div>
          </div>

          <!-- Guest Acknowledgement -->
          <div class="section">
            <h3 class="section-header">GUEST ACKNOWLEDGEMENT</h3>
            <p class="acknowledgement-text">
              I hereby acknowledge that I have read, understood, and agree to abide by the Terms & Conditions of Kekehyu Business Hotel.
            </p>
            <div class="signature-grid">
              <div class="sig-block">
                <label>Guest Printed Name</label>
                <div class="sig-line">{{ guest?.agreement?.guestPrintedName || '________________________' }}</div>
              </div>
              <div class="sig-block">
                <label>Guest Signature</label>
                <div class="sig-line sig-image-container">
                  @if (guest?.agreement?.guestSignature) {
                    <img [src]="guest?.agreement?.guestSignature" class="signature-image" />
                  } @else {
                    <span class="no-sig">________________________</span>
                  }
                </div>
              </div>
            </div>

            <div class="signature-grid">
              <div class="sig-block">
                <label>Date</label>
                <div class="sig-line">{{ guest?.agreement?.signatureDate | date: 'MM/dd/yyyy' }}</div>
              </div>
              <div class="sig-block"></div>
            </div>
          </div>

          <!-- For Front Desk Use Only -->
          <div class="section front-desk-section">
            <h3 class="section-header">FOR FRONT DESK USE ONLY</h3>
            <div class="signature-grid">
              <div class="sig-block">
                <label>Processed By</label>
                <div class="sig-line">{{ guest?.agreement?.processedByName || '________________________' }}</div>
              </div>
              <div class="sig-block">
                <label>Signature</label>
                <div class="sig-line sig-image-container">
                  @if (guest?.agreement?.processedBySignature) {
                    <img [src]="guest?.agreement?.processedBySignature" class="signature-image" />
                  } @else {
                    <span class="no-sig">________________________</span>
                  }
                </div>
              </div>
            </div>

            @if (guest?.agreement?.remarks) {
              <div class="remarks-section">
                <label>Remarks</label>
                <div class="remarks-text">{{ guest?.agreement?.remarks }}</div>
              </div>
            }
          </div>
        }
      </div>
      }
    </div>
  `,
  styles: `
    .pdf-preview-container {
      display: flex;
      flex-direction: column;
      height: 80vh;
      width: 100%;
      gap: 8px;
      padding: 8px;
      overflow: hidden;
    }

    .preview-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-shrink: 0;
    }

    .pdf-page {
      background: white;
      padding: 8px 12px;
      font-family: 'Arial', sans-serif;
      color: #333;
      font-size: 11px;
      line-height: 1.3;
      height: 100%;
      overflow-y: auto;
    }

    .page-break {
      page-break-after: always;
      margin: 4px 0;
      border-top: 2px dashed #999;
    }

    .pdf-header {
      margin-bottom: 4px;
      padding-bottom: 4px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 12px;
    }

    .logo-box {
      width: 45px;
      height: 45px;
      background: #C41E3A;
      color: white;
      font-weight: bold;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #C41E3A;
    }

    .header-line {
      border-bottom: 3px solid #C41E3A;
      margin-top: 8px;
    }

    .info-section {
      margin-bottom: 4px;
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 4px;
      padding: 0 4px;
    }

    .info-col {
      border-bottom: 1px solid #999;
      padding-bottom: 4px;
    }

    .info-label {
      font-size: 9px;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .info-value {
      font-size: 11px;
      font-weight: 500;
      color: #000;
    }

    .section-divider {
      border-bottom: 2px solid #999;
      margin: 4px 0;
    }

    .section {
      margin-bottom: 4px;
    }

    .section-header {
      font-size: 10px;
      font-weight: bold;
      background: #f0f0f0;
      padding: 3px 4px;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4px solid #C41E3A;
    }

    .section-note {
      font-size: 9px;
      margin: 2px 0 4px 0;
      color: #666;
    }

    .guests-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin: 2px 0;
    }

    .guests-table th {
      background: #e8e8e8;
      border: 1px solid #999;
      padding: 2px 2px;
      text-align: left;
      font-weight: bold;
    }

    .guests-table td {
      border: 1px solid #999;
      padding: 2px 2px;
      min-height: 40px;
    }

    .signature-thumb {
      max-width: 60px;
      max-height: 30px;
      object-fit: contain;
    }

    .check-times {
      font-size: 10px;
      padding: 2px;
      line-height: 1.3;
    }

    .policies-list {
      margin: 2px 0;
    }

    .policy-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 10px;
      line-height: 1.4;
    }

    .policy-item input[type="checkbox"] {
      margin-top: 2px;
      flex-shrink: 0;
    }

    .policy-item span {
      flex: 1;
    }

    .acknowledgement-text {
      font-size: 10px;
      margin: 8px 0;
      padding: 8px;
      background: #f9f9f9;
      border-left: 3px solid #C41E3A;
      line-height: 1.5;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 12px 0;
    }

    .sig-block {
      padding: 8px 0;
    }

    .sig-block label {
      font-size: 9px;
      font-weight: bold;
      display: block;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .sig-line {
      border-bottom: 1px solid #000;
      min-height: 35px;
      display: flex;
      align-items: flex-end;
      padding-bottom: 2px;
    }

    .sig-image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px 0;
    }

    .signature-image {
      max-width: 100%;
      max-height: 35px;
      object-fit: contain;
    }

    .no-sig {
      color: #999;
    }

    .front-desk-section {
      background: #fafafa;
      padding: 12px;
      border: 1px solid #ddd;
      margin-top: 20px;
    }

    .remarks-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }

    .remarks-section label {
      font-size: 9px;
      font-weight: bold;
      display: block;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .remarks-text {
      font-size: 10px;
      padding: 6px;
      line-height: 1.4;
    }

    .pdf-viewer {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      overflow: hidden;
      min-height: 0;
    }

    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .generating-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
    }

    .generating-state p {
      font-size: 14px;
      color: #666;
    }

    @media print {
      .preview-actions {
        display: none;
      }

      .pdf-page {
        box-shadow: none;
      }

      .pdf-viewer {
        display: none;
      }
    }
  `
})
export class GuestPdfPreviewComponent {
  guest: Guest | null = null;
  downloading = signal(false);
  generatingPdf = signal(false);
  sanitizedPdfUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Guest | null,
    private sanitizer: DomSanitizer,
    private guestService: GuestService
  ) {
    this.guest = data;
    
    // Sanitize PDF URL for iframe
    if (this.guest && this.guest.agreement && this.guest.agreement.pdfPath) {
      this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.guest.agreement.pdfPath
      );
    } else if (this.guest) {
      // Auto-generate PDF if it doesn't exist
      this.autoGenerateAndSavePdf();
    }
  }

  private autoGenerateAndSavePdf(): void {
    this.generatingPdf.set(true);
    
    // Wait for template to render
    setTimeout(() => {
      this.generateAndSaveTemplateAsPdf();
    }, 500);
  }

  private generateAndSaveTemplateAsPdf(): void {
    if (!this.guest) {
      this.generatingPdf.set(false);
      return;
    }

    try {
      const element = document.getElementById('guestPdfContent');
      if (!element) {
        this.generatingPdf.set(false);
        return;
      }

      const clonedContent = element.cloneNode(true) as HTMLElement;

      const opt = {
        margin: 8,
        filename: `Guest-${this.guest.lastName}-${this.guest.firstName}.pdf`,
        image: { type: 'png' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' }
      };

      html2pdf()
        .set(opt)
        .from(clonedContent)
        .output('blob')
        .then((pdfBlob: Blob) => {
          const fileName = `Guest_${this.guest!.lastName}_${this.guest!.firstName}_${new Date().getTime()}.pdf`;
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

          // Upload to Supabase
          this.guestService.uploadPdf(this.guest!.id, pdfFile).subscribe({
            next: (response) => {
              // Save the returned URL to the database
              this.guestService
                .update(this.guest!.id, {
                  agreement: {
                    ...this.guest!.agreement,
                    pdfPath: response.pdfUrl
                  }
                })
                .subscribe({
                  next: (updatedGuest) => {
                    this.guest = updatedGuest;
                    this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                      updatedGuest.agreement.pdfPath!
                    );
                    this.generatingPdf.set(false);
                  },
                  error: () => {
                    this.generatingPdf.set(false);
                  }
                });
            },
            error: () => {
              this.generatingPdf.set(false);
            }
          });
        });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.generatingPdf.set(false);
    }
  }

  downloadPdf(): void {
    if (!this.guest) return;
    
    // If PDF is already stored in Supabase, download from there
    if (this.guest.agreement && this.guest.agreement.pdfPath) {
      this.downloadFromSupabase();
      return;
    }

    // Otherwise, generate PDF from template (fallback for old records)
    this.generatePdfFromTemplate();
  }

  private downloadFromSupabase(): void {
    if (!this.guest || !this.guest.agreement || !this.guest.agreement.pdfPath) {
      this.generatePdfFromTemplate();
      return;
    }
    
    this.downloading.set(true);
    
    try {
      const link = document.createElement('a');
      link.href = this.guest.agreement.pdfPath;
      link.download = `Guest-${this.guest.lastName}-${this.guest.firstName}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to generating from template
      this.generatePdfFromTemplate();
    } finally {
      this.downloading.set(false);
    }
  }

  private generatePdfFromTemplate(): void {
    if (!this.guest) return;
    
    this.downloading.set(true);
    
    try {
      const element = document.getElementById('guestPdfContent');
      if (!element) {
        this.downloading.set(false);
        return;
      }

      const opt = {
        margin: 8,
        filename: `Guest-${this.guest.lastName}-${this.guest.firstName}.pdf`,
        image: { type: 'png' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
    } finally {
      this.downloading.set(false);
    }
  }
}
