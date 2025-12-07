"use client"

/**
 * ============================================================================
 * VUA TIẾNG VIỆT - GAME COMPONENT
 * ============================================================================
 * 
 * Giao diện chính của game đố chữ "Vua Tiếng Việt"
 * Theme: Việt Nam 🇻🇳
 * 
 * ============================================================================
 */

import { useState } from "react"
import { useCurrentAccount } from "@iota/dapp-kit"
import { useVuaTiengViet, Question } from "@/hooks/useVuaTiengViet"
import { Button, Container, Flex, Heading, Text, TextField, Card, Badge, Dialog, TextArea } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"

// ============================================================================
// QUESTION CARD COMPONENT
// ============================================================================

interface QuestionCardProps {
    question: Question
    onAnswer: (questionId: string, answer: string, salt: string) => void
    onCancel: (questionId: string) => void
    currentAddress?: string
    isLoading: boolean
}

const QuestionCard = ({ question, onAnswer, onCancel, currentAddress, isLoading }: QuestionCardProps) => {
    const [showAnswerDialog, setShowAnswerDialog] = useState(false)
    const [answer, setAnswer] = useState("")
    const [salt, setSalt] = useState("")

    const isCreator = currentAddress?.toLowerCase() === question.creator.toLowerCase()
    const rewardInIOTA = (question.rewardAmount / 1_000_000_000).toFixed(4)

    const handleSubmitAnswer = () => {
        onAnswer(question.id, answer, salt)
        setShowAnswerDialog(false)
        setAnswer("")
        setSalt("")
    }

    return (
        <div className="game-card question-card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
            <Flex justify="between" align="start" style={{ marginBottom: "1rem" }}>
                <div style={{ flex: 1, paddingLeft: "12px" }}>
                    <Flex gap="2" align="center" style={{ marginBottom: "0.5rem" }}>
                        <Heading size="4" style={{ color: "var(--accent)" }}>
                            {question.questionText || "Câu hỏi"}
                        </Heading>
                        {question.isActive ? (
                            <span className="badge-active" style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                                🟢 Đang mở
                            </span>
                        ) : (
                            <span className="badge-closed" style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                                ⚫ Đã đóng
                            </span>
                        )}
                    </Flex>

                    {question.hint && (
                        <Text size="2" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                            💡 <em>Gợi ý: {question.hint}</em>
                        </Text>
                    )}
                </div>

                <div className="badge-reward animate-float">
                    <span className="trophy-bounce">🏆</span> {rewardInIOTA} IOTA
                </div>
            </Flex>

            <Flex gap="2" style={{ marginTop: "1rem", paddingLeft: "12px" }}>
                {question.isActive && (
                    <Dialog.Root open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
                        <Dialog.Trigger>
                            <button className="btn-vietnam" disabled={isLoading}>
                                🎯 Trả lời ngay
                            </button>
                        </Dialog.Trigger>

                        <Dialog.Content style={{ maxWidth: 450, borderRadius: "16px" }}>
                            <Dialog.Title style={{ color: "var(--primary)" }}>
                                🎮 Trả lời câu hỏi
                            </Dialog.Title>
                            <Dialog.Description size="2" mb="4">
                                Nhập đáp án và salt. Đúng là nhận ngay <strong>{rewardInIOTA} IOTA!</strong>
                            </Dialog.Description>

                            <Flex direction="column" gap="3">
                                <label>
                                    <Text as="div" size="2" mb="1" weight="bold" style={{ color: "var(--primary)" }}>
                                        📝 Đáp án của bạn *
                                    </Text>
                                    <TextField.Root
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="Nhập đáp án..."
                                        style={{ borderRadius: "8px" }}
                                    />
                                </label>

                                <label>
                                    <Text as="div" size="2" mb="1" weight="bold" style={{ color: "var(--primary)" }}>
                                        🔑 Salt (mã xác minh) *
                                    </Text>
                                    <TextField.Root
                                        value={salt}
                                        onChange={(e) => setSalt(e.target.value)}
                                        placeholder="Nhập salt từ người tạo câu hỏi"
                                        style={{ borderRadius: "8px" }}
                                    />
                                    <Text size="1" style={{ color: "#888", marginTop: "4px", display: "block" }}>
                                        Salt được người tạo câu hỏi công bố
                                    </Text>
                                </label>
                            </Flex>

                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button variant="soft" color="gray" style={{ borderRadius: "8px" }}>
                                        ❌ Hủy
                                    </Button>
                                </Dialog.Close>
                                <button
                                    className="btn-vietnam"
                                    onClick={handleSubmitAnswer}
                                    disabled={!answer || !salt || isLoading}
                                    style={{ opacity: (!answer || !salt || isLoading) ? 0.5 : 1 }}
                                >
                                    {isLoading ? <ClipLoader size={16} color="white" /> : "🚀 Gửi đáp án"}
                                </button>
                            </Flex>
                        </Dialog.Content>
                    </Dialog.Root>
                )}

                {question.isActive && isCreator && (
                    <Button
                        color="red"
                        variant="soft"
                        onClick={() => onCancel(question.id)}
                        disabled={isLoading}
                        style={{ borderRadius: "12px" }}
                    >
                        🗑️ Hủy câu hỏi
                    </Button>
                )}

                {question.winner && (
                    <div className="winner-card" style={{ padding: "8px 16px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        🎉 <strong>Người thắng:</strong> {question.winner.slice(0, 8)}...
                    </div>
                )}
            </Flex>

            <Text size="1" style={{ color: "#999", marginTop: "1rem", display: "block", paddingLeft: "12px" }}>
                📋 ID: {question.id.slice(0, 20)}... | 👤 Người tạo: {question.creator.slice(0, 10)}...
            </Text>
        </div>
    )
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

const VuaTiengVietGame = () => {
    const currentAccount = useCurrentAccount()
    const {
        address,
        gameStateId,
        questions,
        gameStats,
        transactionState,
        createQuestion,
        submitAnswer,
        cancelQuestion,
        saveGameStateId,
        fetchQuestions,
    } = useVuaTiengViet()

    // Form state cho tạo câu hỏi
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newQuestion, setNewQuestion] = useState("")
    const [newHint, setNewHint] = useState("")
    const [newAnswer, setNewAnswer] = useState("")
    const [newSalt, setNewSalt] = useState("")
    const [newReward, setNewReward] = useState("")
    const [createdSalt, setCreatedSalt] = useState<string | null>(null)

    // Config state
    const [showConfigDialog, setShowConfigDialog] = useState(false)
    const [tempGameStateId, setTempGameStateId] = useState("")

    const isConnected = !!currentAccount

    // Tạo random salt
    const generateSalt = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let result = ""
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setNewSalt(result)
    }

    const handleCreateQuestion = async () => {
        if (!newQuestion || !newAnswer || !newSalt || !newReward) return

        const saltToSave = newSalt
        const rewardInNanos = Math.floor(parseFloat(newReward) * 1_000_000_000)
        await createQuestion(newQuestion, newHint, newAnswer, newSalt, rewardInNanos)

        if (!transactionState.error) {
            setCreatedSalt(saltToSave)
            setShowCreateDialog(false)
            setNewQuestion("")
            setNewHint("")
            setNewAnswer("")
            setNewSalt("")
            setNewReward("")
        }
    }

    const handleSaveConfig = () => {
        if (tempGameStateId) {
            saveGameStateId(tempGameStateId)
            setShowConfigDialog(false)
        }
    }

    // Not connected screen
    if (!isConnected) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                background: "linear-gradient(135deg, #da251d 0%, #ffcd00 50%, #da251d 100%)",
                backgroundSize: "200% 200%",
                animation: "shimmer 3s ease infinite"
            }}>
                <div className="game-card" style={{
                    maxWidth: "500px",
                    width: "100%",
                    padding: "3rem",
                    textAlign: "center",
                    background: "white",
                    borderRadius: "24px"
                }}>
                    <div style={{ fontSize: "80px", marginBottom: "1rem" }}>🇻🇳</div>
                    <Heading size="8" style={{ marginBottom: "0.5rem", color: "#da251d" }}>
                        Vua Tiếng Việt
                    </Heading>
                    <Text size="4" style={{ color: "#666", display: "block", marginBottom: "2rem" }}>
                        Game đố chữ trên blockchain IOTA
                    </Text>

                    <div style={{
                        background: "linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)",
                        padding: "1.5rem",
                        borderRadius: "16px",
                        border: "2px dashed #ffcd00",
                        marginBottom: "1.5rem"
                    }}>
                        <Text size="2" style={{ color: "#666" }}>
                            ✨ Chống gian lận 100%<br />
                            💰 Tự động trả thưởng<br />
                            🔒 Minh bạch trên blockchain
                        </Text>
                    </div>

                    <Text style={{ color: "#da251d", fontWeight: "600" }}>
                        👆 Kết nối ví IOTA để bắt đầu chơi!
                    </Text>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            {/* Header */}
            <div className="header-vietnam">
                <Container style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
                    <Flex justify="between" align="center">
                        <div>
                            <Heading size="7" style={{ color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
                                🇻🇳 Vua Tiếng Việt
                            </Heading>
                            <Text size="2" style={{ color: "rgba(255,255,255,0.9)" }}>
                                Đoán đúng - Nhận thưởng tự động! 🎯
                            </Text>
                        </div>

                        <Flex gap="2">
                            <Dialog.Root open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                                <Dialog.Trigger>
                                    <Button variant="soft" style={{ background: "rgba(255,255,255,0.2)", color: "white", borderRadius: "12px" }}>
                                        ⚙️
                                    </Button>
                                </Dialog.Trigger>

                                <Dialog.Content style={{ maxWidth: 450, borderRadius: "16px" }}>
                                    <Dialog.Title style={{ color: "var(--primary)" }}>⚙️ Cấu hình Game</Dialog.Title>
                                    <Dialog.Description size="2" mb="4">
                                        Nhập Game State ID sau khi deploy contract.
                                    </Dialog.Description>

                                    <label>
                                        <Text as="div" size="2" mb="1" weight="bold">
                                            Game State ID
                                        </Text>
                                        <TextField.Root
                                            value={tempGameStateId}
                                            onChange={(e) => setTempGameStateId(e.target.value)}
                                            placeholder="0x..."
                                        />
                                    </label>

                                    <Flex gap="3" mt="4" justify="end">
                                        <Dialog.Close>
                                            <Button variant="soft" color="gray">Hủy</Button>
                                        </Dialog.Close>
                                        <button className="btn-vietnam" onClick={handleSaveConfig}>
                                            💾 Lưu
                                        </button>
                                    </Flex>
                                </Dialog.Content>
                            </Dialog.Root>

                            <Dialog.Root open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                                <Dialog.Trigger>
                                    <button
                                        className="btn-vietnam"
                                        disabled={!gameStateId}
                                        style={{
                                            background: "white",
                                            color: "#da251d",
                                            opacity: !gameStateId ? 0.5 : 1
                                        }}
                                    >
                                        ➕ Tạo câu hỏi
                                    </button>
                                </Dialog.Trigger>

                                <Dialog.Content style={{ maxWidth: 500, borderRadius: "16px" }}>
                                    <Dialog.Title style={{ color: "var(--primary)" }}>
                                        ✨ Tạo câu hỏi mới
                                    </Dialog.Title>
                                    <Dialog.Description size="2" mb="4">
                                        Đáp án sẽ được mã hóa - <strong style={{ color: "#da251d" }}>không ai có thể sửa!</strong>
                                    </Dialog.Description>

                                    <Flex direction="column" gap="3">
                                        <label>
                                            <Text as="div" size="2" mb="1" weight="bold">📝 Câu hỏi *</Text>
                                            <TextArea
                                                value={newQuestion}
                                                onChange={(e) => setNewQuestion(e.target.value)}
                                                placeholder="Nhập câu hỏi đố chữ..."
                                                style={{ borderRadius: "8px" }}
                                            />
                                        </label>

                                        <label>
                                            <Text as="div" size="2" mb="1" weight="bold">💡 Gợi ý (không bắt buộc)</Text>
                                            <TextField.Root
                                                value={newHint}
                                                onChange={(e) => setNewHint(e.target.value)}
                                                placeholder="Nhập gợi ý..."
                                            />
                                        </label>

                                        <label>
                                            <Text as="div" size="2" mb="1" weight="bold">🎯 Đáp án *</Text>
                                            <TextField.Root
                                                value={newAnswer}
                                                onChange={(e) => setNewAnswer(e.target.value)}
                                                placeholder="Nhập đáp án đúng"
                                            />
                                            <Text size="1" style={{ color: "#da251d", marginTop: "4px", display: "block" }}>
                                                ⚠️ KHÔNG THỂ sửa sau khi tạo!
                                            </Text>
                                        </label>

                                        <label>
                                            <Text as="div" size="2" mb="1" weight="bold">🔑 Salt (mã bí mật) *</Text>
                                            <Flex gap="2">
                                                <TextField.Root
                                                    value={newSalt}
                                                    onChange={(e) => setNewSalt(e.target.value)}
                                                    placeholder="Mã xác minh"
                                                    style={{ flex: 1 }}
                                                />
                                                <Button variant="soft" onClick={generateSalt} style={{ borderRadius: "8px" }}>
                                                    🎲 Random
                                                </Button>
                                            </Flex>
                                            <Text size="1" style={{ color: "#666", marginTop: "4px", display: "block" }}>
                                                📢 Chia sẻ salt cho người chơi để họ trả lời!
                                            </Text>
                                        </label>

                                        <label>
                                            <Text as="div" size="2" mb="1" weight="bold">💰 Tiền thưởng (IOTA) *</Text>
                                            <TextField.Root
                                                type="number"
                                                value={newReward}
                                                onChange={(e) => setNewReward(e.target.value)}
                                                placeholder="VD: 1.5"
                                            />
                                        </label>
                                    </Flex>

                                    <Flex gap="3" mt="4" justify="end">
                                        <Dialog.Close>
                                            <Button variant="soft" color="gray">❌ Hủy</Button>
                                        </Dialog.Close>
                                        <button
                                            className="btn-vietnam"
                                            onClick={handleCreateQuestion}
                                            disabled={!newQuestion || !newAnswer || !newSalt || !newReward || transactionState.isLoading}
                                            style={{ opacity: (!newQuestion || !newAnswer || !newSalt || !newReward || transactionState.isLoading) ? 0.5 : 1 }}
                                        >
                                            {transactionState.isLoading ? <ClipLoader size={16} color="white" /> : "🚀 Tạo câu hỏi"}
                                        </button>
                                    </Flex>
                                </Dialog.Content>
                            </Dialog.Root>
                        </Flex>
                    </Flex>
                </Container>
            </div>

            <Container style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1rem" }}>
                {/* Salt notification */}
                {createdSalt && (
                    <div className="game-card" style={{
                        marginBottom: "1.5rem",
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                        border: "2px solid #4caf50"
                    }}>
                        <Flex justify="between" align="center">
                            <div>
                                <Text weight="bold" style={{ color: "#2e7d32", display: "block", marginBottom: "8px" }}>
                                    ✅ Câu hỏi đã được tạo thành công!
                                </Text>
                                <Text size="2" style={{ color: "#388e3c" }}>
                                    🔑 <strong>Salt của bạn:</strong> <code style={{ background: "#fff", padding: "4px 8px", borderRadius: "4px" }}>{createdSalt}</code>
                                </Text>
                                <Text size="1" style={{ color: "#666", display: "block", marginTop: "4px" }}>
                                    📢 Chia sẻ salt này cho người chơi!
                                </Text>
                            </div>
                            <Flex gap="2">
                                <Button variant="soft" onClick={() => {
                                    navigator.clipboard.writeText(createdSalt)
                                    alert("Đã copy salt!")
                                }}>
                                    📋 Copy
                                </Button>
                                <Button variant="ghost" onClick={() => setCreatedSalt(null)}>✕</Button>
                            </Flex>
                        </Flex>
                    </div>
                )}

                {/* Game Stats */}
                {gameStats && (
                    <div className="game-card stats-card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                        <Heading size="4" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
                            📊 Thống kê Game
                        </Heading>
                        <Flex gap="4" wrap="wrap">
                            <div style={{ textAlign: "center", minWidth: "100px" }}>
                                <Text size="7" weight="bold" style={{ color: "var(--primary)", display: "block" }}>
                                    {gameStats.totalQuestions}
                                </Text>
                                <Text size="2" style={{ color: "#666" }}>Tổng câu hỏi</Text>
                            </div>
                            <div style={{ textAlign: "center", minWidth: "100px" }}>
                                <Text size="7" weight="bold" style={{ color: "#4caf50", display: "block" }}>
                                    {gameStats.totalSolved}
                                </Text>
                                <Text size="2" style={{ color: "#666" }}>Đã giải</Text>
                            </div>
                            <div style={{ textAlign: "center", minWidth: "100px" }}>
                                <Text size="7" weight="bold" style={{ color: "#ff9800", display: "block" }}>
                                    {(gameStats.totalRewardsDistributed / 1_000_000_000).toFixed(2)}
                                </Text>
                                <Text size="2" style={{ color: "#666" }}>IOTA đã phát</Text>
                            </div>
                        </Flex>
                    </div>
                )}

                {/* Config Warning */}
                {!gameStateId && (
                    <div className="game-card" style={{
                        marginBottom: "1.5rem",
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                        border: "2px solid #ff9800"
                    }}>
                        <Text style={{ color: "#e65100" }}>
                            ⚠️ Chưa cấu hình Game State ID. Nhấn ⚙️ để nhập sau khi deploy contract.
                        </Text>
                    </div>
                )}

                {/* Transaction Status */}
                {transactionState.hash && (
                    <div className="game-card" style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        background: "#e8f5e9",
                        border: "1px solid #4caf50"
                    }}>
                        <Text size="2" style={{ color: "#2e7d32" }}>
                            ✅ Transaction: {transactionState.hash.slice(0, 24)}...
                            {transactionState.isConfirmed && " (Đã xác nhận)"}
                        </Text>
                    </div>
                )}

                {transactionState.error && (
                    <div className="game-card" style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        background: "#ffebee",
                        border: "1px solid #f44336"
                    }}>
                        <Text style={{ color: "#c62828" }}>
                            ❌ Lỗi: {transactionState.error.message}
                        </Text>
                    </div>
                )}

                {/* Questions List */}
                <Flex justify="between" align="center" style={{ marginBottom: "1rem" }}>
                    <Heading size="5" style={{ color: "var(--accent)" }}>
                        📝 Danh sách câu hỏi
                    </Heading>
                    <Button
                        variant="soft"
                        onClick={fetchQuestions}
                        disabled={transactionState.isLoading || !gameStateId}
                        style={{ borderRadius: "12px" }}
                    >
                        {transactionState.isLoading ? <ClipLoader size={16} /> : "🔄 Làm mới"}
                    </Button>
                </Flex>

                {transactionState.isLoading && questions.length === 0 ? (
                    <div className="game-card" style={{ padding: "3rem", textAlign: "center" }}>
                        <ClipLoader size={40} color="#da251d" />
                        <Text style={{ marginTop: "1rem", display: "block", color: "#666" }}>
                            Đang tải câu hỏi...
                        </Text>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="game-card" style={{ padding: "3rem", textAlign: "center" }}>
                        <div style={{ fontSize: "60px", marginBottom: "1rem" }}>🎯</div>
                        <Text style={{ color: "#666" }}>
                            Chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên!
                        </Text>
                    </div>
                ) : (
                    questions.map((question) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            onAnswer={submitAnswer}
                            onCancel={cancelQuestion}
                            currentAddress={address}
                            isLoading={transactionState.isLoading}
                        />
                    ))
                )}

                {/* Footer */}
                <div className="footer-vietnam">
                    Vua Tiếng Việt - Powered by IOTA Blockchain
                </div>
            </Container>
        </div>
    )
}

export default VuaTiengVietGame
