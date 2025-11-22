<script lang="ts">
  import type {
    ParsedCourse,
    HustSemester,
    StudentProfile,
  } from "../types/hust";
  import CrxLogo from "@/assets/logo.png";
  import { onMount } from "svelte";
  import {
    Loader2,
    ScanSearch,
    AlertCircle,
    User,
    Clock,
    MapPin,
    Download,
    CheckCircle2,
    Calendar as CalendarIcon,
    GraduationCap,
    TrendingUp,
    ChevronRight,
    Award,
    BookOpen,
  } from "@lucide/svelte";
  import { generateICS, downloadICS } from "../utils/ics_generator";
  import { getPeriodRange } from "../utils/time_converter";

  // Active tab: 'calendar', 'profile', 'results'
  let activeTab = $state<"calendar" | "profile" | "results">("calendar");

  // Course data
  let courses: ParsedCourse[] = $state([]);
  let loading = $state(false);
  let error = $state("");

  // Student profile
  let semester = $state("");
  let studentId = $state("");
  let fullName = $state("");
  let isProfileLoading = $state(false);
  let authFailed = $state(false);

  // Semesters
  let semesters: HustSemester[] = $state([]);
  let isSemestersLoading = $state(false);
  let currentSemesterData: HustSemester | null = $state(null);

  // Export state
  let isSyncing = $state(false);
  let syncSuccess = $state(false);

  // Vietnamese day names
  const dayNames: Record<number, string> = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };

  onMount(() => {
    fetchProfile();
    fetchSemesters();
  });

  function fetchProfile() {
    isProfileLoading = true;
    authFailed = false;
    console.log("[Popup] Fetching profile...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url?.includes("hust.edu.vn")) {
        isProfileLoading = false;
        authFailed = true;
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "FETCH_PROFILE" },
        (response) => {
          isProfileLoading = false;
          if (response && response.success && response.data) {
            studentId = response.data.studentId;
            fullName = response.data.fullName;
            authFailed = false;
          } else {
            authFailed = true;
          }
        },
      );
    });
  }

  function fetchSemesters() {
    isSemestersLoading = true;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url?.includes("hust.edu.vn")) {
        isSemestersLoading = false;
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "FETCH_SEMESTERS" },
        (response) => {
          isSemestersLoading = false;
          if (response && response.success && response.data) {
            semesters = response.data;
            const currentSemester = semesters.find((s) => s.isCurrentForClass);
            if (currentSemester) {
              semester = currentSemester.semester;
              currentSemesterData = currentSemester;
            } else if (semesters.length > 0) {
              semester = semesters[0].semester;
              currentSemesterData = semesters[0];
            }
          }
        },
      );
    });
  }

  function fetchSchedule() {
    if (!semester || !studentId) {
      error = "Vui lòng nhập đầy đủ thông tin học kỳ và mã sinh viên.";
      return;
    }

    loading = true;
    error = "";
    courses = [];
    syncSuccess = false;

    const selectedSemester = semesters.find((s) => s.semester === semester);
    if (selectedSemester) {
      currentSemesterData = selectedSemester;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        error = "Không tìm thấy tab đang hoạt động.";
        loading = false;
        return;
      }

      if (!tab.url?.includes("hust.edu.vn")) {
        error = "Vui lòng truy cập trang web QLĐT của HUST.";
        loading = false;
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "FETCH_SCHEDULE",
          semester: semester,
          studentId: studentId,
        },
        (response) => {
          loading = false;

          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            error = "Không thể kết nối. Thử làm mới trang.";
            return;
          }

          if (response && response.success) {
            courses = response.data;
          } else {
            error = response?.error || "Đã xảy ra lỗi không xác định.";
          }
        },
      );
    });
  }

  function exportToCalendar() {
    if (courses.length === 0) {
      error = "Không có môn học để xuất. Vui lòng quét lịch học trước.";
      return;
    }

    if (!currentSemesterData) {
      error = "Không có dữ liệu học kỳ. Thử làm mới trang.";
      return;
    }

    try {
      isSyncing = true;
      error = "";
      syncSuccess = false;

      const icsContent = generateICS(courses, currentSemesterData);
      const filename = `${studentId}_${semester}.ics`;
      downloadICS(icsContent, filename);

      isSyncing = false;
      syncSuccess = true;

      setTimeout(() => {
        syncSuccess = false;
      }, 3000);
    } catch (err) {
      isSyncing = false;
      error = `Không thể xuất lịch: ${err instanceof Error ? err.message : "Lỗi không xác định"}`;
      console.error("[Popup] Export error:", err);
    }
  }

  // Format semester display
  function formatSemester(sem: string): string {
    if (!sem) return "";
    const year = sem.substring(0, 4);
    const term = sem.substring(4);
    return `HK${term} (${year}-${parseInt(year) + 1})`;
  }

  // Get warning level color
  function getWarningLevelColor(level: number): string {
    if (level === 0) return "text-green-600 bg-green-50";
    if (level === 1) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  }

  function getWarningLevelText(level: number): string {
    if (level === 0) return "Bình thường";
    if (level === 1) return "Cảnh báo học vụ";
    return "Nguy cơ bị đình chỉ";
  }
</script>

<main
  class="w-[400px] min-h-[500px] max-h-[600px] bg-gray-50 text-gray-900 font-sans flex flex-col overflow-y-auto"
