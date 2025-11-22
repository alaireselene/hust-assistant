import type { HustCourseResponse, ParsedCourse, ParsedSchedule, HustSessionResponse, HustSemester, StudentProfile } from '../types/hust';

/**
 * Fetches the timetable from the HUST API.
 * 
 * @param semester The semester ID (e.g., 20241). If not provided, tries to find it.
 * @param studentId The student ID. If not provided, tries to find it.
 */
export async function fetchTimetable(semester?: string, studentId?: string): Promise<ParsedCourse[]> {
    console.log('[HUST Assistant] Starting fetchTimetable...');

    // 1. Try to get credentials from LocalStorage if not provided
    if (!semester || !studentId) {
        try {
            // Fallback: Check URL params if we are on a page that has them
            const urlParams = new URLSearchParams(window.location.search);
            if (!semester) semester = urlParams.get('semester') || '20241';
            if (!studentId) studentId = urlParams.get('studentId') || '';
        } catch (e) {
            console.warn('[HUST Assistant] Error auto-detecting credentials:', e);
        }
    }

    // 2. Validate
    if (!semester || !studentId) {
        console.error('[HUST Assistant] Missing semester or studentId. Please provide them.');
        throw new Error('Missing semester or studentId');
    }

    console.log(`[HUST Assistant] Fetching for Student: ${studentId}, Semester: ${semester}`);

    // 3. Fetch
    const url = `https://student.hust.edu.vn/api/v2/timetables/student-timetable?semester=${semester}&studentId=${studentId}`;

    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: HustCourseResponse[] = await response.json();
        console.log('[HUST Assistant] Raw Data:', data);

        // 4. Parse
        const parsedCourses: ParsedCourse[] = data.map(item => {
            const teachers = item._teachers ? item._teachers.map(t => t.fullName) : [];

            const schedules: ParsedSchedule[] = (item._calendars || []).map(cal => {
                // Calculate actual period numbers based on dayTime
                // dayTime = 1: morning shift (no change)
                // dayTime = 2: afternoon shift (add 6 to period numbers)
                // Note: Custom times (>= 100, e.g. 1300 for 13:00) should NOT be offset
                const isCustomTime = cal.from >= 100;
                const periodOffset = (!isCustomTime && cal.dayTime === 2) ? 6 : 0;
                const actualStartPeriod = cal.from + periodOffset;
                const actualEndPeriod = cal.to + periodOffset;

                return {
                    day: cal.day,
                    startPeriod: actualStartPeriod,
                    endPeriod: actualEndPeriod,
                    room: cal.place,
                    weekString: cal.week,
                    weeks: cal.weeks
                };
            });

            return {
                name: item.courseName,
                code: item.courseId,
                classId: item.classId,
                classType: item.classType,
                credits: item.creditInfo,
                teachers,
                schedules
            };
        });

        console.log('[HUST Assistant] Parsed Courses:', parsedCourses);
        return parsedCourses;

    } catch (error) {
        console.error('[HUST Assistant] Fetch failed:', error);
        throw error;
    }
}

/**
 * Fetches the current student profile (ID and Name) from the session.
 */
export async function fetchStudentProfile(): Promise<{ studentId: string; fullName: string } | null> {
    console.log('[HUST Assistant] Fetching student profile...');
    const url = 'https://student.hust.edu.vn/api/v1/auth/session';
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('[HUST Assistant] Failed to fetch profile. Status:', response.status);
            return null;
        }

        const data: HustSessionResponse = await response.json();
        console.log('[HUST Assistant] Profile Data:', data);

        if (data && data.user) {
            return {
                studentId: data.user.studentId,
                fullName: data.user.fullName
            };
        }
        return null;

    } catch (error) {
        console.error('[HUST Assistant] Profile fetch error:', error);
        return null;
    }
}

/**
 * Fetches the list of semesters.
 */
export async function fetchSemesters(): Promise<HustSemester[]> {
    console.log('[HUST Assistant] Fetching semesters...');
    const url = 'https://student.hust.edu.vn/api/v1/semesters';
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('[HUST Assistant] Failed to fetch semesters. Status:', response.status);
            return [];
        }

        const data: HustSemester[] = await response.json();
        console.log('[HUST Assistant] Semesters Data:', data);
        return data;

    } catch (error) {
        console.error('[HUST Assistant] Semesters fetch error:', error);
        return [];
    }
}

/**
 * Fetches the complete student profile including academic results.
 */
export async function fetchFullStudentProfile(studentId: string): Promise<StudentProfile | null> {
    console.log('[HUST Assistant] Fetching full student profile...');
    const url = `https://student.hust.edu.vn/api/v1/students/${studentId}`;
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('[HUST Assistant] Failed to fetch full profile. Status:', response.status);
            return null;
        }

        const data: any = await response.json();
        console.log('[HUST Assistant] Full Profile Data:', data);

        if (data && data.studentId) {
            return {
                studentId: data.studentId,
                fullName: data.fullName,
                email: data.email,
                personalEmail: data.personalEmail || '',
                gender: data.gender,
                className: data.className || '',
                majorName: data.majorName || '',
                schoolName: data.schoolName || '',
                gpa: data.gpa || 0,
                cpa: data.cpa || 0,
                tpa: data.tpa || 0,
                totalCredit: data.totalCredit || 0,
                eduProgramName: data.eduProgramName || '',
                admissionYear: data.admissionYear || 0,
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                _academicResults: data._academicResults || []
            };
        }
        return null;

    } catch (error) {
        console.error('[HUST Assistant] Full profile fetch error:', error);
        return null;
    }
}
