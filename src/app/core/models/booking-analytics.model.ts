import { StatisticsPeriod } from './guest.model';

export interface BookingAnalytics {
  period: StatisticsPeriod;
  totalReservations: number;
  cancelledReservations: number;
  cancellationRatePercent: number;
  avgLengthOfStayDays: number | null;
  occupancyRatePercent: number | null;
  totalRooms: number;
  peakDayOfWeek: { day: string; count: number }[];
  peakMonth: { month: string; count: number }[];
  forecast: BookingForecast | null;
}

export interface BookingForecast {
  months: string[];
  predicted: number[];
  historical: number[];
  historicalMonths: string[];
}
