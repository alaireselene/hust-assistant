# AGENTS.md - HUST Assistant (Trợ lý HUST)

## 🚀 Mission
Build a comprehensive Chrome Extension (Manifest V3) for HUST students to manage their academic life. Features include:
- **Quick Glance Calendar** (Lịch học): View and export class schedules to ICS format
- **Student Profile** (Hồ sơ): Display student information and enrollment details
- **Learning Results** (Kết quả học tập): Track academic performance with GPA, CPA, and semester-by-semester results

**All UI text and labels are in Vietnamese.**

## 🛠 Technology Stack
- **Core**: Chrome Extension Manifest V3
- **Styling**: TailwindCSS v4
- **Build Tool**: Svelte 5 + Vite (with `@crxjs/vite-plugin` for HMR)
- **Language**: Vietnamese for all user-facing text
- **Icons**: Lucide Svelte
- **APIs**: HUST Student Portal APIs (student.hust.edu.vn)

## 🏗 Architecture

### 1. Manifest V3 (`manifest.json`)
- **Permissions**:
  - `host_permissions`: To access `*.hust.edu.vn` domains
  - `storage`: To cache user preferences and data
- **Content Scripts**: Injected into `*.hust.edu.vn` to communicate with HUST APIs
- **Popup**: Main interface with tabbed navigation

### 2. Components

#### 🕷️ Content Script (API Communicator)
- **Target URL**: `*://*.hust.edu.vn/*`
- **Responsibility**:
  - Fetch student session data (ID, name, email)
  - Fetch class schedule from HUST API
  - Fetch complete student profile including academic results
  - Fetch semester information
  - Communicate data back to popup

#### 🎨 Popup UI (Main Interface)
- **Built with**: Svelte 5 + TailwindCSS v4
- **Language**: All Vietnamese
- **Structure**: Show calendar:
  - Display weekly class schedule in grid format
  - Show course details (name, code, time, room, instructor)
  - Export to ICS button for calendar import
  - Vietnamese day/time labels
  
 #### Side Panel
- **Built with**: Svelte 5 + TailwindCSS v4
- **Language**: All Vietnamese
- **Structure**: Show profile and learning results:
  - Student information (name, ID, class, major)
  - Current semester details
  - Enrolled courses list
  - Contact information
  - Overall GPA, CPA, TPA display
  - Total credits earned
  - Semester-by-semester academic results
  - Warning level indicators

## 🎨 UI/UX Guidelines
- **Language**: Vietnamese only for all user-facing text
- **Icons**: Use `lucide-svelte` for all icons
  ```svelte
  <script>
    import { Calendar } from 'lucide-svelte';
  </script>

  <Calendar size={20} />
  ```
- **Color Scheme**: HUST red (#DC143C) as primary color
- **Typography**: Inter font family for Vietnamese support
- **Design**: Modern, clean with glassmorphism effects and smooth animations

## 📝 Data Flow

### Calendar Export Flow
1. **User Action**: User navigates to "Lịch Học" tab
2. **Fetch**: Extension requests schedule data from HUST API via content script
3. **Display**: Schedule appears in weekly grid format with Vietnamese labels
4. **Export**: User clicks "Xuất file ICS" button
5. **Generate**: Extension generates ICS file with all class events
6. **Download**: ICS file downloads to user's computer
7. **Import**: User imports ICS into their preferred calendar app (Google Calendar, Apple Calendar, etc.)

### Profile View Flow
1. **Auto-fetch**: On popup open, fetch student session and full profile
2. **Display**: Show student info (name, ID, class, major) in "Hồ Sơ" tab
3. **Courses**: List all enrolled courses for current semester

### Learning Results Flow
1. **Fetch**: Retrieve complete student profile including `_academicResults` array
2. **Display**: Show overall GPA/CPA/TPA and total credits
3. **List**: Display semester-by-semester results in "Kết quả học tập" tab
4. **Highlight**: Use colors to indicate warning levels

## 🗓️ HUST API Endpoints

### 1. Session (Get Student ID & Name)
```
GET https://student.hust.edu.vn/api/v1/auth/session
Headers: Authorization: Bearer {accessToken from localStorage}
Response: { user: { studentId, fullName, email, gender } }
```

### 2. Semesters List
```
GET https://student.hust.edu.vn/api/v1/semesters
Response: Array of { id, semester, isCurrentForClass, startDate, endDate, ... }
```

### 3. Timetable
```
GET https://student.hust.edu.vn/api/v2/timetables/student-timetable?semester={semester}&studentId={studentId}
Response: Array of courses with _calendars and _teachers
```

### 4. Full Student Profile
```
GET https://student.hust.edu.vn/api/v1/students/{studentId}
Response: Complete profile with GPA, CPA, TPA, credits, class, major, _academicResults[]
```

## 🗓️ Time Conversion Logic
- **Period Mapping**: Period 1 starts at 06:45, each period is 45-50 mins
- **Afternoon Offset**: Add +6 to period numbers when `dayTime = 2` (afternoon shift)
- **Custom Times**: 4-digit times (e.g., 1300) are absolute times, not offset
- **Week Parsing**: Parse week strings like "20-30" or "1-5,7-9" into specific dates based on semester start date

## 🛡️ Security & Privacy
- **Authentication**: Uses existing HUST session (accessToken from localStorage)
- **Data Handling**: All processing happens locally in the browser
- **No External Servers**: No data sent to external services
- **ICS Export**: Calendar data exported as standard ICS format for local use

## 📂 Project Structure
```
/
├── src/
│   ├── assets/           # Logo and images
│   ├── content/          # Content scripts for HUST API communication
│   │   ├── api_parser.ts # API fetching logic
│   │   └── main.ts       # Content script entry
│   ├── popup/            # Main popup interface  
│   │   ├── App.svelte    # Tabbed UI (Lịch học, Hồ sơ, Kết quả)
│   │   ├── index.html
│   │   └── main.ts
│   ├── types/            # TypeScript interfaces
│   │   └── hust.ts       # HUST API type definitions
│   ├── utils/            # Utility functions
│   │   ├── ics_generator.ts  # ICS file generation
│   │   └── time_converter.ts # Period to time conversion
│   └── manifest.config.ts
├── package.json
├── svelte.config.js
├── vite.config.ts
└── AGENTS.md
```