>
  <!-- Header -->
  <header class="bg-red-600 px-5 py-4 shadow-md sticky top-0 z-10 text-white">
    <div class="flex items-center gap-3">
      <img src={CrxLogo} alt="Logo" class="h-10" />
      <div class="flex-1 min-w-0">
        {#if fullName}
          <h1 class="font-bold text-base truncate leading-tight">
            {fullName}
          </h1>
          <div class="flex items-center gap-2 text-xs text-red-100 mt-0.5">
            <span>{studentId}</span>
            {#if semester}
              <span>•</span>
              <span>{formatSemester(semester)}</span>
            {/if}
          </div>
        {:else}
          <h1 class="font-bold text-lg leading-none tracking-tight">
            HUST Assistant
          </h1>
          <p class="text-xs text-red-100 font-medium mt-1">Trợ lý sinh viên</p>
        {/if}
      </div>
    </div>
  </header>

  <div class="flex-1">
    <!-- Auth Error -->
    {#if authFailed}
      <div class="p-6">
        <div
          class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3"
        >
          <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold">Không thể chạy tiện ích</p>
            <p class="text-xs mt-1 text-red-500">
              Vui lòng truy cập trang QLĐT của HUST và đăng nhập.
            </p>
          </div>
        </div>
      </div>
    {:else}
      <!-- Calendar View -->
      <div class="p-5 space-y-5">
        <!-- Scan Button -->
        {#if isProfileLoading || isSemestersLoading}
          <div class="flex items-center justify-center py-8 text-gray-400">
            <Loader2 class="animate-spin h-6 w-6 mr-2" />
            <span class="text-sm font-medium">Đang tải thông tin...</span>
          </div>
        {:else}
          <button
            onclick={fetchSchedule}
            disabled={loading || !studentId || !semester}
            class="w-full bg-red-600 text-white py-4 px-6 rounded-2xl hover:from-red-700 hover:to-red-800 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 font-bold transition-all shadow-lg shadow-red-600/30 flex justify-center items-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {#if loading}
              <Loader2 class="animate-spin h-5 w-5 text-white" />
              <span>Đang quét lịch học...</span>
            {:else}
              <ScanSearch size={20} />
              <span>Quét Lịch Học</span>
            {/if}
          </button>
        {/if}

        <!-- Error Message -->
        {#if error}
          <div
            class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
            <span class="font-medium">{error}</span>
          </div>
        {/if}

        <!-- Success Message -->
        {#if syncSuccess}
          <div
            class="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-start gap-3 animate-in fade-in"
          >
            <CheckCircle2 class="h-5 w-5 shrink-0 mt-0.5" />
            <span class="font-medium"
              >Đã xuất file lịch! Import vào ứng dụng lịch của bạn.</span
            >
          </div>
        {/if}

        <!-- Schedule Results -->
        {#if courses.length > 0}
          <div class="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div class="flex justify-between items-center">
              <h2
                class="font-bold text-gray-800 text-lg flex items-center gap-2"
              >
                <CalendarIcon size={20} class="text-red-600" />
                <span>{courses.length} môn học</span>
              </h2>
              <button
                onclick={exportToCalendar}
                disabled={isSyncing}
                class="text-xs bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 font-semibold shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {#if isSyncing}
                  <Loader2 class="animate-spin h-3.5 w-3.5" />
                  <span>Đang xuất...</span>
                {:else}
                  <Download size={14} />
                  <span>Xuất file ICS</span>
                {/if}
              </button>
            </div>

            <div class="space-y-2 pb-4">
              {#each courses as course}
                <div
                  class="bg-white p-3 rounded-xl border border-gray-200 hover:border-red-300 transition-all"
                >
                  <!-- Course Header -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 text-sm leading-tight">
                        {course.name}
                      </h3>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-red-600 font-semibold">
                          {course.code}
                        </span>
                        {#if course.teachers.length > 0}
                          <span class="text-xs text-gray-500">
                            • {course.teachers[0]}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>

                  <!-- Schedule List -->
                  <div class="space-y-1.5 text-xs">
                    {#each course.schedules as sched}
                      <div
                        class="flex items-center gap-2 text-gray-700 bg-gray-50 px-2 py-1.5 rounded-lg"
                      >
                        <span class="font-bold text-red-600 min-w-[50px]">
                          {dayNames[sched.day]}
                        </span>
                        <Clock size={12} class="text-gray-400" />
                        <span class="font-medium">
                          {(() => {
                            const timeRange = getPeriodRange(
                              sched.startPeriod,
                              sched.endPeriod,
                            );
                            return `${timeRange.start}-${timeRange.end}`;
                          })()}
                        </span>
                        <MapPin size={12} class="text-gray-400 ml-auto" />
                        <span class="font-medium">{sched.room}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if !loading && !error}
          <div
            class="flex-1 flex flex-col items-center justify-center text-gray-400 text-center py-12"
          >
            <div
              class="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full mb-4"
            >
              <CalendarIcon size={40} class="text-gray-300" />
            </div>
            <p class="text-sm font-semibold text-gray-500">
              Sẵn sàng quét lịch học
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Nhấn "Quét Lịch Học" để bắt đầu
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 20px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: #d1d5db;
  }

  /* Smooth transitions */
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-in-from-bottom-4 {
    from {
      transform: translateY(1rem);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-in {
    animation: fade-in 0.3s ease-out;
  }

  .fade-in {
    animation: fade-in 0.3s ease-out;
  }

  .slide-in-from-bottom-4 {
    animation: slide-in-from-bottom-4 0.5s ease-out;
  }
</style>
