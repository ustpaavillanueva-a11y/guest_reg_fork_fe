import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  output,
  OnDestroy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signature-pad',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="signature-wrapper" [class.has-signature]="hasSigned">
      <div class="canvas-area" [class.fullscreen]="fullscreen">
        <canvas #canvas class="signature-canvas"></canvas>
        @if (!hasSigned) {
          <div class="placeholder">
            <mat-icon>draw</mat-icon>
            <span>Sign here</span>
          </div>
        }
        <button mat-icon-button class="fullscreen-btn" type="button" (click)="toggleFullscreen()" [attr.aria-label]="fullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
          <mat-icon>{{ fullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
        </button>
      </div>
      <div class="sig-actions">
        <button mat-stroked-button type="button" (click)="clear()" [disabled]="!hasSigned">
          <mat-icon>refresh</mat-icon> Clear
        </button>
      </div>
    </div>
  `,
  styles: `
    .signature-wrapper {
      border: 2px dashed #ccc;
      border-radius: 12px;
      background: #fafafa;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .signature-wrapper.has-signature {
      border-color: #28a745;
      border-style: solid;
    }
    .canvas-area {
      position: relative;
      transition: all 0.3s;
    }
    .signature-canvas {
      display: block;
      width: 100%;
      height: 180px;
      cursor: crosshair;
      background: white;
      touch-action: none;
      transition: all 0.3s;
    }
    .canvas-area.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10000;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      border-radius: 0;
    }
    .canvas-area.fullscreen .signature-canvas {
      width: 90vw;
      height: 80vh;
      max-width: 1200px;
      max-height: 90vh;
      box-shadow: 0 2px 24px #0008;
      border-radius: 8px;
    }
    .fullscreen-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      background: rgba(255,255,255,0.8);
      border-radius: 50%;
      box-shadow: 0 1px 4px #0002;
    }
    .placeholder {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #aaa;
      font-size: 15px;
      pointer-events: none;
    }
    .placeholder mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .sig-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid #eee;
    }
  `,
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  signatureChange = output<string>();
  hasSigned = false;
  fullscreen = false;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private boundHandlers: (() => void)[] = [];

  ngAfterViewInit(): void {
    this.resizeCanvas();
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    const onPointerDown = (e: PointerEvent) => {
      this.drawing = true;
      this.ctx.beginPath();
      this.ctx.moveTo(e.offsetX, e.offsetY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.drawing) return;
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.stroke();
    };

    const onPointerUp = () => {
      this.drawing = false;
      this.hasSigned = true;
      this.emitSignature();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    this.boundHandlers.push(
      () => canvas.removeEventListener('pointerdown', onPointerDown),
      () => canvas.removeEventListener('pointermove', onPointerMove),
      () => canvas.removeEventListener('pointerup', onPointerUp),
      () => canvas.removeEventListener('pointerleave', onPointerUp)
    );
  }

  ngOnDestroy(): void {
    this.boundHandlers.forEach((fn) => fn());
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSigned = false;
    this.signatureChange.emit('');
  }

  private _pendingImage: HTMLImageElement | null = null;

  toggleFullscreen(): void {
    // Save current drawing as image before resizing
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this._pendingImage = new window.Image();
    this._pendingImage.src = dataUrl;
    this.fullscreen = !this.fullscreen;
    setTimeout(() => this.resizeCanvas(true), 0);
  }

  private resizeCanvas(restoreImage = false): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    let width: number, height: number;
    if (this.fullscreen) {
      width = window.innerWidth * 0.9;
      height = window.innerHeight * 0.8;
    } else {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || 600;
      height = 180;
    }
    // Save current image if not already saved
    if (!this._pendingImage) {
      const dataUrl = canvas.toDataURL('image/png');
      this._pendingImage = new window.Image();
      this._pendingImage.src = dataUrl;
    }
    canvas.width = width;
    canvas.height = height;
    // Restore the saved image after resizing
    if (this._pendingImage) {
      if (this._pendingImage.complete) {
        this.ctx.drawImage(this._pendingImage, 0, 0, width, height);
        this._pendingImage = null;
      } else {
        const img = this._pendingImage;
        const restoreAndEnable = () => {
          this.ctx.drawImage(img, 0, 0, width, height);
          this._pendingImage = null;
          img.onload = null;
        };
        img.onload = restoreAndEnable;
      }
    } else {
      this.redraw();
    }
  }

  private redraw(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
  }

  private emitSignature(): void {
    const canvas = this.canvasRef.nativeElement;
    this.signatureChange.emit(canvas.toDataURL('image/png'));
  }
}
