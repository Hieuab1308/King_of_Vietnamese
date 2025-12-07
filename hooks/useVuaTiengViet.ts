"use client"

/**
 * ============================================================================
 * VUA TIẾNG VIỆT - IOTA SMART CONTRACT HOOK
 * ============================================================================
 * 
 * Hook tương tác với smart contract game đố chữ "Vua Tiếng Việt"
 * 
 * Tính năng:
 * - Tạo câu hỏi với đáp án đã hash (chống gian lận)
 * - Trả lời câu hỏi và nhận thưởng tự động
 * - Xem thống kê game
 * 
 * ============================================================================
 */

import { useState, useCallback, useEffect } from "react"
import {
    useCurrentAccount,
    useIotaClient,
    useSignAndExecuteTransaction,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useNetworkVariable } from "@/lib/config"
import { GAME_STATE_ID } from "@/lib/config"
import { keccak256 } from "js-sha3"

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

export const CONTRACT_MODULE = "contract"
export const CONTRACT_METHODS = {
    CREATE_QUESTION: "create_question",
    SUBMIT_ANSWER: "submit_answer",
    CANCEL_QUESTION: "cancel_question",
    ADD_REWARD: "add_reward",
    HASH_ANSWER: "hash_answer",
} as const

// ============================================================================
// TYPES
// ============================================================================

export interface Question {
    id: string
    questionText: string
    hint: string
    rewardAmount: number
    isActive: boolean
    creator: string
    createdAt: number
    deadline: number
    winner: string | null
}

export interface GameStats {
    totalQuestions: number
    totalSolved: number
    totalRewardsDistributed: number
}

export interface TransactionState {
    isLoading: boolean
    isPending: boolean
    hash: string | undefined
    error: Error | null
    isConfirmed: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash đáp án với salt sử dụng keccak256
 * Phải khớp với cách hash trong smart contract
 */
export function hashAnswer(answer: string, salt: string): string {
    const data = answer + salt
    const hash = keccak256(data)
    return hash
}

/**
 * Chuyển string thành vector<u8> (bytes)
 */
export function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

/**
 * Chuyển hex string thành bytes array
 */
export function hexToBytes(hex: string): number[] {
    const bytes: number[] = []
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16))
    }
    return bytes
}

/**
 * Chuyển bytes thành string
 */
