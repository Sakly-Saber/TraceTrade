/**
 * Hedera Consensus Service (HCS) integration for audit logging
 */

import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk"

// HCS Configuration
const HCS_CONFIG = {
  ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID || "",
  PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY || "",
  TOPIC_ID: process.env.HCS_TOPIC_ID || "",
  MIRROR_NODE_URL: process.env.MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com",
}

// Initialize Hedera client
function getHederaClient(): Client {
  if (!HCS_CONFIG.ACCOUNT_ID || !HCS_CONFIG.PRIVATE_KEY) {
    throw new Error("Hedera credentials not configured")
  }

  const client = Client.forTestnet()
  client.setOperator(AccountId.fromString(HCS_CONFIG.ACCOUNT_ID), PrivateKey.fromString(HCS_CONFIG.PRIVATE_KEY))

  return client
}

// Message types for audit logging
export interface AuditMessage {
  type: "bid" | "auction_created" | "auction_settled" | "nft_minted"
  timestamp: number
  data: any
  txHash?: string
  blockNumber?: number
}

/**
 * Create a new HCS topic for audit logging
 */
export async function createAuditTopic(): Promise<string> {
  const client = getHederaClient()

  try {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo("TraceTrade Auction Audit Log")
      .setSubmitKey(PrivateKey.fromString(HCS_CONFIG.PRIVATE_KEY))

    const response = await transaction.execute(client)
    const receipt = await response.getReceipt(client)

    if (!receipt.topicId) {
      throw new Error("Failed to create topic")
    }

    return receipt.topicId.toString()
  } finally {
    client.close()
  }
}

/**
 * Submit an audit message to HCS
 */
export async function submitAuditMessage(message: AuditMessage): Promise<string> {
  if (!HCS_CONFIG.TOPIC_ID) {
    throw new Error("HCS Topic ID not configured")
  }

  const client = getHederaClient()

  try {
    const messageJson = JSON.stringify({
      ...message,
      timestamp: Date.now(),
    })

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(HCS_CONFIG.TOPIC_ID))
      .setMessage(messageJson)

    const response = await transaction.execute(client)
    const receipt = await response.getReceipt(client)

    return response.transactionId.toString()
  } finally {
    client.close()
  }
}

/**
 * Fetch messages from HCS topic via Mirror Node
 */
export async function fetchAuditMessages(limit = 100): Promise<AuditMessage[]> {
  if (!HCS_CONFIG.TOPIC_ID) {
    throw new Error("HCS Topic ID not configured")
  }

  try {
    const response = await fetch(
      `${HCS_CONFIG.MIRROR_NODE_URL}/api/v1/topics/${HCS_CONFIG.TOPIC_ID}/messages?limit=${limit}&order=desc`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch messages from Mirror Node")
    }

    const data = await response.json()

    return data.messages
      .map((msg: any) => {
        try {
          const decodedMessage = atob(msg.message)
          return JSON.parse(decodedMessage) as AuditMessage
        } catch (error) {
          console.error("Failed to parse message:", error)
          return null
        }
      })
      .filter(Boolean)
  } catch (error) {
    console.error("Error fetching audit messages:", error)
    throw error
  }
}

/**
 * Stream real-time messages from HCS topic
 */
export function subscribeToAuditMessages(
  callback: (message: AuditMessage) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!HCS_CONFIG.TOPIC_ID) {
    throw new Error("HCS Topic ID not configured")
  }

  let isSubscribed = true
  let lastTimestamp = Date.now()

  const poll = async () => {
    if (!isSubscribed) return

    try {
      const response = await fetch(
        `${HCS_CONFIG.MIRROR_NODE_URL}/api/v1/topics/${HCS_CONFIG.TOPIC_ID}/messages?timestamp=gt:${lastTimestamp / 1000}&order=asc`,
      )

      if (response.ok) {
        const data = await response.json()

        data.messages.forEach((msg: any) => {
          try {
            const decodedMessage = atob(msg.message)
            const auditMessage = JSON.parse(decodedMessage) as AuditMessage
            callback(auditMessage)
            lastTimestamp = Math.max(lastTimestamp, auditMessage.timestamp)
          } catch (error) {
            console.error("Failed to parse message:", error)
          }
        })
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Unknown error"))
      }
    }

    // Poll every 5 seconds
    setTimeout(poll, 5000)
  }

  // Start polling
  poll()

  // Return unsubscribe function
  return () => {
    isSubscribed = false
  }
}

/**
 * Helper functions for creating specific audit messages
 */
export const AuditLogger = {
  async logBid(auctionId: number, bidder: string, amount: string, txHash: string) {
    return submitAuditMessage({
      type: "bid",
      timestamp: Date.now(),
      data: {
        auctionId,
        bidder,
        amount,
      },
      txHash,
    })
  },

  async logAuctionCreated(auctionId: number, seller: string, nftTokenId: string, txHash: string) {
    return submitAuditMessage({
      type: "auction_created",
      timestamp: Date.now(),
      data: {
        auctionId,
        seller,
        nftTokenId,
      },
      txHash,
    })
  },

  async logAuctionSettled(auctionId: number, winner: string, finalAmount: string, txHash: string) {
    return submitAuditMessage({
      type: "auction_settled",
      timestamp: Date.now(),
      data: {
        auctionId,
        winner,
        finalAmount,
      },
      txHash,
    })
  },

  async logNFTMinted(tokenId: string, owner: string, commodityType: string, txHash: string) {
    return submitAuditMessage({
      type: "nft_minted",
      timestamp: Date.now(),
      data: {
        tokenId,
        owner,
        commodityType,
      },
      txHash,
    })
  },
}
