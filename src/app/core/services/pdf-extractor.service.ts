import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface ExtractedGuestData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  vehiclePlateNo?: string;
  validIdPresented: boolean;
  reservationNumber?: string;
  roomNumber?: string;
  roomType?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  accompanyingGuests?: Array<{
    firstName: string;
    lastName: string;
    validIdPresented: boolean;
  }>;
  errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class PdfExtractorService {
  private workerConfigured = false;

  constructor() {
    this.setupWorker();
  }

  private setupWorker(): void {
    if (this.workerConfigured || typeof window === 'undefined') return;

    try {
      // Point to local worker file in public/assets
      // PDF.js 4.x uses ES modules (.mjs extension)
      const workerUrl = '/assets/pdf.worker.min.mjs';
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;
      this.workerConfigured = true;
      console.log('PDF.js worker configured:', workerUrl);
    } catch (error) {
      console.error('Failed to setup PDF worker:', error);
    }
  }

  async extractGuestDataFromPdf(file: File): Promise<ExtractedGuestData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer
      }).promise;
      let fullText = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ');
      }

      return this.parseExtractedText(fullText);
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        firstName: '',
        lastName: '',
        validIdPresented: false,
        errors: [`Failed to extract PDF: ${error}`],
      };
    }
  }

  private parseExtractedText(text: string): ExtractedGuestData {
    // Debug: log the extracted text to see what we're working with
    console.log('=== PDF EXTRACTED TEXT ===');
    console.log(text);
    console.log('=== END PDF TEXT ===');
    
    const errors: string[] = [];
    const data: ExtractedGuestData = {
      firstName: '',
      lastName: '',
      validIdPresented: false,
      accompanyingGuests: [],
      errors: [],
    };

    try {
      // Extract Name - allow letters, spaces, hyphens, and other common characters in names
      const nameMatch = text.match(/Name\s+([A-Za-z\s\-\.\']+?)(?=\s*(?:Check in|Reservation|$))/i);
      if (nameMatch) {
        const fullName = nameMatch[1].trim();
        // Split by space or hyphen followed by space
        const nameParts = fullName.split(/[\s]+/).filter(part => part.length > 0);
        if (nameParts.length >= 2) {
          // If name contains hyphen like "Getz Pharma- Alex", handle it
          data.firstName = nameParts[0] || '';
          data.lastName = nameParts.slice(1).join(' ') || '';
        } else if (nameParts.length === 1) {
          data.firstName = nameParts[0] || '';
          data.lastName = '';
        }
      } else {
        errors.push('Could not extract name');
      }

      // Extract Reservation Number
      const resMatch = text.match(/Reservation Number\s+(\d+)/i);
      data.reservationNumber = resMatch ? resMatch[1].trim() : '';

      // Extract Phone - include + sign for international format
      const phoneMatch = text.match(/Phone Number\s+([\+\d\s\-]+)(?=\s*(?:VEHICLE|Check|Room|Email))/i);
      if (phoneMatch) {
        data.phoneNumber = phoneMatch[1].trim().replace(/\s+/g, '');
        console.log('Extracted Phone Number:', data.phoneNumber);
      } else {
        console.log('Phone Number not found in text');
      }

      // Extract Email - find guest email in guest info section, skip hotel email
      // Strategy: find all emails, filter out hotel's email, take the remaining one
      const allEmailsMatch = text.match(/([\w.-]+@[\w.-]+\.\w+)/gi);
      if (allEmailsMatch && allEmailsMatch.length > 0) {
        // Filter out the hotel's email
        const guestEmail = allEmailsMatch.find(email => !email.toLowerCase().includes('kekehyuhotel'));
        if (guestEmail) {
          data.email = guestEmail.trim();
        }
        // If only hotel email exists, leave email blank
      }

      // Extract Country - default to Philippines if not found
      const countryMatch = text.match(/Country\s+([A-Za-z\s]+?)(?=$|Check|Room|Philippines)/i);
      data.country = countryMatch ? countryMatch[1].trim() : 'Philippines';

      // Extract Vehicle Plate - be strict, only accept if it looks valid
      const vehicleMatch = text.match(/VEHICLE PLATE NO\.\s*:\s*([^\n\r]*)/i);
      if (vehicleMatch) {
        const vehicleText = vehicleMatch[1].trim();
        // Only set if it's not empty and doesn't contain policy text
        if (vehicleText && vehicleText.length < 20 && !vehicleText.toLowerCase().includes('policy')) {
          data.vehiclePlateNo = vehicleText;
        }
        // Otherwise leave it blank (empty string)
      }

      // Extract Check-in Date (format: DD/MM/YYYY -> ISO: YYYY-MM-DD)
      const checkInMatch = text.match(/Check in Date\s+(\d{1,2}[\s\/\-\.]+\d{1,2}[\s\/\-\.]+\d{4})/i);
      if (checkInMatch) {
        data.checkInDate = this.convertDateToISO(checkInMatch[1]);
      }

      // Extract Check-out Date
      const checkOutMatch = text.match(/Check out Date\s+(\d{1,2}[\s\/\-\.]+\d{1,2}[\s\/\-\.]+\d{4})/i);
      if (checkOutMatch) {
        data.checkOutDate = this.convertDateToISO(checkOutMatch[1]);
      }

      // Extract Check-in Time
      const checkInTimeMatch = text.match(/Check-in:\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      if (checkInTimeMatch) {
        data.checkInTime = this.convertTo24Hour(checkInTimeMatch[1]);
      } else {
        data.checkInTime = '14:00'; // Default
      }

      // Extract Check-out Time
      const checkOutTimeMatch = text.match(/Check-out:\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      if (checkOutTimeMatch) {
        data.checkOutTime = this.convertTo24Hour(checkOutTimeMatch[1]);
      } else {
        data.checkOutTime = '11:00'; // Default
      }

      // Extract Room Type - capture multiple room types (comma-separated)
      // The text format: "Room Type  JUNIOR EXECUTIVE (KING BED)...  Email"
      let roomTypeMatch = text.match(/Room\s*Type\s+([A-Z\s\(\)\-,0-9]+?)(?=\s*Email|\s*Room\s*Number|\s*Country)/i);
      
      if (!roomTypeMatch) {
        // Alternative: capture everything between "Room Type" and common following fields
        roomTypeMatch = text.match(/Room\s*Type\s+([\w\s\(\)\-,]+?)(?=\s+(?:Email|Room\s*Number|Country|Philippines|\d{3}))/i);
      }
      
      if (roomTypeMatch) {
        // Clean up the room type text: remove extra spaces, keep commas
        let roomTypeText = roomTypeMatch[1].trim();
        // Replace multiple spaces/newlines with single space
        roomTypeText = roomTypeText.replace(/\s+/g, ' ');
        // Remove trailing comma if exists
        roomTypeText = roomTypeText.replace(/,\s*$/, '');
        data.roomType = roomTypeText;
        console.log('Extracted Room Type:', data.roomType);
      } else {
        data.roomType = '';
        console.log('Room Type not found in text');
      }

      // Extract Room Number - capture multiple room numbers (comma-separated like "502, 506")
      const roomNumMatch = text.match(/Room\s*Number\s+([\d,\s]+)/i);
      if (roomNumMatch) {
        // Clean up room numbers: normalize spaces around commas
        let roomNumbers = roomNumMatch[1].trim();
        roomNumbers = roomNumbers.replace(/\s*,\s*/g, ', ');
        data.roomNumber = roomNumbers;
        console.log('Extracted Room Number:', data.roomNumber);
      } else {
        data.roomNumber = '';
        console.log('Room Number not found in text');
      }

      // Extract Valid ID Presented
      const validIdMatch = text.match(/Valid ID Presented:\s*[☐✓]?\s*Yes/i);
      data.validIdPresented = !!validIdMatch;

      // Extract Accompanying Guests (lines 1, 2, 3)
      const companionsMatch = text.match(/ACCOMPANYING[\s\S]*?Signature([\s\S]*?)Check-in:/i);
      if (companionsMatch) {
        const companionsText = companionsMatch[1];
        const namePattern = /\d+\.\s+([A-Za-z\s]+?)(?=☐|$)/gi;
        let match;
        while ((match = namePattern.exec(companionsText)) !== null) {
          const name = match[1].trim();
          if (name && name.length > 2) {
            const parts = name.split(/\s+/);
            data.accompanyingGuests!.push({
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' ') || '',
              validIdPresented: false,
            });
          }
        }
      }

      // If no accompanying guests extracted, set empty array
      if (!data.accompanyingGuests?.length) {
        data.accompanyingGuests = [];
      }

      // Validate required fields
      if (!data.firstName) errors.push('First name is required');
      if (!data.lastName) errors.push('Last name is required');
      if (!data.reservationNumber) errors.push('Reservation number could not be extracted');
      if (!data.roomNumber) errors.push('Room number could not be extracted');
      if (!data.checkInDate) errors.push('Check-in date could not be extracted');

      data.errors = errors;
    } catch (error) {
      data.errors = [`Error parsing PDF text: ${error}`];
    }

    return data;
  }

  private convertDateToISO(dateStr: string): string {
    // Handle DD/MM/YYYY format (common in PH) -> YYYY-MM-DD
    // Handle various separators: /, -, ., space
    const parts = dateStr.split(/[\s\/\-\.]+/).filter(p => p);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Pad day and month with leading zeros if needed
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    return dateStr; // Return as-is if format is unexpected
  }

  private convertTo24Hour(timeStr: string): string {
    // Convert "2:00 PM" to "14:00"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return '14:00';

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
}
