/**
 * Time conversion utilities for HUST class schedule.
 * Converts HUST period numbers to actual start/end times.
 */

export interface PeriodTime {
    start: string; // HH:mm format
    end: string;   // HH:mm format
}

/**
 * HUST class period schedule mapping.
 * Based on official HUST timetable with 45-minute periods.
 */
const PERIOD_TIMES: Record<number, PeriodTime> = {
    // Morning shift
    1: { start: '06:45', end: '07:30' },
    2: { start: '07:30', end: '08:15' },
    3: { start: '08:25', end: '09:10' },  // 10 min break
    4: { start: '09:20', end: '10:05' },  // 10 min break
    5: { start: '10:15', end: '11:00' },  // 10 min break
    6: { start: '11:00', end: '11:45' },

    // Afternoon shift
    7: { start: '12:30', end: '13:15' },
    8: { start: '13:15', end: '14:00' },
    9: { start: '14:10', end: '14:55' },   // 10 min break
    10: { start: '15:05', end: '15:50' },  // 10 min break
    11: { start: '16:00', end: '16:45' },  // 10 min break
    12: { start: '16:45', end: '17:30' },

    // Evening shift
    13: { start: '17:45', end: '18:30' },
    14: { start: '18:30', end: '19:15' },
};

/**
 * Converts a 4-digit time number to HH:mm format.
 * @param timeNumber 4-digit time in HHMM format (e.g., 1300 for 13:00)
 * @returns Time string in HH:mm format
 */
function parseCustomTime(timeNumber: number): string {
    const timeStr = String(timeNumber).padStart(4, '0');
    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(2, 4);
    return `${hours}:${minutes}`;
}

/**
 * Checks if a period number is a custom time (4-digit format).
 * Custom times are >= 100 (representing HHMM format like 1300 for 13:00).
 * @param period Period number or custom time
 * @returns True if it's a custom time
 */
function isCustomTime(period: number): boolean {
    return period >= 100;
}

/**
 * Gets the start and end time for a given HUST period.
 * Supports both standard period numbers (1-14) and custom time format (4-digit HHMM).
 * @param period Period number (1-14) or custom time (e.g., 1300 for 13:00)
 * @returns Object with start and end times in HH:mm format
 */
export function getPeriodTime(period: number): PeriodTime {
    // Handle custom time format (4-digit HHMM like 1300)
    if (isCustomTime(period)) {
        const time = parseCustomTime(period);
        // For custom times, start and end are the same
        // The actual range will be determined by startPeriod and endPeriod
        return { start: time, end: time };
    }

    // Handle standard period numbers (1-14)
    const time = PERIOD_TIMES[period];
    if (!time) {
        throw new Error(`Invalid period number: ${period}. Valid range is 1-14.`);
    }
    return time;
}

/**
 * Gets the time range for a class spanning multiple periods.
 * Supports both standard period numbers (1-14) and custom time format (4-digit HHMM).
 * @param startPeriod Starting period number or custom start time
 * @param endPeriod Ending period number or custom end time
 * @returns Object with overall start and end times
 */
export function getPeriodRange(startPeriod: number, endPeriod: number): PeriodTime {
    const start = getPeriodTime(startPeriod);
    const end = getPeriodTime(endPeriod);
    return {
        start: start.start,
        end: end.end
    };
}

/**
 * Converts HUST day number to ISO day of week.
 * HUST: 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday, 8=Sunday
 * ISO: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
 * @param hustDay HUST day number (2-8)
 * @returns ISO day of week (1-7)
 */
export function convertToISODay(hustDay: number): number {
    if (hustDay < 2 || hustDay > 8) {
        throw new Error(`Invalid HUST day: ${hustDay}. Valid range is 2-8.`);
    }
    return hustDay - 1;
}

/**
 * Gets the day name from HUST day number.
 * @param hustDay HUST day number (2-8)
 * @returns Day name in English
 */
export function getDayName(hustDay: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const isoDay = convertToISODay(hustDay);
    return days[isoDay - 1];
}

/**
 * Calculates all event dates for a class based on semester start date and week numbers.
 * @param semesterStartTimestamp Semester start date as Unix timestamp (milliseconds)
 * @param weeks Array of week numbers when the class occurs
 * @param hustDay HUST day of week (2-8)
 * @returns Array of Date objects for each class occurrence
 */
export function calculateEventDates(
    semesterStartTimestamp: number,
    weeks: number[],
    hustDay: number
): Date[] {
    const dates: Date[] = [];
    const semesterStart = new Date(semesterStartTimestamp);
    const isoDay = convertToISODay(hustDay);

    // Find the first occurrence of the target day in the semester
    const firstDayOfSemester = semesterStart.getDay() || 7; // Convert Sunday=0 to 7
    let daysUntilTarget = isoDay - firstDayOfSemester;
    if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
    }

    // Get the date of the first target day (this is week 1, day X)
    const firstTargetDay = new Date(semesterStart);
    firstTargetDay.setDate(semesterStart.getDate() + daysUntilTarget);

    // Generate dates for each week
    for (const week of weeks) {
        const eventDate = new Date(firstTargetDay);
        // Add (week - 1) weeks to get to the correct week
        eventDate.setDate(firstTargetDay.getDate() + (week - 1) * 7);
        dates.push(eventDate);
    }

    return dates;
}

/**
 * Combines a date with a time string to create a full datetime.
 * @param date The date
 * @param timeString Time in HH:mm format
 * @returns Date object with combined date and time
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}
