<script lang="ts">
    import { onMount } from "svelte";
    import {
        User,
        GraduationCap,
        BookOpen,
        Loader2,
        AlertCircle,
        Award,
        TrendingUp,
    } from "@lucide/svelte";
    import type { StudentProfile } from "../types/hust";

    import logo from "../assets/logo.png";

    let activeTab = $state<"profile" | "results">("profile");
    let loading = $state(false);
    let error = $state("");
    let profile = $state<StudentProfile | null>(null);
    let authFailed = $state(false);

    onMount(() => {
        fetchData();
    });

    function fetchData() {
        loading = true;
        error = "";
        authFailed = false;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.id || !tab.url?.includes("hust.edu.vn")) {
                loading = false;
                authFailed = true;
                return;
            }

            // First fetch basic profile to get ID
            chrome.tabs.sendMessage(
                tab.id,
                { action: "FETCH_PROFILE" },
                (response) => {
                    if (response && response.success && response.data) {
                        const studentId = response.data.studentId;
                        // Then fetch full profile
                        fetchFullProfile(tab.id!, studentId);
                    } else {
                        loading = false;
                        authFailed = true;
                    }
                },
            );
        });
    }

    function fetchFullProfile(tabId: number, studentId: string) {
        chrome.tabs.sendMessage(
            tabId,
            { action: "FETCH_FULL_PROFILE", studentId },
            (response) => {
                loading = false;
                if (response && response.success && response.data) {
                    if (response.data._academicResults) {
                        response.data._academicResults.sort(
                            (
                                a: { semester: string },
                                b: { semester: string },
                            ) => {
                                return b.semester.localeCompare(a.semester);
                            },
                        );
                    }
                    profile = response.data;
                } else {
                    error = "Không thể tải thông tin chi tiết.";
                }
            },
        );
    }

    function getWarningLevelColor(level: number): string {
        if (level === 0) return "text-green-600 bg-green-50";
        if (level === 1) return "text-yellow-600 bg-yellow-50";
        return "text-red-600 bg-red-50";
    }

    function getWarningLevelText(level: number): string {
        if (level === 0) return "Không";
        if (level === 1) return "Mức 1";
        return "Mức 2";
    }

    function formatSemester(sem: string): string {
        if (!sem) return "";
        const year = sem.substring(0, 4);
        const term = sem.substring(4);
        return `HK${term} (${year}-${parseInt(year) + 1})`;
    }
</script>

