# Kater1EQ — Figma Rebuild Spec (Pink Theme)

Tài liệu này liệt kê toàn bộ kích thước, màu sắc, font, spacing lấy trực tiếp từ XAML hiện tại
để bạn dựng lại UI trong Figma bằng tay. Cuối file có **danh sách control bắt buộc giữ tên/loại**
để khi mang thiết kế mới quay lại code không phải viết lại logic C#.

---

## 1. FRAME CHÍNH (Window)

```
Width:     700px  (Min 620px)
Height:    700px  (Min 640px)
Layout:    5 hàng dọc (Auto Layout, direction = Vertical)
  Row 0: Header           → height = hug content
  Row 1: EQ Card + Vol    → height = fill (chiếm phần còn lại)
  Row 2: Warning text     → height = hug content
  Row 3: Action bar       → height = hug content
  Row 4: Bottom nav       → height = hug content
```

---

## 2. MÀU SẮC (Color Styles trong Figma)

Tạo 8 color style sau, đặt tên đúng như dưới để dễ đối chiếu ngược lại theme:

| Tên style          | Hex       | Dùng ở đâu |
|---------------------|-----------|------------|
| `Bg/Primary`         | `#A81856` | Nền cửa sổ ngoài cùng (tối nhất) |
| `Bg/Card`             | `#E23D82` | Header, EQ Card, Bottom nav, Social panel (tông giữa) |
| `Bg/Elevated`         | `#F5599A` | Waveform panel, input box, list item (sáng nhất) |
| `Accent/Main`         | `#FF2D78` | Nút chính, đường cong EQ, chấm band, icon nhấn |
| `Accent/Dim`          | `#F06AA3` | Icon tròn nhỏ (Social), preset item khi chọn |
| `Text/Primary`        | `#FFFFFF` | Chữ chính |
| `Text/Secondary`      | `#FBDCEB` | Label phụ, chú thích, opacity thường 0.6–0.85 |
| `Border`              | `#FF9BC7` | Viền card, viền input, đường chia header/nav |
| `Warning`             | `#FFD166` | Icon cảnh báo âm lượng |

**Nguyên tắc phân tầng:** Primary (tối) → Card (giữa) → Elevated (sáng) — 3 nấc tăng dần độ
sáng để mắt phân vùng ngay, không để mọi thứ cùng 1 tông như bản cũ.

---

## 3. FONT

```
Font family:  Consolas (fallback hiện tại vì chưa có file "Press Start 2P" thật)
              → Nếu muốn đúng pixel 100%, tải "Press Start 2P" từ Google Fonts và dùng trong Figma
Kích thước dùng trong app:
  19px  Bold      — Tiêu đề "Kater1EQ"
  13px  Bold      — Tiêu đề panel (FILTER EDITOR, SOCIAL)
  12.5px Regular  — Tên preset trong list
  12px  SemiBold  — Nút chính, label preset dòng phụ
  11.5px Regular  — Preset subtitle, cảnh báo, social description
  11px  Regular   — Checkbox label
  10.5px SemiBold — Group label (BASS/MIDS/TREBLE/AIR), bottom nav text
  9.5px SemiBold  — Filter editor label, freq tick label
  9px   Regular   — dB axis label
```

---

## 4. HEADER (Row 0)

```
Background:     Bg/Card
Padding:        24px ngang, 18px dọc
Border bottom:  1px, màu Border

Layout ngang, 2 cột:
├─ Cột trái (auto layout ngang, gap 12px)
│   ├─ Icon tròn 36×36, corner radius 18 (bo tròn hoàn toàn), nền Bg/Elevated
│   │   └─ icon note nhạc, stroke Accent/Main, 2.5px
│   └─ Text block dọc
│       ├─ "Kater1EQ" — 19px Bold, Text/Primary
│       └─ "Preset: [tên preset]" — 11.5px, Text/Secondary
│
└─ Cột phải (auto layout ngang, gap 8px)
    ├─ Icon button 34×34 (Compact view toggle - 4 ô vuông nhỏ)
    └─ Icon button 34×34 (Waveform toggle - icon sóng âm)
```

---

## 5. EQ CARD (Row 1 — vùng chính, chiếm phần lớn màn hình)

```
Margin quanh:   24px trái/phải, 16px trên, 10px dưới
Layout ngang, 2 cột:
  Cột trái: 64px cố định (Master Volume)
  Cột phải: fill (EQ Card)
```

### 5a. Master Volume (cột trái, 64px)
```
Căn giữa theo chiều ngang, layout dọc:
  "+0.0" (giá trị hiện tại) — 11px SemiBold, Accent/Main, margin-bottom 8px
  Slider dọc, height 280px, width thanh ray 4px (Bg/Elevated nhạt hơn 1 chút)
    Thumb: hình tròn/pill 20×20, viền 2px
  "VOL" — 10px, Text/Secondary, margin-top 10px
```

