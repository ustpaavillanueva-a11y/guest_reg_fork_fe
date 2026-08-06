export interface HotelSettings {
  id: string;
  hotelName: string;
  logoPath?: string;
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  smokingFee: number;
  corkageFeePercent: number;
  totalRooms: number;
  address?: string;
  contactNumber?: string;
  email?: string;
}

export interface PolicyTemplate {
  id: string;
  category: 'housekeeping' | 'hotel' | 'data_privacy';
  code: string;
  content: string;
  displayOrder: number;
  isActive: boolean;
}
