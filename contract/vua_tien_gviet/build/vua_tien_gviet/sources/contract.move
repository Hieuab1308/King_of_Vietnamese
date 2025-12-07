// Copyright (c) 2024 Vua Tieng Viet
// SPDX-License-Identifier: Apache-2.0

/// Smart Contract "Vua Tiếng Việt" - Game đố chữ tiếng Việt trên IOTA
/// 
/// Tính năng:
/// 1. Chống gian lận: Đáp án được mã hóa hash, không thể sửa sau khi tạo câu hỏi
/// 2. Tự động trả thưởng: Người đoán đúng đầu tiên nhận thưởng ngay lập tức
/// 3. Minh bạch: Mọi giao dịch được ghi lại trên blockchain

#[allow(lint(coin_field, self_transfer))]
module vua_tien_gviet::contract {
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::event;
    use iota::hash::keccak256;

    // ==================== Error Codes ====================
    const ENotAdmin: u64 = 0;
    const EQuestionNotActive: u64 = 1;
    const EWrongAnswer: u64 = 2;
    const EInsufficientReward: u64 = 3;
    const EQuestionExpired: u64 = 4;

    // ==================== Structs ====================

    /// Admin capability - chỉ người tạo contract mới có
    public struct AdminCap has key, store {
        id: UID
    }

    /// Câu hỏi trong game
    public struct Question has key, store {
        id: UID,
        /// Nội dung câu hỏi
        question_text: vector<u8>,
        /// Gợi ý (nếu có)
        hint: vector<u8>,
        /// Hash của đáp án (keccak256) - KHÔNG THỂ SỬA sau khi tạo
        answer_hash: vector<u8>,
        /// Tiền thưởng
        reward: Coin<IOTA>,
        /// Trạng thái: true = đang hoạt động, false = đã giải
        is_active: bool,
        /// Người tạo câu hỏi
        creator: address,
        /// Thời gian tạo
        created_at: u64,
        /// Thời hạn (epoch), 0 = không giới hạn
        deadline: u64,
        /// Người thắng (nếu có)
        winner: Option<address>
    }

    /// Game state - shared object
    public struct GameState has key {
        id: UID,
        /// Admin address
        admin: address,
        /// Tổng số câu hỏi đã tạo
        total_questions: u64,
        /// Tổng số câu hỏi đã được giải
        total_solved: u64,
        /// Tổng tiền thưởng đã phát
        total_rewards_distributed: u64
    }

    // ==================== Events ====================

    /// Event khi tạo câu hỏi mới
    public struct QuestionCreated has copy, drop {
        question_id: ID,
        question_text: vector<u8>,
        reward_amount: u64,
        creator: address
    }

    /// Event khi có người trả lời đúng
    public struct QuestionSolved has copy, drop {
        question_id: ID,
        winner: address,
        reward_amount: u64,
        answer: vector<u8>
    }

    /// Event khi câu hỏi bị hủy
    public struct QuestionCancelled has copy, drop {
        question_id: ID,
        refund_amount: u64
    }

    // ==================== Init ====================

    /// Khởi tạo game - chỉ chạy 1 lần khi deploy
    fun init(ctx: &mut TxContext) {
        // Tạo AdminCap cho người deploy
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, ctx.sender());

