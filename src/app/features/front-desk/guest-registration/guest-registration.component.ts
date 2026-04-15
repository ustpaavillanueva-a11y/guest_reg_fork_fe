import { Component, signal, OnInit, inject, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNativeDateAdapter } from '@angular/material/core';
import html2pdf from 'html2pdf.js';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { GuestService } from '../../../core/services/guest.service';
import { RoomTypeService } from '../../../core/services/room-type.service';
import { HotelSettingsService } from '../../../core/services/hotel-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { RoomType, HotelSettings } from '../../../core/models';

@Component({
  selector: 'app-guest-registration',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    SignaturePadComponent,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="reg-container">
      <!-- Header Banner -->
      <div class="reg-header">
        <div class="header-content">
          <div>
            <h1>Guest Registration</h1>
            <p>{{ today }}</p>
          </div>
          <button mat-stroked-button (click)="navigateToPdfUpload()" class="pdf-upload-btn">
            <mat-icon>upload_file</mat-icon>
            Register with PDF
          </button>
        </div>
      </div>

      <mat-stepper linear #stepper class="reg-stepper" (selectionChange)="onStepChange($event)">
        <!-- ============ STEP 1: Details Confirmation ============ -->
        <mat-step label="Details Confirmation">
          <form class="step-content">
            <!-- Guest Information Display -->
            <mat-card class="form-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>person</mat-icon>
                  <h3>Guest Information</h3>
                </div>

                <div class="details-row two-col">
                  <div class="detail-item">
                    <label>First Name</label>
                    <p>{{ guestInfoForm.get('firstName')?.value }}</p>
                  </div>
                  <div class="detail-item">
                    <label>Last Name</label>
                    <p>{{ guestInfoForm.get('lastName')?.value }}</p>
                  </div>
                </div>

                <div class="details-row two-col">
                  <div class="detail-item">
                    <label>Email</label>
                    <p>{{ guestInfoForm.get('email')?.value }}</p>
                  </div>
                  <div class="detail-item">
                    <label>Phone</label>
                    <p>{{ guestInfoForm.get('phoneNumber')?.value }}</p>
                  </div>
                </div>

                <div class="details-row two-col">
                  <div class="detail-item">
                    <label>Country</label>
                    <p>{{ guestInfoForm.get('country')?.value }}</p>
                  </div>
                  <div class="detail-item">
                    <label>Vehicle Plate</label>
                    <p>{{ guestInfoForm.get('vehiclePlateNo')?.value }}</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Room Reservations Display -->
            <mat-card class="form-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>meeting_room</mat-icon>
                  <h3>Room Details</h3>
                </div>

                @for (reservation of reservations.controls; track $index; let i = $index) {
                  <div class="reservation-block">
                    <h4>Room {{ i + 1 }}</h4>
                    <div class="details-row four-col">
                      <div class="detail-item">
                        <label>Room Number</label>
                        <p>{{ reservation.get('roomNumber')?.value }}</p>
                      </div>
                      <div class="detail-item">
                        <label>Check-in</label>
                        <p>{{ reservation.get('checkInDate')?.value | date:'MMM dd, yyyy' }}</p>
                      </div>
                      <div class="detail-item">
                        <label>Check-out</label>
                        <p>{{ reservation.get('checkOutDate')?.value | date:'MMM dd, yyyy' }}</p>
                      </div>
                      <div class="detail-item">
                        <label>Room Type</label>
                        <p>{{ reservation.get('roomTypeId')?.value }}</p>
                      </div>
                    </div>
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- Policies Summary -->
            <mat-card class="form-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>gavel</mat-icon>
                  <h3>Policies Acknowledged</h3>
                </div>
                <p class="acknowledgment">✓ All hotel policies have been acknowledged and accepted by the guest.</p>
              </mat-card-content>
            </mat-card>

            <div class="step-nav">
              <span></span>
              <button mat-flat-button color="primary" matStepperNext class="nav-btn">
                Next: Agreement & Signature <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- ============ STEP 2: Agreement & Signatures ============ -->
        <mat-step label="Agreement & Signature">
          <form [formGroup]="signatureForm" class="step-content">
            <!-- Guest Agreement -->
            <mat-card class="form-card agreement-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>handshake</mat-icon>
                  <h3>Guest Agreement</h3>
                </div>

                <div class="agreement-box">
                  <p>
                    I, the undersigned, hereby acknowledge that I have read, understood, and agree to
                    abide by all the Terms & Conditions, Hotel Policies, and Data Privacy Policy of
                    <strong>Kekehyu Hotel</strong>. I confirm that all information provided in this
                    registration form is true and correct.
                  </p>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Guest Printed Name</mat-label>
                    <input matInput formControlName="guestPrintedName" />
                    <mat-icon matPrefix>person</mat-icon>
                    <mat-icon matSuffix class="edit-icon" title="Edit name">edit</mat-icon>
                  </mat-form-field>
                  <div class="date-box">
                    <mat-icon>calendar_today</mat-icon>
                    <span>{{ today }}</span>
                  </div>
                </div>

                <div class="signature-block">
                  <label class="sig-label">Guest Signature</label>
                  <app-signature-pad (signatureChange)="onGuestSignature($event)" />
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Front Desk Section -->
            <mat-card class="form-card frontdesk-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>support_agent</mat-icon>
                  <h3>Front Desk Verification</h3>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Processed by</mat-label>
                    <input matInput formControlName="processedByName" readonly />
                    <mat-icon matPrefix>badge</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Remarks (optional)</mat-label>
                    <textarea matInput formControlName="remarks" rows="1"></textarea>
                    <mat-icon matPrefix>notes</mat-icon>
                  </mat-form-field>
                </div>

                <div class="signature-block">
                  <label class="sig-label">Front Desk Signature</label>
                  <app-signature-pad (signatureChange)="onFrontDeskSignature($event)" />
                </div>
              </mat-card-content>
            </mat-card>

            <div class="step-nav">
              <button mat-button matStepperPrevious class="back-btn">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button
                mat-flat-button
                color="primary"
                class="submit-btn"
                [disabled]="!isFormValid() || submitting()"
                (click)="onSubmit()"
              >
                @if (submitting()) {
                  <mat-spinner diameter="22" />
                } @else {
                  <ng-container><mat-icon>task_alt</mat-icon></ng-container> Submit Registration
                }
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: `
    /* ============ Container ============ */
    .reg-container {
      max-width: 960px;
      margin: 0 auto;
    }

    /* ============ Header Banner ============ */
    .reg-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 28px;
      color: white;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .pdf-upload-btn {
      color: white;
      border-color: white;
      flex-shrink: 0;
    }
    .pdf-upload-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      opacity: 0.9;
    }
    .reg-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .reg-header p {
      margin: 4px 0 0;
      opacity: 0.75;
      font-size: 14px;
    }

    /* ============ Stepper ============ */
    .reg-stepper {
      background: transparent;
    }
    :host ::ng-deep .mat-horizontal-stepper-header-container {
      background: white;
      border-radius: 12px;
      padding: 8px 16px;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    /* ============ Step Content ============ */
    .step-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 4px 0 16px;
    }

    /* ============ Form Cards ============ */
    .form-card {
      border-radius: 14px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
      border: 1px solid #eee;
    }
    .form-card mat-card-content {
      padding: 24px !important;
    }

    /* ============ Section Titles ============ */
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .section-title mat-icon {
      color: #C41E3A;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .section-title h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .section-title h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .section-title.small mat-icon {
      font-size: 20px; width: 20px; height: 20px;
    }
    .spacer { flex: 1; }

    /* ============ Form Rows ============ */
    .form-row {
      display: grid;
      gap: 16px;
      margin-bottom: 4px;
    }
    .form-row.two-col {
      grid-template-columns: 1fr 1fr;
    }
    .form-row.three-col {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .form-row.four-col {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
    .form-field-full {
      width: 100%;
    }
    @media (max-width: 768px) {
      .form-row.two-col,
      .form-row.three-col,
      .form-row.four-col {
        grid-template-columns: 1fr;
      }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
      .form-row.four-col {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* ============ ID Check ============ */
    .id-check {
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 10px;
      margin-top: 4px;
    }
    .checkbox-label {
      font-weight: 500;
    }

    /* ============ Room Cards ============ */
    .room-card {
      border-left: 4px solid #C41E3A !important;
    }
    .remove-btn {
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .remove-btn:hover { opacity: 1; }

    /* ============ Companions ============ */
    .companions-section {
      margin-top: 12px;
      padding-top: 16px;
      border-top: 1px dashed #ddd;
    }
    .companion-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }
    .companion-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e8eaf6;
      color: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .companion-name { flex: 1; }
    .companion-middle { width: 80px; flex-shrink: 0; }
    .add-companion-btn {
      margin-top: 4px;
    }
    .add-room-btn {
      align-self: flex-start;
      border-style: dashed !important;
    }

    /* ============ Policies ============ */
    .policy-card {
      border-left: 4px solid #1a1a2e !important;
    }
    .policy-title mat-icon {
      color: #1a1a2e;
    }
    .policy-subtitle {
      color: #666;
      font-size: 13px;
      margin: -12px 0 16px 32px;
    }
    .policy-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-left: 8px;
    }
    .policy-list mat-checkbox {
      line-height: 1.5;
    }

    /* ============ Select All Box ============ */
    .select-all-box {
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .select-all-checkbox {
      font-weight: 600 !important;
    }
    .select-all-checkbox strong {
      font-weight: 700;
    }

    /* ============ Agreement ============ */
    .agreement-card {
      border-left: 4px solid #28a745 !important;
    }
    .agreement-box {
      background: #f0faf3;
      border: 1px solid #c3e6cb;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 20px;
    }
    .agreement-box p {
      margin: 0;
      line-height: 1.7;
      color: #333;
      font-size: 14px;
    }
    .date-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      background: #f8f9fa;
      border-radius: 10px;
      color: #555;
      font-size: 15px;
      height: 56px;
    }
    .date-box mat-icon {
      color: #888;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ============ Front Desk Card ============ */
    .frontdesk-card {
      border-left: 4px solid #0f3460 !important;
    }

    /* ============ Signature ============ */
    .signature-block {
      margin-top: 8px;
    }
    .sig-label {
      display: block;
      font-weight: 600;
      font-size: 14px;
      color: #444;
      margin-bottom: 10px;
    }

    /* ============ Details Display ============ */
    .details-row {
      display: grid;
      gap: 20px;
      margin-bottom: 20px;
    }
    .details-row.two-col {
      grid-template-columns: 1fr 1fr;
    }
    .details-row.four-col {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
    .detail-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #C41E3A;
    }
    .detail-item label {
      display: block;
      font-weight: 600;
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .detail-item p {
      margin: 0;
      color: #1a1a2e;
      font-size: 15px;
      word-break: break-word;
    }
    .reservation-block {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 15px;
      border-left: 4px solid #C41E3A;
    }
    .reservation-block h4 {
      margin: 0 0 15px 0;
      color: #1a1a2e;
      font-size: 15px;
      font-weight: 600;
    }
    .acknowledgment {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #28a745;
      color: #2d5016;
      margin: 0;
      font-weight: 500;
    }

    /* ============ Media Queries ============ */
    @media (max-width: 768px) {
      .details-row.two-col,
      .details-row.four-col {
        grid-template-columns: 1fr;
      }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
      .details-row.four-col {
        grid-template-columns: 1fr 1fr;
      }
    }
    .step-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 16px;
    }
    .nav-btn {
      height: 44px;
      padding: 0 24px;
      font-weight: 500;
      border-radius: 10px;
    }
    .back-btn {
      height: 44px;
      border-radius: 10px;
    }
    .submit-btn {
      height: 48px;
      padding: 0 32px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      letter-spacing: 0.3px;
    }
  `,
})
export class GuestRegistrationComponent implements OnInit {
  roomTypes = signal<RoomType[]>([]);
  hotelSettings = signal<HotelSettings | null>(null);
  submitting = signal(false);
  today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
    'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
    'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
    'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
    'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
    'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
    'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
    'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
    'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
    'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
    'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe'
  ];

  private fb = inject(FormBuilder);
  private guestSignatureData = '';
  private frontDeskSignatureData = '';

  guestInfoForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    middleName: [''],
    phoneNumber: [''],
    email: [''],
    country: ['Philippines'],
    vehiclePlateNo: [''],
    validIdPresented: [false],
  });

  reservationsForm = this.fb.group({
    reservations: this.fb.array([this.createReservationGroup()]),
  });

  policiesForm = this.fb.nonNullable.group({
    policyHousekeeping1: [false, Validators.requiredTrue],
    policyHousekeeping2: [false, Validators.requiredTrue],
    policySmoking: [false, Validators.requiredTrue],
    policyCorkage: [false, Validators.requiredTrue],
    policyNoPets: [false, Validators.requiredTrue],
    policyNegligence: [false, Validators.requiredTrue],
    policyMinors: [false, Validators.requiredTrue],
    policyParking: [false, Validators.requiredTrue],
    policySafe: [false, Validators.requiredTrue],
    policyForceMajeure: [false, Validators.requiredTrue],
    policyDataPrivacy: [false, Validators.requiredTrue],
  });

  signatureForm = this.fb.nonNullable.group({
    guestPrintedName: ['', Validators.required],
    processedByName: [''],
    remarks: [''],
  });

  private guestService = inject(GuestService);
  private roomTypeService = inject(RoomTypeService);
  private hotelSettingsService = inject(HotelSettingsService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  @ViewChild('stepper') stepper!: MatStepper;

  constructor() {}

  ngOnInit(): void {
    try {
      // Load room types with error handling to prevent app instability
      this.roomTypeService.getActive()
        .pipe(
          catchError((error) => {
            console.error('Failed to load room types:', error);
            return of([]);
          })
        )
        .subscribe((types) => this.roomTypes.set(types));

      // Load hotel settings with error handling to prevent app instability
      this.hotelSettingsService.getSettings()
        .pipe(
          catchError((error) => {
            console.error('Failed to load hotel settings:', error);
            return of(null);
          })
        )
        .subscribe((settings) => {
          if (settings) this.hotelSettings.set(settings);
        });

      const user = this.authService.user();
      if (user) {
        this.signatureForm.patchValue({
          processedByName: `${user.firstName} ${user.lastName}`,
        });
      }

      // Check if data was passed from PDF Upload using window.history.state (safest approach)
      const state = (window as any).history.state || {};
      
      if (state?.['fromPdfUpload'] && state?.['preFilledData']) {
        const preFilledData = state['preFilledData'];
        
        // Auto-fill guest info form
        const guestInfo = {
          firstName: preFilledData.firstName || '',
          lastName: preFilledData.lastName || '',
          middleName: preFilledData.middleName || '',
          phoneNumber: preFilledData.phoneNumber || '',
          email: preFilledData.email || '',
          country: preFilledData.country || 'Philippines',
          vehiclePlateNo: preFilledData.vehiclePlateNo || '',
          validIdPresented: preFilledData.validIdPresented || false,
        };
        this.guestInfoForm.patchValue(guestInfo);

        // Auto-fill reservation form
        const firstReservation = {
          roomTypeId: preFilledData.roomType || '', 
          roomNumber: preFilledData.roomNumber || '',
          checkInDate: preFilledData.checkInDate ? new Date(preFilledData.checkInDate) : '',
          checkOutDate: preFilledData.checkOutDate ? new Date(preFilledData.checkOutDate) : '',
          checkInTime: preFilledData.checkInTime || '14:00',
          checkOutTime: preFilledData.checkOutTime || '11:00',
          accompanyingGuests: preFilledData.accompanyingGuests || [],
        };
        
        this.reservations.at(0).patchValue(firstReservation);
        
        // If there are accompanying guests, add them
        if (preFilledData.accompanyingGuests && preFilledData.accompanyingGuests.length > 0) {
          const aguestsForm = this.getAccompanyingGuests(0);
          preFilledData.accompanyingGuests.forEach((guest: any) => {
            aguestsForm.push(
              this.fb.group({
                firstName: [guest.firstName || '', Validators.required],
                lastName: [guest.lastName || '', Validators.required],
                middleName: [guest.middleName || ''],
                validIdPresented: [guest.validIdPresented || false],
                signature: [''],
              })
            );
          });
        }

        // Auto-check all policies (user can modify if needed)
        const allPoliciesTrue = {
          policyHousekeeping1: true,
          policyHousekeeping2: true,
          policySmoking: true,
          policyCorkage: true,
          policyNoPets: true,
          policyNegligence: true,
          policyMinors: true,
          policyParking: true,
          policySafe: true,
          policyForceMajeure: true,
          policyDataPrivacy: true,
        };
        this.policiesForm.patchValue(allPoliciesTrue);

        // Set guest printed name
        this.signatureForm.patchValue({
          guestPrintedName: `${preFilledData.firstName} ${preFilledData.lastName}`,
        });

        // Skip to Agreement & Signature step (step 1, index 1) - use safer setTimeout to ensure stepper is ready
        setTimeout(() => {
          if (this.stepper) {
            this.stepper.selectedIndex = 1; // Jump to Agreement & Signature step
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.snackBar.open('An error occurred during initialization', 'Close', { duration: 3000 });
    }
  }

  get reservations(): FormArray {
    return this.reservationsForm.get('reservations') as FormArray;
  }

  getAccompanyingGuests(reservationIndex: number): FormArray {
    return this.reservations.at(reservationIndex).get('accompanyingGuests') as FormArray;
  }

  navigateToPdfUpload(): void {
    this.router.navigate(['guest-registration/pdf-upload']);
  }

  createReservationGroup() {
    return this.fb.group({
      roomTypeId: ['', Validators.required],
      roomNumber: ['', Validators.required],
      checkInDate: ['', Validators.required],
      checkOutDate: [''],
      checkInTime: ['14:00'],
      checkOutTime: ['11:00'],
      accompanyingGuests: this.fb.array([]),
    });
  }

  addReservation(): void {
    this.reservations.push(this.createReservationGroup());
  }

  removeReservation(index: number): void {
    this.reservations.removeAt(index);
  }

  addAccompanyingGuest(reservationIndex: number): void {
    const guests = this.getAccompanyingGuests(reservationIndex);
    guests.push(
      this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        middleName: [''],
        validIdPresented: [false],
        signature: [''],
      })
    );
  }

  removeAccompanyingGuest(reservationIndex: number, guestIndex: number): void {
    this.getAccompanyingGuests(reservationIndex).removeAt(guestIndex);
  }

  onGuestSignature(data: string): void {
    this.guestSignatureData = data;
  }

  onFrontDeskSignature(data: string): void {
    this.frontDeskSignatureData = data;
  }

  isFormValid(): boolean {
    return (
      this.guestInfoForm.valid &&
      this.signatureForm.valid &&
      !!this.guestSignatureData &&
      !!this.frontDeskSignatureData
    );
  }

  private generateReservationNumber(): string {
    // YYYYMMDD (8 digits) + random 5 digits = 13 digits
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // "20260413"
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0'); // "12345"
    return `${date}${random}`; // "2026041312345"
  }

  allPoliciesChecked(): boolean {
    const policies = this.policiesForm.get('policySmoking')?.value &&
      this.policiesForm.get('policyCorkage')?.value &&
      this.policiesForm.get('policyNoPets')?.value &&
      this.policiesForm.get('policyNegligence')?.value &&
      this.policiesForm.get('policyMinors')?.value &&
      this.policiesForm.get('policyParking')?.value &&
      this.policiesForm.get('policySafe')?.value &&
      this.policiesForm.get('policyForceMajeure')?.value;
    return !!policies;
  }

  selectAllPolicies(event: any): void {
    const isChecked = event.checked;
    this.policiesForm.patchValue({
      policySmoking: isChecked,
      policyCorkage: isChecked,
      policyNoPets: isChecked,
      policyNegligence: isChecked,
      policyMinors: isChecked,
      policyParking: isChecked,
      policySafe: isChecked,
      policyForceMajeure: isChecked,
    });
  }

  getFullNameFromGuestInfo(): string {
    const { firstName, lastName, middleName } = this.guestInfoForm.getRawValue();
    return [firstName, middleName, lastName].filter(n => n).join(' ').trim();
  }

  populateGuestName(): void {
    const fullName = this.getFullNameFromGuestInfo();
    if (fullName) {
      this.signatureForm.patchValue({ guestPrintedName: fullName });
    }
  }

  onStepChange(event: any): void {
    // Step 3 is the Agreement & Signature step (0-indexed)
    if (event.selectedIndex === 3 && !this.signatureForm.get('guestPrintedName')?.value) {
      this.populateGuestName();
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.submitting.set(true);

    const guestInfo = this.guestInfoForm.getRawValue();
    const reservations = this.reservations.getRawValue().map((r: any) => ({
      ...r,
      reservationNumber: this.generateReservationNumber(),
      checkInDate: this.formatDate(r.checkInDate),
      checkOutDate: r.checkOutDate ? this.formatDate(r.checkOutDate) : undefined,
    }));
    const policies = this.policiesForm.getRawValue();
    const signature = this.signatureForm.getRawValue();

    const payload = {
      ...guestInfo,
      reservations,
      agreement: {
        ...policies,
        guestPrintedName: signature.guestPrintedName,
        guestSignature: this.guestSignatureData,
        signatureDate: this.formatDate(new Date()),
        processedByName: signature.processedByName,
        processedBySignature: this.frontDeskSignatureData,
        remarks: signature.remarks || undefined,
      },
    };

    this.guestService.register(payload).subscribe({
      next: (guest) => {
        this.submitting.set(false);
        this.snackBar.open('Guest registered successfully!', 'Close', { duration: 3000 });
        
        // Generate PDF with all registration data
        this.generateRegistrationPDF(payload, guest.id);
        
        // Navigate after small delay to allow PDF generation
        setTimeout(() => {
          this.router.navigate(['/registration', guest.id]);
        }, 500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message ?? 'Registration failed', 'Close', { duration: 5000 });
      },
    });
  }

  private generateRegistrationPDF(data: any, guestId: string): void {
    try {
      const timestamp = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '-');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
            <h1 style="margin: 0; color: #C41E3A;">KEKEHYU HOTEL</h1>
            <p style="margin: 5px 0; color: #666;">Guest Registration Form</p>
            <p style="margin: 5px 0; font-size: 12px; color: #999;">Registration ID: ${guestId}</p>
          </div>

          <!-- Guest Information -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #1a1a2e; border-bottom: 1px solid #C41E3A; padding-bottom: 8px;">Guest Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding: 8px 0;"><strong>First Name:</strong> ${data.firstName}</td>
                <td style="width: 50%; padding: 8px 0;"><strong>Last Name:</strong> ${data.lastName}</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 8px 0;"><strong>Email:</strong> ${data.email}</td>
                <td style="width: 50%; padding: 8px 0;"><strong>Phone:</strong> ${data.phoneNumber}</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 8px 0;"><strong>Country:</strong> ${data.country}</td>
                <td style="width: 50%; padding: 8px 0;"><strong>Vehicle Plate:</strong> ${data.vehiclePlateNo}</td>
              </tr>
            </table>
          </div>

          <!-- Room Reservations -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #1a1a2e; border-bottom: 1px solid #C41E3A; padding-bottom: 8px;">Room Details</h3>
            ${data.reservations.map((res: any, idx: number) => `
              <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Room ${idx + 1}</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Room Number:</strong> ${res.roomNumber}</td>
                    <td style="padding: 5px 0;"><strong>Check-in:</strong> ${res.checkInDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Room Type:</strong> ${res.roomTypeId}</td>
                    <td style="padding: 5px 0;"><strong>Check-out:</strong> ${res.checkOutDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Check-in Time:</strong> ${res.checkInTime}</td>
                    <td style="padding: 5px 0;"><strong>Check-out Time:</strong> ${res.checkOutTime}</td>
                  </tr>
                </table>
                ${res.accompanyingGuests && res.accompanyingGuests.length > 0 ? `
                  <p style="margin: 10px 0 5px 0; font-weight: bold; font-size: 13px;">Accompanying Guests:</p>
                  <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
                    ${res.accompanyingGuests.map((guest: any) => `
                      <li>${guest.firstName} ${guest.lastName}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Policies Accepted -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #1a1a2e; border-bottom: 1px solid #C41E3A; padding-bottom: 8px;">Policies & Agreement</h3>
            <div style="font-size: 13px;">
              <p><strong>✓ All Hotel Policies Acknowledged</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Smoking Policy: ${data.agreement.policySmoking ? 'Accepted' : 'Not Accepted'}</li>
                <li>Corkage Policy: ${data.agreement.policyCorkage ? 'Accepted' : 'Not Accepted'}</li>
                <li>No Pets Policy: ${data.agreement.policyNoPets ? 'Accepted' : 'Not Accepted'}</li>
                <li>Data Privacy Consent: ${data.agreement.policyDataPrivacy ? 'Accepted' : 'Not Accepted'}</li>
              </ul>
            </div>
          </div>

          <!-- Signatures & Front Desk -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #1a1a2e; border-bottom: 1px solid #C41E3A; padding-bottom: 8px;">Agreement & Signature</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding: 8px 0;"><strong>Guest Printed Name:</strong> ${data.agreement.guestPrintedName}</td>
                <td style="width: 50%; padding: 8px 0;"><strong>Date:</strong> ${data.agreement.signatureDate}</td>
              </tr>
              <tr>
                <td style="width: 50%; padding: 8px 0;"><strong>Processed By:</strong> ${data.agreement.processedByName}</td>
                <td style="width: 50%; padding: 8px 0;"><strong>Remarks:</strong> ${data.agreement.remarks || 'None'}</td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
            <p>Document Generated: ${new Date().toLocaleString()}</p>
            <p>This is an automatically generated registration confirmation.</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `Registration_${guestId}_${timestamp}.pdf`,
        image: { type: 'png' as const },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const }
      };

      html2pdf().set(opt).from(htmlContent).save();
      console.log('✅ Registration PDF generated and downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      this.snackBar.open('⚠️ PDF generation failed', 'Close', { duration: 3000 });
    }
  }

  private formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private resetForm(): void {
    this.guestInfoForm.reset();
    this.reservationsForm.reset();
    this.policiesForm.reset();
    this.signatureForm.reset();
    this.guestSignatureData = '';
    this.frontDeskSignatureData = '';

    const user = this.authService.user();
    if (user) {
      this.signatureForm.patchValue({
        processedByName: `${user.firstName} ${user.lastName}`,
      });
    }

    while (this.reservations.length > 1) {
      this.reservations.removeAt(1);
    }
  }
}
