# 🌍 Find and Bind- FE - Trợ Lý Du Lịch Cá Nhân Hóa AI

**Find and Bind- FE** là một ứng dụng di động hiện đại giúp người dùng khám phá thế giới một cách thông minh và tiện lợi nhất. Bằng cách kết hợp sức mạnh của trí tuệ nhân tạo (AI) và trải nghiệm người dùng mượt mà, chúng tôi mang đến những chuyến đi được thiết kế riêng cho từng cá nhân.

---

## ✨ Tính Năng Nổi Bật

### 1. 🔍 Khám Phá Cá Nhân Hóa (Discovery)
- Gợi ý địa điểm thông minh dựa trên sở thích và xu hướng.
- Hệ thống lọc theo danh mục: Thiên nhiên, Văn hóa, Nghỉ dưỡng, Ẩm thực...
- "Lý do gợi ý" (Insights) giúp người dùng hiểu tại sao địa điểm này phù hợp với mình.

### 2. 🤖 Lập Kế Hoạch Chuyến Đi Với AI (AI Planner)
- Tạo lịch trình chi tiết chỉ trong vài giây.
- Tùy chỉnh theo: Điểm đến, đối tượng (một mình, cặp đôi, gia đình) và phong cách du lịch.
- Tự động tối ưu hóa lộ trình và thời gian hoạt động.

### 3. 🛡️ Chỉ Số Tin Cậy & Rủi Ro (Smart Insights)
- **Trust Score:** Đánh giá mức độ uy tín của địa điểm.
- **Risk Level:** Cảnh báo các rủi ro tiềm ẩn (đông đúc, giá thay đổi, thời tiết).
- **Price Confidence:** Độ chính xác của thông tin giá cả giúp bạn chuẩn bị ngân sách tốt hơn.

### 4. 🗺️ Bản Đồ Tương Tác
- Xem vị trí trực quan các điểm đến.
- Tìm kiếm các dịch vụ xung quanh một cách nhanh chóng.

### 5. 💼 Chế Độ Đa Người Dùng
- **Người du lịch (User):** Khám phá và quản lý chuyến đi.
- **Chủ địa điểm (Merchant):** Quản lý thông tin và tương tác với khách hàng (Đang phát triển).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Mobile Bridge:** [Capacitor](https://capacitorjs.com/) (Hỗ trợ Android/iOS)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [Google Gemini AI](https://ai.google.dev/)
- **Routing:** [React Router 7](https://reactrouter.com/)

---

## 🚀 Hướng Dẫn Cài Đặt

### Tiền đề
- Đã cài đặt **Node.js** (Phiên bản mới nhất khuyến nghị).
- Đã cài đặt **npm** hoặc **yarn**.

### Các bước thực hiện

1. **Clone dự án:**
   ```bash
   git clone <url-cua-repo>
   cd Find-and-Bind-FE
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo file `.env` từ `.env.example` và thêm API Key của bạn:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Chạy ứng dụng (Development):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:3000`

5. **Xây dựng bản Android (Cần Android Studio):**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

---

## 📂 Cấu Trúc Thư Mục

```text
src/
├── components/   # Các thành phần giao diện dùng chung
├── context/      # Quản lý trạng thái (AppContext)
├── pages/        # Các màn hình chính (Discovery, Planner, AICreator...)
├── App.tsx       # Routing và Layout chính
└── main.tsx      # Điểm khởi đầu của ứng dụng
```

---

## 📈 Lộ Trình Phát Triển (Roadmap)
- [ ] Tích hợp sâu hơn với Google Maps API cho lộ trình thời gian thực.
- [ ] Hoàn thiện Dashboard cho Merchant (Chủ địa điểm).
- [ ] Chế độ ngoại tuyến (Offline Mode) cho lịch trình.
- [ ] Hệ thống đặt chỗ (Booking) trực tiếp trong ứng dụng.

---
© 2024 Find and Bind- FE Team. Chúc bạn có những chuyến đi tuyệt vời!