        // Tạo GameState shared object
        let game_state = GameState {
            id: object::new(ctx),
            admin: ctx.sender(),
            total_questions: 0,
            total_solved: 0,
            total_rewards_distributed: 0
        };
        transfer::share_object(game_state);
    }

    // ==================== Public Functions ====================

    /// Tạo câu hỏi mới với đáp án đã được hash
    /// answer_hash: keccak256(đáp án + salt) - client tự hash trước khi gửi
    public fun create_question(
        game_state: &mut GameState,
        question_text: vector<u8>,
        hint: vector<u8>,
        answer_hash: vector<u8>,
        reward: Coin<IOTA>,
        deadline: u64,
        ctx: &mut TxContext
    ) {
        let reward_amount = coin::value(&reward);
        assert!(reward_amount > 0, EInsufficientReward);

        let question_uid = object::new(ctx);
        let question_id = object::uid_to_inner(&question_uid);

        let question = Question {
            id: question_uid,
            question_text,
            hint,
            answer_hash,
            reward,
            is_active: true,
            creator: ctx.sender(),
            created_at: ctx.epoch(),
            deadline,
            winner: option::none()
        };

        // Cập nhật game state
        game_state.total_questions = game_state.total_questions + 1;

        // Emit event
        event::emit(QuestionCreated {
            question_id,
            question_text: question.question_text,
            reward_amount,
            creator: ctx.sender()
        });

        // Share câu hỏi để mọi người có thể trả lời
        transfer::share_object(question);
    }

    /// Trả lời câu hỏi
    /// answer: đáp án gốc (plain text)
    /// salt: salt đã dùng khi hash (để verify)
    public fun submit_answer(
        game_state: &mut GameState,
        question: &mut Question,
        answer: vector<u8>,
        salt: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Kiểm tra câu hỏi còn active
        assert!(question.is_active, EQuestionNotActive);

        // Kiểm tra deadline (nếu có)
        if (question.deadline > 0) {
            assert!(ctx.epoch() <= question.deadline, EQuestionExpired);
        };

        // Hash đáp án người dùng gửi và so sánh
        let mut answer_with_salt = answer;
        vector::append(&mut answer_with_salt, salt);
        let computed_hash = keccak256(&answer_with_salt);

        // So sánh hash
        assert!(computed_hash == question.answer_hash, EWrongAnswer);

        // === ĐÚNG RỒI! Tự động trả thưởng ===
        let reward_amount = coin::value(&question.reward);
        let winner = ctx.sender();

        // Lấy toàn bộ tiền thưởng
        let reward_coin = coin::split(&mut question.reward, reward_amount, ctx);
        
        // Chuyển tiền cho người thắng ngay lập tức
        transfer::public_transfer(reward_coin, winner);

        // Cập nhật trạng thái câu hỏi
        question.is_active = false;
        question.winner = option::some(winner);

        // Cập nhật game state
        game_state.total_solved = game_state.total_solved + 1;
        game_state.total_rewards_distributed = game_state.total_rewards_distributed + reward_amount;

        // Emit event
        event::emit(QuestionSolved {
            question_id: object::uid_to_inner(&question.id),
            winner,
            reward_amount,
            answer
        });
    }

    /// Hủy câu hỏi (chỉ creator hoặc admin, và câu hỏi phải còn active)
    public fun cancel_question(
        game_state: &GameState,
        question: &mut Question,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        // Chỉ creator hoặc admin mới được hủy
        assert!(sender == question.creator || sender == game_state.admin, ENotAdmin);
        assert!(question.is_active, EQuestionNotActive);

        // Hoàn tiền cho creator
        let refund_amount = coin::value(&question.reward);
        let refund_coin = coin::split(&mut question.reward, refund_amount, ctx);
        transfer::public_transfer(refund_coin, question.creator);

        // Đánh dấu không còn active
        question.is_active = false;

        // Emit event
        event::emit(QuestionCancelled {
            question_id: object::uid_to_inner(&question.id),
            refund_amount
        });
    }

    /// Thêm tiền thưởng cho câu hỏi
    public fun add_reward(
        question: &mut Question,
        additional_reward: Coin<IOTA>,
        _ctx: &mut TxContext
    ) {
        assert!(question.is_active, EQuestionNotActive);
        coin::join(&mut question.reward, additional_reward);
    }

    // ==================== View Functions ====================

    /// Lấy nội dung câu hỏi
    public fun get_question_text(question: &Question): vector<u8> {
        question.question_text
    }

    /// Lấy gợi ý
    public fun get_hint(question: &Question): vector<u8> {
        question.hint
    }

    /// Lấy số tiền thưởng
    public fun get_reward_amount(question: &Question): u64 {
        coin::value(&question.reward)
    }

    /// Kiểm tra câu hỏi còn active không
    public fun is_active(question: &Question): bool {
        question.is_active
    }

    /// Lấy người thắng (nếu có)
    public fun get_winner(question: &Question): Option<address> {
        question.winner
    }

    /// Lấy deadline
    public fun get_deadline(question: &Question): u64 {
        question.deadline
    }

    /// Lấy thống kê game
    public fun get_game_stats(game_state: &GameState): (u64, u64, u64) {
        (game_state.total_questions, game_state.total_solved, game_state.total_rewards_distributed)
    }

    // ==================== Helper Functions ====================

    /// Helper function để hash đáp án (client có thể dùng để tạo hash)
    /// Lưu ý: Hàm này public để client biết cách hash, nhưng thực tế
    /// client nên hash ở phía client để không lộ đáp án trên blockchain
    public fun hash_answer(answer: vector<u8>, salt: vector<u8>): vector<u8> {
        let mut data = answer;
        vector::append(&mut data, salt);
        keccak256(&data)
    }

    // ==================== Test Functions ====================
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

