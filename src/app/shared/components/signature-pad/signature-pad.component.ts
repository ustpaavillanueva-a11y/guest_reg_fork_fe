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
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    .signature-canvas {
      display: block;
      cursor: crosshair;
      background: white;
      touch-action: none;
      border: 1px solid #eee;
      max-width: 100%;
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
      display: block;
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
  private activePointerId: number | null = null;
  private lastPoint: { x: number; y: number } | null = null;
  private lastMidPoint: { x: number; y: number } | null = null;
  private dpr = 1;
  private boundHandlers: (() => void)[] = [];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.resizeCanvas();

    const getCoordinates = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.activePointerId !== null) return; // ignore a second simultaneous touch (e.g. resting palm)
      e.preventDefault();
      this.activePointerId = e.pointerId;
      this.drawing = true;
      canvas.setPointerCapture(e.pointerId); // keep receiving move/up even if the finger slides off the canvas

      const coords = getCoordinates(e);
      this.lastPoint = coords;
      this.lastMidPoint = coords;
      this.ctx.beginPath();
      this.ctx.moveTo(coords.x, coords.y);
      // A tap with no movement should still leave a visible dot.
      this.ctx.lineTo(coords.x + 0.01, coords.y + 0.01);
      this.ctx.stroke();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.drawing || e.pointerId !== this.activePointerId) return;
      e.preventDefault();

      const point = getCoordinates(e);
      const midPoint = { x: (this.lastPoint!.x + point.x) / 2, y: (this.lastPoint!.y + point.y) / 2 };

      // Quadratic-curve through midpoints (not straight segments) so strokes
      // read as smooth handwriting instead of a jagged polyline - matters
      // most on touch input, which samples points less densely than a mouse.
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastMidPoint!.x, this.lastMidPoint!.y);
      this.ctx.quadraticCurveTo(this.lastPoint!.x, this.lastPoint!.y, midPoint.x, midPoint.y);
      this.ctx.stroke();

      this.lastMidPoint = midPoint;
      this.lastPoint = point;
    };

    const endStroke = (e: PointerEvent) => {
      if (!this.drawing || e.pointerId !== this.activePointerId) return;
      this.drawing = false;
      this.activePointerId = null;
      this.lastPoint = null;
      this.lastMidPoint = null;
      this.hasSigned = true;
      this.emitSignature();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);
    canvas.addEventListener('pointerleave', endStroke);

    this.boundHandlers.push(
      () => canvas.removeEventListener('pointerdown', onPointerDown),
      () => canvas.removeEventListener('pointermove', onPointerMove),
      () => canvas.removeEventListener('pointerup', endStroke),
      () => canvas.removeEventListener('pointercancel', endStroke),
      () => canvas.removeEventListener('pointerleave', endStroke)
    );
  }

  ngOnDestroy(): void {
    this.boundHandlers.forEach((fn) => fn());
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawing = false;
    this.activePointerId = null;
    this.lastPoint = null;
    this.lastMidPoint = null;
    this.hasSigned = false;
    this.signatureChange.emit('');
  }

  private _pendingImage: HTMLImageElement | null = null;

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
    setTimeout(() => this.resizeCanvas(), 0);
  }

  private applyStrokeStyle(): void {
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    let cssWidth: number, cssHeight: number;
    if (this.fullscreen) {
      cssWidth = Math.floor(window.innerWidth * 0.9);
      cssHeight = Math.floor(window.innerHeight * 0.8);
    } else {
      const rect = canvas.parentElement?.getBoundingClientRect();
      cssWidth = Math.floor(rect?.width || 600);
      cssHeight = 220;
    }

    // Preserve the current drawing so it can be redrawn scaled to the new size.
    const hadContent = canvas.width > 0 && canvas.height > 0 && this.hasSigned;
    const previousDataUrl = hadContent ? canvas.toDataURL('image/png') : null;

    // Match the canvas's internal pixel resolution to the device pixel ratio
    // (kept separate from its CSS display size) so strokes render crisp
    // instead of blurry on high-DPI tablet screens.
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * this.dpr);
    canvas.height = Math.round(cssHeight * this.dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.applyStrokeStyle();

    if (previousDataUrl) {
      const img = new window.Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
      };
      img.src = previousDataUrl;
    }
  }

  private emitSignature(): void {
    const canvas = this.canvasRef.nativeElement;
    this.signatureChange.emit(canvas.toDataURL('image/png'));
  }
}
