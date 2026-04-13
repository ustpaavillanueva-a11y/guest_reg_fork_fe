import { User } from './user.model';
import { RoomType } from './room-type.model';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  validIdPresented: boolean;
  vehiclePlateNo?: string;
  createdAt: Date;
  updatedAt: Date;
  registeredById: string;
  registeredBy: User;
  reservations: Reservation[];
  agreement: GuestAgreement;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  roomNumber: string;
  roomType?: RoomType;
  checkInDate: Date;
  checkOutDate?: Date;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'checked_in' | 'checked_out' | 'cancelled';
  accompanyingGuests: AccompanyingGuest[];
}

export interface AccompanyingGuest {
  id: string;
  reservationId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  validIdPresented: boolean;
  signature?: string;
  createdAt: Date;
}

export interface GuestAgreement {
  id: string;
  policyHousekeeping1: boolean;
  policyHousekeeping2: boolean;
  policySmoking: boolean;
  policyCorkage: boolean;
  policyNoPets: boolean;
  policyNegligence: boolean;
  policyMinors: boolean;
  policyParking: boolean;
  policySafe: boolean;
  policyForceMajeure: boolean;
  policyDataPrivacy: boolean;
  guestPrintedName: string;
  guestSignature: string;
  signatureDate: Date;
  processedByName: string;
  processedBySignature: string;
  remarks?: string;
  pdfPath?: string;
}

export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  validIdPresented: boolean;
  vehiclePlateNo?: string;
  reservations: CreateReservationRequest[];
  agreement: CreateAgreementRequest;
}

export interface CreateReservationRequest {
  reservationNumber: string;
  roomNumber: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  accompanyingGuests: CreateAccompanyingGuestRequest[];
}

export interface CreateAccompanyingGuestRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  validIdPresented: boolean;
  signature?: string;
}

export interface CreateAgreementRequest {
  policyHousekeeping1: boolean;
  policyHousekeeping2: boolean;
  policySmoking: boolean;
  policyCorkage: boolean;
  policyNoPets: boolean;
  policyNegligence: boolean;
  policyMinors: boolean;
  policyParking: boolean;
  policySafe: boolean;
  policyForceMajeure: boolean;
  policyDataPrivacy: boolean;
  guestPrintedName: string;
  guestSignature: string;
  signatureDate: string;
  processedByName: string;
  processedBySignature: string;
  remarks?: string;
}

export type StatisticsPeriod = 'today' | 'week' | 'month' | 'year';

export interface GuestStatistics {
  totalGuests: number;
  totalReservations: number;
  byFrontDesk: {
    user: Pick<User, 'id' | 'firstName' | 'lastName'>;
    count: number;
  }[];
}
