import { Component, Inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Guest } from '../../../core/models';
import { RegistrationPdfContentComponent } from '../../../shared/components/registration-pdf-content/registration-pdf-content.component';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-guest-pdf-preview',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, RegistrationPdfContentComponent],
  template: `
    <div class="pdf-preview-container">
      <div class="preview-actions">
        <button mat-raised-button color="primary" (click)="downloadPdf()" [disabled]="!pdfBlob">
          <mat-icon>download</mat-icon> Download PDF
        </button>
      </div>

      @if (generating()) {
        <div class="generating-state">
          <mat-spinner diameter="40" />
          <p>Generating PDF...</p>
        </div>
      }

      @if (pdfUrl) {
        <iframe [src]="pdfUrl" class="pdf-iframe" [class.hidden]="generating()"></iframe>
      }

      <!-- Off-screen: the real source rasterized into the PDF above, never shown directly -->
      @if (guest?.reservations) {
        <div class="offscreen-source">
          <app-registration-pdf-content #pdfContentEl [guest]="guest!" />
        </div>
      }
    </div>
  `,
  styles: `
    .pdf-preview-container {
      position: relative;
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

    .generating-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .generating-state p {
      font-size: 14px;
      color: #666;
    }

    .pdf-iframe {
      flex: 1;
      width: 100%;
      min-height: 0;
      border: none;
      border-radius: 8px;
    }
    .pdf-iframe.hidden {
      display: none;
    }

    .offscreen-source {
      position: absolute;
      left: -10000px;
      top: 0;
      width: 800px;
    }

    @media print {
      .preview-actions {
        display: none;
      }
    }
  `
})
export class GuestPdfPreviewComponent implements AfterViewInit, OnDestroy {
  guest: Guest | null = null;
  generating = signal(true);
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null;

  @ViewChild('pdfContentEl', { read: ElementRef }) pdfContentEl?: ElementRef<HTMLElement>;

  private objectUrl: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Guest | null,
    private sanitizer: DomSanitizer
  ) {
    this.guest = data;
  }

  ngAfterViewInit(): void {
    if (!this.guest?.reservations || !this.pdfContentEl) {
      this.generating.set(false);
      return;
    }

    // Give the off-screen content a moment to fully render before rasterizing it.
    requestAnimationFrame(() => {
      setTimeout(() => this.generatePdf(), 300);
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private generatePdf(): void {
    if (!this.pdfContentEl) {
      this.generating.set(false);
      return;
    }

    const opt = {
      margin: 8,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' }
    };

    html2pdf()
      .set(opt)
      .from(this.pdfContentEl.nativeElement)
      .output('blob')
      .then((blob: Blob) => {
        this.pdfBlob = blob;
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.generating.set(false);
      })
      .catch(() => {
        this.generating.set(false);
      });
  }

  downloadPdf(): void {
    if (!this.pdfBlob || !this.guest) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(this.pdfBlob);
    link.download = `Guest-${this.guest.lastName}-${this.guest.firstName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
