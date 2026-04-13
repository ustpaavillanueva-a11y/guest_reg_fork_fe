import { Component, signal, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
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
          <mat-icon class="header-icon">hotel</mat-icon>
          <div>
            <h1>Guest Registration</h1>
            <p>{{ today }}</p>
          </div>
        </div>
      </div>

      <mat-stepper linear #stepper class="reg-stepper" (selectionChange)="onStepChange($event)">
        <!-- ============ STEP 1: Guest Information ============ -->
        <mat-step [stepControl]="guestInfoForm" label="Guest Information">
          <form [formGroup]="guestInfoForm" class="step-content">
            <mat-card class="form-card">
              <mat-card-content>
                <div class="section-title">
                  <mat-icon>person</mat-icon>
                  <h3>Personal Details</h3>
                </div>

                <div class="form-row three-col">
                  <mat-form-field appearance="outline">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName" placeholder="Juan" />
                    <mat-icon matPrefix>badge</mat-icon>
                    @if (guestInfoForm.get('firstName')?.hasError('required') && guestInfoForm.get('firstName')?.touched) {
                      <mat-error>First name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName" placeholder="Dela Cruz" />
                    @if (guestInfoForm.get('lastName')?.hasError('required') && guestInfoForm.get('lastName')?.touched) {
                      <mat-error>Last name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Middle Name</mat-label>
                    <input matInput formControlName="middleName" placeholder="(Optional)" />
                  </mat-form-field>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phoneNumber" placeholder="0917 826 8950" />
                    <mat-icon matPrefix>phone</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email Address</mat-label>
                    <input matInput formControlName="email" type="email" placeholder="guest@email.com" />
                    <mat-icon matPrefix>email</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Country / Nationality</mat-label>
                    <mat-select formControlName="country">
                      <mat-option value="">Select a country</mat-option>
                      @for (country of countries; track country) {
                        <mat-option [value]="country">{{ country }}</mat-option>
                      }
                    </mat-select>
                    <mat-icon matPrefix>public</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Vehicle Plate No.</mat-label>
                    <input matInput formControlName="vehiclePlateNo" placeholder="ABC 1234" />
                    <mat-icon matPrefix>directions_car</mat-icon>
                  </mat-form-field>
                </div>

                <div class="id-check">
                  <mat-checkbox formControlName="validIdPresented" color="primary">
                    <span class="checkbox-label">Valid ID Presented</span>
                  </mat-checkbox>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="step-nav">
              <span></span>
              <button mat-flat-button color="primary" matStepperNext [disabled]="guestInfoForm.invalid" class="nav-btn">
                Next: Room Details <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- ============ STEP 2: Room Reservations ============ -->
        <mat-step [stepControl]="reservationsForm" label="Room Details">
          <form [formGroup]="reservationsForm" class="step-content">
            <div formArrayName="reservations">
            @for (reservation of reservations.controls; track $index; let i = $index) {
              <mat-card class="form-card room-card">
                <mat-card-content>
                  <div class="section-title">
                    <mat-icon>meeting_room</mat-icon>
                    <h3>Room {{ i + 1 }}</h3>
                    <span class="spacer"></span>
                    @if (reservations.length > 1) {
                      <button mat-icon-button color="warn" (click)="removeReservation(i)" class="remove-btn">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>

                  <div [formGroupName]="i">
                    <div class="form-row two-col">
                      <mat-form-field appearance="outline">
                        <mat-label>Room Type</mat-label>
                        <mat-select formControlName="roomTypeId">
                          @for (rt of roomTypes(); track rt.id) {
                            <mat-option [value]="rt.id">{{ rt.name }}</mat-option>
                          }
                        </mat-select>
                        <mat-icon matPrefix>king_bed</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Room Number</mat-label>
                        <input matInput formControlName="roomNumber" />
                        <mat-icon matPrefix>door_front</mat-icon>
                      </mat-form-field>
                    </div>

                    <div class="form-row four-col">
                      <mat-form-field appearance="outline">
                        <mat-label>Check-in Date</mat-label>
                        <input matInput [matDatepicker]="checkinPicker" formControlName="checkInDate" />
                        <mat-datepicker-toggle matSuffix [for]="checkinPicker" />
                        <mat-datepicker #checkinPicker />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Check-in Time</mat-label>
                        <input matInput formControlName="checkInTime" type="time" />
                        <mat-icon matPrefix>schedule</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Check-out Date</mat-label>
                        <input matInput [matDatepicker]="checkoutPicker" formControlName="checkOutDate" />
                        <mat-datepicker-toggle matSuffix [for]="checkoutPicker" />
                        <mat-datepicker #checkoutPicker />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Check-out Time</mat-label>
                        <input matInput formControlName="checkOutTime" type="time" />
                        <mat-icon matPrefix>schedule</mat-icon>
                      </mat-form-field>
                    </div>

                    <!-- Accompanying Guests -->
                    <div class="companions-section">
                      <div class="section-title small">
                        <mat-icon>group</mat-icon>
                        <h4>Accompanying Guests</h4>
                      </div>

                      <div formArrayName="accompanyingGuests">
                        @for (ag of getAccompanyingGuests(i).controls; track $index; let j = $index) {
                          <div class="companion-row" [formGroupName]="j">
                            <span class="companion-num">{{ j + 1 }}</span>
                            <mat-form-field appearance="outline" class="companion-name">
                              <mat-label>First Name</mat-label>
                              <input matInput formControlName="firstName" />
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="companion-name">
                              <mat-label>Last Name</mat-label>
                              <input matInput formControlName="lastName" />
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="companion-middle">
                              <mat-label>M.I.</mat-label>
                              <input matInput formControlName="middleName" />
                            </mat-form-field>
                            <mat-checkbox formControlName="validIdPresented" color="primary">ID</mat-checkbox>
                            <button mat-icon-button color="warn" (click)="removeAccompanyingGuest(i, j)">
                              <mat-icon>remove_circle_outline</mat-icon>
                            </button>
                          </div>
                        }
                      </div>

                      <button mat-stroked-button type="button" (click)="addAccompanyingGuest(i)" class="add-companion-btn">
                        <mat-icon>person_add</mat-icon> Add Companion
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
            </div>

            <button mat-stroked-button color="primary" type="button" (click)="addReservation()" class="add-room-btn">
              <mat-icon>add_circle_outline</mat-icon> Add Another Room
            </button>

            <div class="step-nav">
              <button mat-button matStepperPrevious class="back-btn">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext class="nav-btn">
                Next: Policies <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- ============ STEP 3: Policies ============ -->
        <mat-step [stepControl]="policiesForm" label="Policies">
          <form [formGroup]="policiesForm" class="step-content">
            <!-- Housekeeping -->
            <mat-card class="form-card policy-card">
              <mat-card-content>
                <div class="section-title policy-title">
                  <mat-icon>cleaning_services</mat-icon>
                  <h3>Housekeeping Policy</h3>
                </div>
                <div class="policy-list">
                  <mat-checkbox formControlName="policyHousekeeping1" color="primary">
                    Make-up room service is upon request only.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyHousekeeping2" color="primary">
                    Housekeeping staff are not allowed to enter the room without guest consent.
                  </mat-checkbox>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Hotel Policies -->
            <mat-card class="form-card policy-card">
              <mat-card-content>
                <div class="section-title policy-title">
                  <mat-icon>gavel</mat-icon>
                  <h3>Hotel Policies</h3>
                </div>
                <p class="policy-subtitle">Please check each item to acknowledge.</p>
                <div class="select-all-box">
                  <mat-checkbox 
                    [checked]="allPoliciesChecked()" 
                    (change)="selectAllPolicies($event)"
                    color="primary"
                    class="select-all-checkbox">
                    <strong>Select All / Unselect All</strong>
                  </mat-checkbox>
                </div>
                <div class="policy-list">
                  <mat-checkbox formControlName="policySmoking" color="primary">
                    <strong>Smoking:</strong> Smoking inside rooms is strictly prohibited. A ₱5,000 smoking fee applies.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyCorkage" color="primary">
                    <strong>Corkage:</strong> A 30% corkage fee will be charged.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyNoPets" color="primary">
                    <strong>Pets:</strong> No pets are allowed inside the hotel premises.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyNegligence" color="primary">
                    <strong>Negligence:</strong> Guests shall be held liable for any damages caused by negligence.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyMinors" color="primary">
                    <strong>Minors:</strong> Must be accompanied by a responsible adult at all times.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyParking" color="primary">
                    <strong>Parking:</strong> Limited parking is available on a first-come, first-served basis.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policySafe" color="primary">
                    <strong>Valuables:</strong> Hotel is not liable for loss or theft. A digital safe is provided in the room.
                  </mat-checkbox>
                  <mat-checkbox formControlName="policyForceMajeure" color="primary">
                    <strong>Force Majeure:</strong> The hotel shall not be held responsible for events beyond its control.
                  </mat-checkbox>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Data Privacy -->
            <mat-card class="form-card policy-card">
              <mat-card-content>
                <div class="section-title policy-title">
                  <mat-icon>shield</mat-icon>
                  <h3>Data Privacy Consent</h3>
                </div>
                <div class="policy-list">
                  <mat-checkbox formControlName="policyDataPrivacy" color="primary">
                    I give my consent for the collection and processing of my personal data in accordance
                    with the Data Privacy Act of 2012 (RA 10173).
                  </mat-checkbox>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="step-nav">
              <button mat-button matStepperPrevious class="back-btn">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button color="primary" matStepperNext [disabled]="policiesForm.invalid" class="nav-btn">
                Next: Agreement & Signature <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- ============ STEP 4: Agreement & Signatures ============ -->
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
      gap: 16px;
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

    /* ============ Edit Icon ============ */
    .edit-icon {
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }
    .edit-icon:hover {
      color: #1a1a2e;
    }

    /* ============ Step Navigation ============ */
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

  constructor() {}

  ngOnInit(): void {
    this.roomTypeService.getActive().subscribe((types) => this.roomTypes.set(types));

    this.hotelSettingsService.getSettings().subscribe((settings) => {
      this.hotelSettings.set(settings);
    });

    const user = this.authService.user();
    if (user) {
      this.signatureForm.patchValue({
        processedByName: `${user.firstName} ${user.lastName}`,
      });
    }
  }

  get reservations(): FormArray {
    return this.reservationsForm.get('reservations') as FormArray;
  }

  getAccompanyingGuests(reservationIndex: number): FormArray {
    return this.reservations.at(reservationIndex).get('accompanyingGuests') as FormArray;
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
      this.policiesForm.valid &&
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
        this.router.navigate(['/registration', guest.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message ?? 'Registration failed', 'Close', { duration: 5000 });
      },
    });
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