<main class="h-screen bg-gray-50 flex flex-col font-sans">
    <!-- Header -->
    <header
        class="bg-red-600 text-white p-4 shadow-md sticky top-0 z-20 flex items-center justify-between"
    >
        <div class="flex items-center gap-3">
            <div class="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <img
                    src={logo}
                    alt="HUST Assistant"
                    class="w-8 h-8 object-contain"
                />
            </div>
            <div>
                <h1 class="font-bold text-lg leading-tight">Trợ lý HUST</h1>
                <p class="text-xs text-red-100 font-medium">
                    Bản nhái app eHUST.
                </p>
            </div>
        </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto bg-white">
        {#if authFailed}
            <div
                class="p-4 text-red-600 flex items-start gap-3 bg-red-50 m-4 rounded-lg"
            >
                <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <p class="font-semibold">Không thể kết nối</p>
                    <p class="text-sm mt-1">
                        Vui lòng truy cập trang QLĐT của HUST và đăng nhập để
                        xem thông tin.
                    </p>
                </div>
            </div>
        {:else if loading}
            <div
                class="flex flex-col items-center justify-center py-12 text-gray-500"
            >
                <Loader2 class="h-8 w-8 animate-spin mb-2 text-red-600" />
                <p>Đang tải dữ liệu...</p>
            </div>
        {:else if error}
            <div
                class="p-4 text-red-600 flex items-start gap-3 bg-red-50 m-4 rounded-lg"
            >
                <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error}</p>
            </div>
        {:else if profile}
            <!-- Tabs -->
            <div
                class="flex border-b border-gray-200 sticky top-0 bg-white z-10"
            >
                <button
                    class="flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 border-b-2
          {activeTab === 'profile'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'}"
                    onclick={() => (activeTab = "profile")}
                >
                    <User size={16} />
                    Thông tin
                </button>
                <button
                    class="flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 border-b-2
          {activeTab === 'results'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'}"
                    onclick={() => (activeTab = "results")}
                >
                    <GraduationCap size={16} />
                    Kết quả
                </button>
            </div>

            <div class="p-4">
                {#if activeTab === "profile"}
                    <div class="animate-in fade-in space-y-6">
                        <div class="flex flex-col items-center text-center">
                            <div
                                class="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-3xl mb-3"
                            >
                                {profile.fullName.split(" ").pop()?.charAt(0)}
                            </div>
                            <h2 class="font-bold text-xl text-gray-900">
                                {profile.fullName}
                            </h2>
                            <p class="text-gray-500 font-medium">
                                {profile.studentId}
                            </p>
                        </div>

                        <div class="space-y-0 divide-y divide-gray-100">
                            <div class="flex justify-between py-3">
                                <span class="text-gray-500 text-sm">Lớp</span>
                                <span class="font-medium text-gray-900 text-sm"
                                    >{profile.className}</span
                                >
                            </div>
                            <div class="flex justify-between py-3">
                                <span class="text-gray-500 text-sm">Ngành</span>
                                <span
                                    class="font-medium text-gray-900 text-sm text-right max-w-[60%]"
                                    >{profile.majorName}</span
                                >
                            </div>
                            <div class="flex justify-between py-3">
                                <span class="text-gray-500 text-sm"
                                    >Trường/Khoa</span
                                >
                                <span
                                    class="font-medium text-gray-900 text-sm text-right max-w-[60%]"
                                    >{profile.schoolName}</span
                                >
                            </div>
                            <div class="flex justify-between py-3">
                                <span class="text-gray-500 text-sm">Email</span>
                                <span class="font-medium text-gray-900 text-sm"
                                    >{profile.email}</span
                                >
                            </div>
                            <div class="flex justify-between py-3">
                                <span class="text-gray-500 text-sm"
                                    >Năm nhập học</span
                                >
                                <span class="font-medium text-gray-900 text-sm"
                                    >{profile.admissionYear}</span
                                >
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="animate-in fade-in">
                        <!-- Overview Stats -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <div
                                    class="text-gray-500 text-xs font-medium mb-1 uppercase"
                                >
                                    CPA
                                </div>
                                <div class="text-2xl font-bold text-gray-900">
                                    {profile.cpa}
                                </div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <div
                                    class="text-gray-500 text-xs font-medium mb-1 uppercase"
                                >
                                    GPA
                                </div>
                                <div class="text-2xl font-bold text-gray-900">
                                    {profile.gpa}
                                </div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <div
                                    class="text-gray-500 text-xs font-medium mb-1 uppercase"
                                >
                                    Tín chỉ
                                </div>
                                <div class="text-2xl font-bold text-gray-900">
                                    {profile.totalCredit}
                                </div>
                            </div>
                            <div
                                class="text-center p-3 bg-gray-50 rounded-lg flex flex-col justify-center items-center"
                            >
                                <div
                                    class="text-gray-500 text-xs font-medium mb-1 uppercase"
                                >
                                    Mức cảnh cáo
                                </div>
                                <div
                                    class="text-xs font-bold px-2 py-1 rounded {getWarningLevelColor(
                                        0,
                                    )}"
                                >
                                    {getWarningLevelText(0)}
                                </div>
                            </div>
                        </div>

                        <!-- Academic Results Table -->
                        {#if profile._academicResults && profile._academicResults.length > 0}
                            <h3
                                class="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide"
                            >
                                Chi tiết học tập
                            </h3>
                            <div
                                class="overflow-hidden border border-gray-200 rounded-lg"
                            >
                                <table class="w-full text-sm text-left">
                                    <thead
                                        class="bg-gray-50 text-gray-500 font-medium text-xs uppercase"
                                    >
                                        <tr>
                                            <th class="px-3 py-2">Kỳ</th>
                                            <th class="px-3 py-2 text-center"
                                                >GPA</th
                                            >
                                            <th class="px-3 py-2 text-center"
                                                >CPA</th
                                            >
                                            <th class="px-3 py-2 text-center"
                                                >TC</th
                                            >
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100">
                                        {#each profile._academicResults as result}
                                            <tr
                                                class="hover:bg-gray-50 transition-colors"
                                            >
                                                <td
                                                    class="px-3 py-2 font-medium text-gray-900"
                                                >
                                                    {formatSemester(
                                                        result.semester,
                                                    ).split(" ")[0]}
                                                    <span
                                                        class="text-xs text-gray-400 font-normal block"
                                                    >
                                                        {formatSemester(
                                                            result.semester,
                                                        )
                                                            .split(" ")
                                                            .slice(1)
                                                            .join(" ")}
                                                    </span>
                                                </td>
                                                <td
                                                    class="px-3 py-2 text-center"
                                                    >{result.gpa}</td
                                                >
                                                <td
                                                    class="px-3 py-2 text-center"
                                                    >{result.cpa}</td
                                                >
                                                <td
                                                    class="px-3 py-2 text-center"
                                                    >{result.registerCredit}</td
                                                >
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    <!-- Credits Footer -->
    <div
        class="p-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-gray-50"
    >
        <div class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-2 text-gray-500 font-medium">
                <!-- Placeholder for Sanbaka Logo if available, using Heart for now -->
                <span class="text-red-400">❤️</span>
                <span>Cảm ơn Zennomi vì siêu phẩm waifu Sanbaka &lt;3</span>
            </div>
            <p>Sản phẩm của Nguyễn Trường Sơn 20227148 và đệ Antigravity</p>
            <p class="text-[10px] text-gray-300">
                Sử dụng TailwindCSS v4 cùng Svelte 5
            </p>
        </div>
    </div>
</main>

<style>
    .animate-in {
        animation: fade-in 0.3s ease-out;
    }
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
