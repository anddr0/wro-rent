// The rules of booking, in one place: change a number here and both the
// calendar in the mini app and the checks on the server follow.
// Hours are Warsaw time.
export const BOOKING_RULES = {
  // Start times go every 30 minutes: 9:00, 9:30, 10:00…
  timeStepMinutes: 30,
  // The first and the last start time of a day: 9:00 and 20:00.
  firstStartHour: 9,
  lastStartHour: 20,
  // A rental can't start sooner than in an hour: the admin needs time to answer.
  minHoursBeforeStart: 1,
  // …and not later than in 30 days.
  maxDaysAhead: 30,
  // Requests and rentals one customer can have at once (pending, confirmed, active).
  maxOpenBookingsPerCustomer: 3,
  // The longest comment a customer can leave, in characters.
  maxCommentLength: 500,
};