### 5b. EQ Card chính (cột phải)
```
Background:   Bg/Card
Border:       2px, màu Border
Corner:       0 (vuông cạnh — pixel style, KHÔNG bo tròn)
Padding:      14px trái/phải/trên, 0 dưới

Layout dọc bên trong:
  1. Group labels: "BASS   MIDS   TREBLE   AIR" — chia đều 4 cột, margin-left 34px (né trục dB)
  2. Đồ thị EQ (curve) — height = fill
     - Trục dB bên trái, width 34px: +50, +40, +30, +20, +10, 0, -10, -20, -30, -40, -50
       (10 dòng đều nhau, font DbAxisLabel, opacity 0.6)
     - Vùng vẽ curve: đường line 2px màu Accent/Main, fill gradient mờ dần bên dưới
       (từ Accent/Main opacity ~35% xuống 0%)
     - Band dot: hình tròn 12×12 (dot bình thường) / 16×16 (dot đang chọn),
       viền 1.6px (thường) / 2.4px (chọn), số thứ tự band ngay trên mỗi dot
     - Đường lưới ngang mức 0dB: nét đứt, Text/Secondary, opacity 0.5
  3. Waveform panel — height cố định 130px, margin-left 34px, margin-top 10px
     Background: Bg/Elevated, border 1px Border, corner 0
     (canvas vẽ sóng nhạc real-time bên trong)
  4. Freq ticks — 13 cột chia đều, margin-left 34px:
     5, 10, 20, 40, 80, 160, 320, 640, 1.3k, 2.6k, 5.1k, 10k, 20k
```

### 5c. Filter Editor (overlay nổi trên EQ Card, góc phải trên)
```
Width:        230px (max-width 230px)
Position:     absolute, cách top 14px, cách right 14px
Background:   Bg/Elevated
Border:       2px Border, corner 0
Padding:      14px
Shadow:       rất nhẹ (blur 4, offset 2, opacity 0.3, màu đen) — chỉ đủ tách khỏi nền, KHÔNG
              đổ bóng mềm kiểu hiện đại

Layout dọc:
  Header: "FILTER EDITOR" (12px Bold) + nút đóng ✕ (20×20, góc phải)
  "BAND" label + "01" giá trị lớn (13px Bold, Accent/Main)
  "TYPE" label + ComboBox (height 30px)
  "FREQUENCY (Hz)" label + TextBox (height 30px)
  "GAIN (dB)" label + TextBox (height 30px)
  "Q" label + TextBox (height 30px)
  "SLOPE" label + ComboBox (height 30px) — chỉ hiện với 1 số filter type
  Checkbox "Band bật (Enabled)" — margin-top 12px
  Nút "RESET BAND" (Secondary style, height 32px, margin-top 12px)
```

---

## 6. WARNING (Row 2)
```
Layout ngang, căn giữa, margin 28px trái/phải, margin-bottom 10px
  Icon ⚠ (12px, màu Warning) + text "Âm lượng lớn có thể ảnh hưởng thính giác..." (11.5px, Text/Secondary)
```

---

## 7. ACTION BAR (Row 3) — đổi nội dung theo tab đang chọn

### Tab EQ (mặc định)
```
Layout ngang, margin 24px trái/phải, margin-bottom 14px:
  Nút chính "⏻ Stop EQing · [tên thiết bị]" — fill width, height 46px, style Primary Button
    (Accent/Main nền, chữ trắng)
  Nút "↺ Reset" — width auto, height 46px, style Secondary Button (Bg/Elevated nền)
```

### Tab Presets
```
Layout dọc:
  Hàng 3 nút chia đều: "Ghi đè" / "Đổi tên" / "Xoá" — height 34px, Secondary style
  List preset (ListBox, max-height 220px)
    Mỗi item: padding 12px/10px, border 1px, corner 7px (BO TRÒN — khác card chính)
      - có sao ★ (Accent/Main) nếu là default preset
      - tên preset, ellipsis nếu dài
      - hover: viền Accent/Main
      - selected: nền Accent/Dim, viền Accent/Main 2px
  Nút "+ THÊM PRESET" — fill width, height 38px, Primary style, margin-top 8px
```

---

## 8. SOCIAL PANEL (thay thế EQ Card khi chọn tab Social)
```
Background:   Bg/Card, corner radius 12 (BO TRÒN — khác EQ card)
Margin:       24px trái/phải, 16px trên, 10px dưới
Padding nội dung: 20px/18px

Layout dọc:
  "SOCIAL" — 13px Bold
  Mô tả — 11px, Text/Secondary, margin-bottom 16px
  6 dòng link (Facebook, Instagram, GitHub, TikTok, Steam, + có thể thêm):
    Mỗi dòng: icon tròn 26×26 (nền Accent/Dim) + tên/link text (12px), margin-bottom 10px
```

---

## 9. BOTTOM NAV (Row 4)
```
Background:   Bg/Card
Border top:   1px Border
Padding:      8px trên/dưới
Layout:       5 cột chia đều (UniformGrid)

Mỗi tab: icon (16px) + label (10.5px), căn giữa dọc
  EQ | Presets | SOCIAL | Tabs | More

Trạng thái active: icon+text đổi sang Accent/Main
Trạng thái inactive: Text/Secondary
```

---

