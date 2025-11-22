export interface HustCalendarItem {
    id: number;
    place: string;
    week: string; // "2-9,11-19"
    day: number; // 2 = Monday, 3 = Tuesday, ...
    from: number; // Start period
    to: number; // End period
    dayTime: number; // 1 = morning (no offset), 2 = afternoon (+6 offset)
    weeks: number[]; // [2, 3, 4, ...]
    teacherName?: string;
    status: number;
}

export interface HustTeacher {
    id: number;
    fullName: string;
}

export interface HustCourseResponse {
    id: number;
    courseCode: string; // Mapped from courseId
    courseName: string;
    classId: string;
    classType: string; // "LT+BT", "TN", "DA"
    semester: string;
    creditInfo: string;
    notes: string;

    // Raw API fields
    courseId: string;
    _calendars: HustCalendarItem[];
    _teachers: HustTeacher[];
}

export interface HustSessionResponse {
    user: {
        studentId: string;
        fullName: string;
        email: string;
        gender: number;
    };
}

export interface HustSemester {
    id: string;
    semester: string; // e.g. "20241"
    isCurrentForClass: boolean;
    isCurrentForProject: boolean;
    startDate: number;
    endDate: number;
    // There are many more fields, but these are the essential ones
}

// Internal model for the extension
export interface ParsedCourse {
    name: string;
    code: string; // MI3080
    classId: string; // 163631
    classType: string;
    credits: string;
    teachers: string[];
    schedules: ParsedSchedule[];
}

export interface ParsedSchedule {
    day: number; // 2-8
    startPeriod: number;
    endPeriod: number;
    room: string;
    weekString: string;
    weeks: number[];
}

// Full student profile from API
export interface StudentProfile {
    studentId: string;
    fullName: string;
    email: string;
    personalEmail: string;
    gender: number;
    className: string;
    majorName: string;
    schoolName: string;
    gpa: number;
    cpa: number;
    tpa: number;
    totalCredit: number;
    eduProgramName: string;
    admissionYear: number;
    phoneNumber?: string;
    address?: string;
    _academicResults: AcademicResult[];
}

export interface AcademicResult {
    semester: string;
    gpa: number;
    cpa: number;
    tpa: number;
    cumulateCredit: number;
    registerCredit: number;
    warningLevel: number;
    status: number;
}
