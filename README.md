# 🇻🇳 Vua Tiếng Việt - Game Đố Chữ Blockchain

> Game đố chữ tiếng Việt trên blockchain IOTA - **Chống gian lận 100%**, **Tự động trả thưởng**!

![IOTA](https://img.shields.io/badge/IOTA-Blockchain-blue)
![Move](https://img.shields.io/badge/Move-Smart%20Contract-green)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)

## 🎯 Giới thiệu

**Vua Tiếng Việt** là một game đố chữ phi tập trung (dApp) được xây dựng trên blockchain IOTA. Người chơi có thể tạo câu hỏi với tiền thưởng và ai đoán đúng đầu tiên sẽ nhận thưởng tự động!

### ✨ Điểm nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🔒 **Chống gian lận** | Đáp án được mã hóa (hash), không ai có thể sửa sau khi tạo câu hỏi |
| ⚡ **Tự động trả thưởng** | Đoán đúng → Smart Contract chuyển tiền ngay lập tức |
| 🌐 **Minh bạch** | Mọi giao dịch công khai trên blockchain |
| 💰 **Phi tập trung** | Không cần bên thứ 3, không ai can thiệp được |

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Tạo câu hỏi │  │  Trả lời    │  │  Xem thống kê      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                 SMART CONTRACT (Move/IOTA)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • create_question() - Tạo câu hỏi + khóa tiền thưởng│   │
│  │  • submit_answer()   - Kiểm tra đáp án + trả thưởng  │   │
│  │  • cancel_question() - Hủy và hoàn tiền              │   │
│  │  • hash_answer()     - Mã hóa đáp án (keccak256)     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Cơ chế chống gian lận

```
┌────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Tạo câu hỏi                                        │
│                                                            │
│   Đáp án: "con chó"  ──┐                                   │
│   Salt:   "abc123"   ──┼──► hash() ──► "7a8b9c..."        │
│                        │              (lưu blockchain)     │
│                        │                                   │
│   ⚠️ Đáp án gốc KHÔNG được lưu!                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Trả lời                                            │
│                                                            │
│   Người chơi nhập: "con chó" + "abc123"                   │
│                           │                                │
│                           ▼                                │
│   Contract tính: hash("con chó" + "abc123") = "7a8b9c..." │
│                           │                                │
│                           ▼                                │
│   So sánh: "7a8b9c..." == "7a8b9c..." ✅ ĐÚNG!            │
│                           │                                │
│                           ▼                                │
│   💰 Tự động chuyển tiền thưởng cho người thắng!          │
└────────────────────────────────────────────────────────────┘
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js 18+
- IOTA CLI (`iota`)
- Ví IOTA với IOTA testnet/devnet

### Cài đặt

```bash
# Clone project
git clone <repo-url>
cd vua_tien_gviet

# Cài dependencies
npm install --legacy-peer-deps

# Deploy smart contract
npm run iota-deploy

# Chạy development server
npm run dev
```

### Mở trình duyệt
```
http://localhost:3000
```

## 📁 Cấu trúc dự án

```
vua_tien_gviet/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout chính
│   ├── page.tsx                  # Trang chủ
│   └── globals.css               # CSS toàn cục
├── components/                   # React Components
│   ├── VuaTiengVietGame.tsx      # Component game chính
│   ├── Wallet-connect.tsx        # Kết nối ví
│   └── Provider.tsx              # IOTA Provider
├── hooks/                        # Custom Hooks
│   └── useVuaTiengViet.ts        # Hook tương tác contract
├── lib/                          # Cấu hình
│   └── config.ts                 # Package ID, Game State ID
├── contract/                     # Smart Contract
│   └── vua_tien_gviet/
│       ├── Move.toml             # Config Move
│       └── sources/
│           └── vua_tien_gviet.move  # Contract chính
└── scripts/                      # Scripts tiện ích
    └── iota-deploy-wrapper.js    # Auto deploy
```

## 📖 Hướng dẫn sử dụng

### 👤 Người tạo câu hỏi (Admin)

1. Kết nối ví IOTA
2. Nhấn **"➕ Tạo câu hỏi"**
3. Điền thông tin:
   - Câu hỏi
   - Gợi ý (tùy chọn)
   - Đáp án
   - Salt (nhấn 🎲 để tạo ngẫu nhiên)
   - Tiền thưởng (IOTA)
4. **Lưu lại Salt** để chia sẻ cho người chơi
5. Nhấn **"Tạo câu hỏi"**

### 🎮 Người chơi

1. Kết nối ví IOTA
2. Xem danh sách câu hỏi đang mở
3. Nhấn **"Trả lời"**
4. Nhập:
   - Đáp án
   - Salt (được cung cấp bởi người tạo)
5. Nếu đúng → **Nhận thưởng tự động!**

## 🛠️ Smart Contract API

### `create_question`
Tạo câu hỏi mới với tiền thưởng.

```move
public fun create_question(
    game_state: &mut GameState,
    question_text: vector<u8>,
    hint: vector<u8>,
    answer_hash: vector<u8>,  // Hash của đáp án
    reward: Coin<IOTA>,       // Tiền thưởng
    deadline: u64,            // Thời hạn (0 = không giới hạn)
    ctx: &mut TxContext
)
```

### `submit_answer`
Gửi câu trả lời và nhận thưởng nếu đúng.

```move
public fun submit_answer(
    game_state: &mut GameState,
    question: &mut Question,
    answer: vector<u8>,       // Đáp án gốc
    salt: vector<u8>,         // Salt
    ctx: &mut TxContext
)
```

### `cancel_question`
Hủy câu hỏi và hoàn tiền (chỉ creator).

```move
public fun cancel_question(
    game_state: &GameState,
    question: &mut Question,
    ctx: &mut TxContext
)
```

## 🔗 Links

- [IOTA Documentation](https://wiki.iota.org/)
- [IOTA dApp Kit](https://github.com/iotaledger/dapp-kit)
- [Move Language](https://move-language.github.io/move/)
- [Next.js](https://nextjs.org/)

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa!

---

<p align="center">
  Made with ❤️ for Vietnamese community 🇻🇳
</p>