## 10. ⚠️ DANH SÁCH CONTROL BẮT BUỘC GIỮ NGUYÊN TÊN/LOẠI

Đây là phần **quan trọng nhất** nếu bạn muốn tôi mang thiết kế Figma mới quay lại code mà
KHÔNG phải sửa lại `MainWindow.xaml.cs`. Logic C# tham chiếu trực tiếp tới các tên này —
đổi tên hoặc đổi loại control sẽ làm gãy code, phải viết lại phần xử lý tương ứng.

| x:Name                     | Loại control (WPF) | Vai trò |
|------------------------------|---------------------|---------|
| `MasterVolumeSlider`         | Slider (vertical)   | Kéo chỉnh preamp tổng |
| `MasterVolumeText`           | TextBlock           | Hiện giá trị dB hiện tại |
| `CurveCanvas`                | Canvas              | Vẽ đường cong EQ + band dots (code vẽ động, KHÔNG vẽ tay trong XAML) |
| `WaveformCanvas`             | Canvas              | Vẽ sóng nhạc real-time (code vẽ động) |
| `DbAxisPanel`                | Grid                | Ẩn/hiện trục dB khi bấm Compact view |
| `GroupLabelsRow`              | UniformGrid          | Ẩn/hiện label BASS/MIDS/TREBLE/AIR |
| `FilterEditorPanel`           | Border               | Show/hide khi chọn band |
| `FilterEditorBandLabel`       | TextBlock            | Số band đang chọn |
| `FilterEditorTypeCombo`       | ComboBox             | Loại filter |
| `FilterEditorFreqBox`         | TextBox              | Nhập tần số |
| `FilterEditorGainBox`         | TextBox              | Nhập gain |
| `FilterEditorQBox`            | TextBox              | Nhập Q |
| `FilterEditorSlopeRow`        | StackPanel           | Ẩn/hiện tuỳ filter type |
| `FilterEditorSlopeCombo`      | ComboBox             | Slope |
| `FilterEditorEnabledCheck`    | CheckBox             | Bật/tắt band |
| `EqToggleButton` / `EqToggleText` | Button/TextBlock | Bật/tắt toàn bộ EQ |
| `SourceNameText`              | TextBlock             | Tên thiết bị output |
| `CompactViewButton`           | Button                | Toggle trục dB |
| `ToggleWaveformButton`        | Button                | Toggle hiển thị waveform |
| `EqActionsPanel` / `PresetsActionsPanel` | Grid/StackPanel | Đổi nội dung action bar theo tab |
| `PresetListBox`               | ListBox                | Danh sách preset |
| `PresetSubtitleText`          | TextBlock               | Tên preset đang dùng ở header |
| `OverwritePresetButton` / `RenamePresetButton` / `DeletePresetButton` / `AddPresetButton` | Button | Thao tác preset |
| `SocialPanel`                  | Border                  | Show/hide tab Social |
| `FacebookRow` / `InstagramRow` / `GitHubRow` / `TikTokRow` / `SteamRow` | Border (Tag=tên mạng xã hội) | Click mở link |
| `NavEqButton` / `NavPresetsButton` / `NavSocialButton` / `NavTabsButton` / `NavMoreButton` | Button | Chuyển tab |
| `WarningPanel`                 | StackPanel               | Cảnh báo âm lượng |

**Được đổi thoải mái:** màu sắc, khoảng cách, bo góc, kích thước icon, font, vị trí (miễn còn
đúng loại control và đúng tên) — tất cả những thứ này chỉ là *style*, không phải logic.

**KHÔNG được đổi khi mang thiết kế quay lại code** (nếu đổi phải báo tôi để sửa code theo):
- Đổi `Canvas` → loại khác cho `CurveCanvas`/`WaveformCanvas` (code vẽ trực tiếp lên Canvas)
- Đổi `Slider` → control kéo tự chế cho `MasterVolumeSlider`
- Xoá bớt band dot / đổi số lượng band cố định trong code
- Đổi cấu trúc ẩn/hiện của `FilterEditorPanel`, `EqActionsPanel`/`PresetsActionsPanel`,
  `SocialPanel` (đang dùng `Visibility="Collapsed"` — nếu Figma bạn dùng cơ chế khác như
  chuyển trang/frame riêng, cần tôi đổi code từ "ẩn/hiện" sang "chuyển trang")

---

## 11. GỢI Ý QUY TRÌNH LÀM TRONG FIGMA

1. Tạo frame 700×700, đặt 9 color style ở mục 2.
2. Dựng từng khối theo thứ tự Header → EQ Card → Warning → Action bar → Bottom nav,
   dùng Auto Layout đúng theo padding/gap đã liệt kê để khi bạn đổi nội dung, bố cục tự co giãn
   giống WPF Grid/StackPanel thật.
3. Dùng Component cho: Primary Button, Secondary Button, Icon Button (34×34), Preset List Item,
   Nav Tab Item — vì các thành phần này lặp lại nhiều lần với cùng style.
4. Khi xong, chụp export PNG hoặc gửi link Figma cho tôi — tôi đối chiếu lại bảng mục 10 rồi
   dựng XAML mới, nối logic cũ vào.