export function bytesToString(bytes: number[] | Uint8Array): string {
    return new TextDecoder().decode(new Uint8Array(bytes))
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useVuaTiengViet = () => {
    const currentAccount = useCurrentAccount()
    const address = currentAccount?.address
    const packageId = useNetworkVariable("packageId")
    const iotaClient = useIotaClient()
    const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

    // State
    const [gameStateId, setGameStateId] = useState<string | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [gameStats, setGameStats] = useState<GameStats | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hash, setHash] = useState<string | undefined>()
    const [error, setError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState(false)

    // Load game state ID from config or localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Ưu tiên dùng GAME_STATE_ID từ config
            if (GAME_STATE_ID) {
                setGameStateId(GAME_STATE_ID)
            } else {
                const savedGameStateId = localStorage.getItem("vuaTiengViet_gameStateId")
                if (savedGameStateId) {
                    setGameStateId(savedGameStateId)
                }
            }
        }
    }, [])

    // Save game state ID to localStorage
    const saveGameStateId = (id: string) => {
        setGameStateId(id)
        if (typeof window !== "undefined") {
            localStorage.setItem("vuaTiengViet_gameStateId", id)
        }
    }

    /**
     * Fetch GameState object để lấy thống kê
     */
    const fetchGameStats = useCallback(async () => {
        if (!gameStateId || !iotaClient) return

        try {
            const response = await iotaClient.getObject({
                id: gameStateId,
                options: { showContent: true },
            })

            if (response.data?.content?.dataType === "moveObject") {
                const fields = response.data.content.fields as any
                setGameStats({
                    totalQuestions: parseInt(fields.total_questions || "0"),
                    totalSolved: parseInt(fields.total_solved || "0"),
                    totalRewardsDistributed: parseInt(fields.total_rewards_distributed || "0"),
                })
            }
        } catch (err) {
            console.error("Error fetching game stats:", err)
        }
    }, [gameStateId, iotaClient])

    /**
     * Fetch danh sách câu hỏi
     */
    const fetchQuestions = useCallback(async () => {
        if (!packageId || !iotaClient) return

        try {
            setIsLoading(true)

            // Query tất cả Question objects thuộc package này
            const response = await iotaClient.queryEvents({
                query: {
                    MoveEventType: `${packageId}::${CONTRACT_MODULE}::QuestionCreated`,
                },
                limit: 50,
                order: "descending",
            })

            const questionsList: Question[] = []

            for (const event of response.data) {
                const eventData = event.parsedJson as any
                const questionId = eventData.question_id

                try {
                    // Fetch chi tiết câu hỏi
                    const questionObj = await iotaClient.getObject({
                        id: questionId,
                        options: { showContent: true },
                    })

                    if (questionObj.data?.content?.dataType === "moveObject") {
                        const fields = questionObj.data.content.fields as any
                        questionsList.push({
                            id: questionId,
                            questionText: bytesToString(fields.question_text || []),
                            hint: bytesToString(fields.hint || []),
                            rewardAmount: parseInt(fields.reward?.fields?.balance || "0"),
                            isActive: fields.is_active,
                            creator: fields.creator,
                            createdAt: parseInt(fields.created_at || "0"),
                            deadline: parseInt(fields.deadline || "0"),
                            winner: fields.winner?.fields?.value || null,
                        })
                    }
                } catch (err) {
                    console.error(`Error fetching question ${questionId}:`, err)
                }
            }

            setQuestions(questionsList)
        } catch (err) {
            console.error("Error fetching questions:", err)
        } finally {
            setIsLoading(false)
        }
    }, [packageId, iotaClient])

    /**
     * Tạo câu hỏi mới
     */
    const createQuestion = async (
        questionText: string,
        hint: string,
        answer: string,
        salt: string,
        rewardAmount: number,
        deadline: number = 0
    ) => {
        if (!packageId || !gameStateId) {
            setError(new Error("Package ID hoặc Game State ID chưa được cấu hình"))
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            setHash(undefined)
            setIsConfirmed(false)

            // Debug log
            console.log("Creating question with:", {
                packageId,
                gameStateId,
                questionText,
                hint,
                answer,
                salt,
                rewardAmount,
                deadline
            })

            // Kiểm tra rewardAmount
            if (rewardAmount <= 0) {
                setError(new Error("Tiền thưởng phải lớn hơn 0"))
                setIsLoading(false)
                return
            }

            // Hash đáp án
            const answerHash = hashAnswer(answer, salt)
            const answerHashBytes = hexToBytes(answerHash)

            console.log("Answer hash:", answerHash)
            console.log("Answer hash bytes:", answerHashBytes)

            const tx = new Transaction()

            // Set gas budget
            tx.setGasBudget(50000000)

            // Split coin cho reward
            const [rewardCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(rewardAmount)])

            tx.moveCall({
                target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE_QUESTION}`,
                arguments: [
                    tx.object(gameStateId),
                    tx.pure.vector("u8", stringToBytes(questionText)),
                    tx.pure.vector("u8", stringToBytes(hint)),
                    tx.pure.vector("u8", answerHashBytes),
                    rewardCoin,
                    tx.pure.u64(deadline),
                ],
            })

            signAndExecute(
                { transaction: tx as any },
                {
                    onSuccess: async ({ digest }) => {
                        setHash(digest)
                        await iotaClient.waitForTransaction({ digest })
                        setIsConfirmed(true)
                        await fetchQuestions()
                        await fetchGameStats()
                        setIsLoading(false)
                    },
                    onError: (err) => {
                        const error = err instanceof Error ? err : new Error(String(err))
                        setError(error)
                        console.error("Error creating question:", err)
                        setIsLoading(false)
                    },
                }
            )
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            console.error("Error creating question:", err)
            setIsLoading(false)
        }
    }

    /**
     * Trả lời câu hỏi
     */
    const submitAnswer = async (
        questionId: string,
        answer: string,
        salt: string
    ) => {
        if (!packageId || !gameStateId) {
            setError(new Error("Package ID hoặc Game State ID chưa được cấu hình"))
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            setHash(undefined)
            setIsConfirmed(false)

            const tx = new Transaction()

            tx.moveCall({
                target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.SUBMIT_ANSWER}`,
                arguments: [
                    tx.object(gameStateId),
                    tx.object(questionId),
                    tx.pure.vector("u8", stringToBytes(answer)),
                    tx.pure.vector("u8", stringToBytes(salt)),
                ],
            })

            signAndExecute(
                { transaction: tx as any },
                {
                    onSuccess: async ({ digest }) => {
                        setHash(digest)
                        await iotaClient.waitForTransaction({ digest })
                        setIsConfirmed(true)
                        await fetchQuestions()
                        await fetchGameStats()
                        setIsLoading(false)
                    },
                    onError: (err) => {
                        const error = err instanceof Error ? err : new Error(String(err))
                        setError(error)
                        console.error("Error submitting answer:", err)
                        setIsLoading(false)
                    },
                }
            )
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            console.error("Error submitting answer:", err)
            setIsLoading(false)
        }
    }

    /**
     * Hủy câu hỏi (chỉ creator hoặc admin)
     */
    const cancelQuestion = async (questionId: string) => {
        if (!packageId || !gameStateId) {
            setError(new Error("Package ID hoặc Game State ID chưa được cấu hình"))
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            setHash(undefined)
            setIsConfirmed(false)

            const tx = new Transaction()

            tx.moveCall({
                target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CANCEL_QUESTION}`,
                arguments: [
                    tx.object(gameStateId),
                    tx.object(questionId),
                ],
            })

            signAndExecute(
                { transaction: tx as any },
                {
                    onSuccess: async ({ digest }) => {
                        setHash(digest)
                        await iotaClient.waitForTransaction({ digest })
                        setIsConfirmed(true)
                        await fetchQuestions()
                        await fetchGameStats()
                        setIsLoading(false)
                    },
                    onError: (err) => {
                        const error = err instanceof Error ? err : new Error(String(err))
                        setError(error)
                        console.error("Error cancelling question:", err)
                        setIsLoading(false)
                    },
                }
            )
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            console.error("Error cancelling question:", err)
            setIsLoading(false)
        }
    }

    /**
     * Thêm tiền thưởng cho câu hỏi
     */
    const addReward = async (questionId: string, amount: number) => {
        if (!packageId) {
            setError(new Error("Package ID chưa được cấu hình"))
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            setHash(undefined)
            setIsConfirmed(false)

            const tx = new Transaction()

            const [rewardCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])

            tx.moveCall({
                target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.ADD_REWARD}`,
                arguments: [
                    tx.object(questionId),
                    rewardCoin,
                ],
            })

            signAndExecute(
                { transaction: tx as any },
                {
                    onSuccess: async ({ digest }) => {
                        setHash(digest)
                        await iotaClient.waitForTransaction({ digest })
                        setIsConfirmed(true)
                        await fetchQuestions()
                        setIsLoading(false)
                    },
                    onError: (err) => {
                        const error = err instanceof Error ? err : new Error(String(err))
                        setError(error)
                        console.error("Error adding reward:", err)
                        setIsLoading(false)
                    },
                }
            )
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            console.error("Error adding reward:", err)
            setIsLoading(false)
        }
    }

    // Auto-fetch khi có gameStateId
    useEffect(() => {
        if (gameStateId && packageId) {
            fetchQuestions()
            fetchGameStats()
        }
    }, [gameStateId, packageId, fetchQuestions, fetchGameStats])

    const transactionState: TransactionState = {
        isLoading: isLoading || isPending,
        isPending,
        hash,
        error,
        isConfirmed,
    }

    return {
        // State
        address,
        packageId,
        gameStateId,
        questions,
        gameStats,
        transactionState,

        // Actions
        createQuestion,
        submitAnswer,
        cancelQuestion,
        addReward,
        fetchQuestions,
        fetchGameStats,
        saveGameStateId,

        // Helpers
        hashAnswer,
        stringToBytes,
        hexToBytes,
    }
}
