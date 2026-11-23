export type BookingLinkInput = {
  readonly specialistId: string;
  readonly businessId: string;
};

export interface CalendarProvider {
  createBookingLink(input: BookingLinkInput): Promise<string>;
}
