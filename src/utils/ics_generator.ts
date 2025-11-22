import type { ParsedCourse, HustSemester } from '../types/hust';
import { getPeriodRange, calculateEventDates, combineDateAndTime } from './time_converter';

/**
 * Generates an iCalendar (.ics) file content from HUST course schedule.
 * Follows RFC 5545 specification.
 */

/**
 * Formats a Date object to iCalendar datetime format (YYYYMMDDTHHMMSS).
 * @param date The date to format
 * @returns Formatted datetime string
 */
function formatICalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generates a unique ID for an event.
 * @param courseCode Course code
 * @param date Event date
 * @returns Unique event ID
 */
function generateEventUID(courseCode: string, date: Date): string {
    const timestamp = date.getTime();
    return `${courseCode}-${timestamp}@hust-assistant`;
}

/**
 * Escapes special characters in iCalendar text fields.
 * @param text Text to escape
 * @returns Escaped text
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Generates a VEVENT entry for a single class occurrence.
 */
function generateVEvent(
    course: ParsedCourse,
    schedule: { day: number; startPeriod: number; endPeriod: number; room: string; weeks: number[] },
    eventDate: Date
): string {
    const { start, end } = getPeriodRange(schedule.startPeriod, schedule.endPeriod);

    const startDateTime = combineDateAndTime(eventDate, start);
    const endDateTime = combineDateAndTime(eventDate, end);

    const uid = generateEventUID(course.code, startDateTime);
    const now = new Date();

    // Build event description with course details
    const descriptionParts = [
        `Course Code: ${course.code}`,
        `Class ID: ${course.classId}`,
        `Type: ${course.classType}`,
        `Credits: ${course.credits}`,
    ];

    if (course.teachers.length > 0) {
        descriptionParts.push(`Teachers: ${course.teachers.join(', ')}`);
    }

    const description = escapeICalText(descriptionParts.join('\\n'));
    const summary = escapeICalText(`${course.name} (${course.code})`);
    const location = escapeICalText(schedule.room);

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatICalDateTime(now)}`,
        `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatICalDateTime(startDateTime)}`,
        `DTEND;TZID=Asia/Ho_Chi_Minh:${formatICalDateTime(endDateTime)}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        // Add a 15-minute reminder
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${summary}`,
        'TRIGGER:-PT15M',
        'END:VALARM',
        'END:VEVENT'
    ].join('\r\n');
}

/**
 * Generates a complete iCalendar file content from courses and semester data.
 * @param courses Array of parsed courses
 * @param semester Semester data containing start date
 * @returns Complete .ics file content as string
 */
export function generateICS(courses: ParsedCourse[], semester: HustSemester): string {
    const events: string[] = [];

    // Generate all events
    for (const course of courses) {
        for (const schedule of course.schedules) {
            // Calculate all dates this class occurs
            const eventDates = calculateEventDates(
                semester.startDate,
                schedule.weeks,
                schedule.day
            );

            // Create a VEVENT for each occurrence
            for (const date of eventDates) {
                events.push(generateVEvent(course, schedule, date));
            }
        }
    }

    // Define Vietnam timezone (GMT+7)
    const vtimezone = [
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Ho_Chi_Minh',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0700',
        'TZOFFSETTO:+0700',
        'TZNAME:+07',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n');

    // Build the complete iCalendar file
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//HUST Assistant//Schedule Exporter//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:HUST Schedule ${semester.semester}`,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
        'X-WR-CALDESC:Class schedule exported from HUST e.hust.edu.vn',
        vtimezone,
        ...events,
        'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
}

/**
 * Triggers a browser download of the ICS file.
 * @param content ICS file content
 * @param filename Filename for the download
 */
export function downloadICS(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    }, () => {
        // Cleanup after download starts
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    });
}
