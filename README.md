# 🇻🇳 Vua Tiếng Việt

> Vietnamese Word Guessing Game on IOTA Blockchain

## 📝 Description

**Vua Tiếng Việt** (King of Vietnamese) is a decentralized word guessing game (dApp) built on IOTA blockchain with the following features:

- 🔒 **Anti-cheat**: Answers are hashed and cannot be modified after question creation
- ⚡ **Auto reward**: Correct answer → instant prize transfer
- 🌐 **Transparent**: All transactions are public on blockchain

## 🚀 How to Run

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Deploy smart contract to IOTA devnet
npm run iota-deploy

# 3. Start the application
npm run dev
```

Open browser: **http://localhost:3000**

## 📁 Project Structure

```
vua_tien_gviet/
│
├── app/                              # Next.js App Router (Frontend)
│   ├── layout.tsx                    # Root layout component
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
│
├── components/                       # React Components
│   ├── VuaTiengVietGame.tsx          # Main game component
│   ├── Wallet-connect.tsx            # IOTA wallet connection
│   └── Provider.tsx                  # IOTA Provider wrapper
│
├── hooks/                            # Custom React Hooks
│   ├── useVuaTiengViet.ts            # Hook for game contract interaction
│   └── useContract.ts                # Base contract hook
│
├── lib/                              # Configuration
│   └── config.ts                     # Package ID, Game State ID, Network config
│
├── contract/                         # ⭐ SMART CONTRACT (Move Language)
│   └── vua_tien_gviet/
│       ├── Move.toml                 # Move package configuration
│       └── sources/
│           └── vua_tien_gviet.move   # ← Main smart contract file
│
├── scripts/                          # Utility Scripts
│   ├── iota-deploy-wrapper.js        # Auto deploy script
│   └── iota-generate-prompt-wrapper.js
│
├── public/                           # Static assets
├── package.json                      # Node.js dependencies
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
└── README.md                         # This file
```

## 📜 Smart Contract

**Location**: `contract/vua_tien_gviet/sources/vua_tien_gviet.move`

### Main Functions:

| Function | Description |
|----------|-------------|
| `create_question()` | Create question + lock reward in contract |
| `submit_answer()` | Submit answer + receive reward if correct |
| `cancel_question()` | Cancel question + refund (creator only) |
| `hash_answer()` | Hash answer using keccak256 |

### How It Works:

```
1. Admin creates question:
   - Answer "dog" + Salt "abc123" → hash → Store on blockchain
   - Reward is locked in smart contract

2. Player answers:
   - Input answer + salt
   - Contract re-hashes and compares
   - Correct? → Auto transfer reward to winner!
```

### Contract Structs:

```move
// Game state (shared object)
struct GameState {
    admin: address,
    total_questions: u64,
    total_solved: u64,
    total_rewards_distributed: u64
}

// Question object
struct Question {
    question_text: vector<u8>,
    hint: vector<u8>,
    answer_hash: vector<u8>,    // Hashed answer (32 bytes)
    reward: Coin<IOTA>,         // Locked reward
    is_active: bool,
    creator: address,
    winner: Option<address>
}
```

## 🛠️ Tech Stack

- **Blockchain**: IOTA (Move language)
- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Radix UI, TailwindCSS
- **Wallet**: IOTA dApp Kit
- **Hashing**: keccak256 (js-sha3)

## 📧 Contact

- **Email**: 22010104@st.phenikaa-uni.edu.vn
- **GitHub**: [Hieuab1308](https://github.com/Hieuab1308)

## 📄 License

MIT License

MIT License
