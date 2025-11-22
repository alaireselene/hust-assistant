# HUST Assistant (Trợ lý HUST)

> Tiện ích giúp sinh viên HUST xem nhanh và xuất lịch học sang Google Calendar, cũng như xem nhanh kết quả học tập.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-red?logo=googlechrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-orange?logo=svelte)](https://svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)



## Tính năng

### Lịch học
- Xem nhanh lịch học gồm tên môn, mã môn, thời gian, giảng viên
- **Xuất lịch sang file ICS** để import vào Google Calendar, Apple Calendar, Outlook (thực ra cũng muốn xuất thẳng Google Calendar nhưng không có 5$ đóng cho Google)

### Hồ sơ sinh viên
- Thông tin cá nhân: họ tên, MSSV, lớp, ngành học
- GPA, CPA theo kỳ
- Số tín chỉ tích luỹ
- Mức cảnh báo học tập



## Công nghệ sử dụng

- Chrome Extension Manifest V3
- Svelte 5 TS + Lucide Icon Pack
- TailwindCSS v4
- Vite + CRXJS



## Cài đặt

### Từ Chrome Web Store
*(Nếu có người donate cho đủ 5$)*

### Từ Github
- Truy cập [chrome://extension](chrome://extension), bật Chế độ nhà phát triển
- Tải file zip từ Github Release
- Quay lại trang [chrome://extension](chrome://extension), kéo file zip thả vào để quá trình cài đặt bắt đầu
- Tận hưởng



## Hướng dẫn sử dụng

1. **Đăng nhập vào [student.hust.edu.vn](https://student.hust.edu.vn)**
2. **Click vào icon extension** trên thanh công cụ Chrome để xem lịch học và xuất file
3. **Bật side panel sẽ xem được:**
   - **Hồ sơ**: Xem thông tin sinh viên
   - **Kết quả học tập**: Theo dõi GPA/CPA

### Cách nhập lịch vào Google Calendar

1. Mở tab **Lịch học**
2. Click nút **"Xuất file ICS"**
3. Mở Google Calendar → Settings → Import & Export
4. Chọn file ICS vừa tải về
5. Hoàn tất! Lịch học đã được sync
---

## Tự trồng tự ăn

1. **Clone repository:**
```bash
git clone https://github.com/alaireselene/hust-assistant.git
cd hust-assistant
```

2. **Cài đặt dependencies:**
```bash
npm install
# hoặc
bun install
```

3. **Build extension:**
```bash
npm run build
```

4. **Load extension vào Chrome:**
   - Mở Chrome và truy cập `chrome://extensions/`
   - Bật "Developer mode" ở góc trên bên phải
   - Click "Load unpacked"
   - Chọn thư mục `dist` trong project



## Muốn tạo một app như thế này?

Chôm file [AGENTS.md](./AGENTS.md) vứt vào IDE, LLM đọc được mà. 


## License

MIT License.



## Đóng góp

Contributions, issues và feature requests đều được chào đón!

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request


## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub.



**Cảm ơn Zennomi vì linh vật Sanbaka <3**
