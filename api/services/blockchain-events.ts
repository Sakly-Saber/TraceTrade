import { ethers } from "ethers"
import { getProvider, getAuctionHouseContract } from "../../lib/blockchain"
import { AuditLogger } from "../../lib/hedera-consensus"

class BlockchainEventListener {
  private provider: ethers.providers.JsonRpcProvider
  private contract: ethers.Contract | null = null
  private isListening = false

  constructor() {
    this.provider = getProvider()
  }

  async start() {
    if (this.isListening) {
      console.log("Event listener already running")
      return
    }

    try {
      this.contract = await getAuctionHouseContract()
      this.setupEventListeners()
      this.isListening = true
      console.log("✅ Blockchain event listener started")
    } catch (error) {
      console.error("Failed to start event listener:", error)
      throw error
    }
  }

  stop() {
    if (this.contract) {
      this.contract.removeAllListeners()
    }
    this.isListening = false
    console.log("🛑 Blockchain event listener stopped")
  }

  private setupEventListeners() {
    if (!this.contract) return

    // Listen for AuctionCreated events
    this.contract.on(
      "AuctionCreated",
      async (
        auctionId: ethers.BigNumber,
        seller: string,
        nftContract: string,
        tokenId: ethers.BigNumber,
        reservePrice: ethers.BigNumber,
        startTime: ethers.BigNumber,
        endTime: ethers.BigNumber,
        event: ethers.Event,
      ) => {
        console.log(`🏛️ Auction Created: ${auctionId.toString()}`)

        try {
          await AuditLogger.logAuctionCreated(auctionId.toNumber(), seller, tokenId.toString(), event.transactionHash)
        } catch (error) {
          console.error("Failed to log auction creation to HCS:", error)
        }
      },
    )

    // Listen for BidPlaced events
    this.contract.on(
      "BidPlaced",
      async (
        auctionId: ethers.BigNumber,
        bidder: string,
        amount: ethers.BigNumber,
        timestamp: ethers.BigNumber,
        event: ethers.Event,
      ) => {
        console.log(`💰 Bid Placed: ${ethers.utils.formatEther(amount)} HBAR on auction ${auctionId.toString()}`)

        try {
          await AuditLogger.logBid(
            auctionId.toNumber(),
            bidder,
            ethers.utils.formatEther(amount),
            event.transactionHash,
          )
        } catch (error) {
          console.error("Failed to log bid to HCS:", error)
        }
      },
    )

    // Listen for AuctionSettled events
    this.contract.on(
      "AuctionSettled",
      async (auctionId: ethers.BigNumber, winner: string, finalAmount: ethers.BigNumber, event: ethers.Event) => {
        console.log(`🎯 Auction Settled: ${auctionId.toString()} won by ${winner}`)

        try {
          await AuditLogger.logAuctionSettled(
            auctionId.toNumber(),
            winner,
            ethers.utils.formatEther(finalAmount),
            event.transactionHash,
          )
        } catch (error) {
          console.error("Failed to log auction settlement to HCS:", error)
        }
      },
    )

    // Handle connection errors
    this.provider.on("error", (error) => {
      console.error("Provider error:", error)
      // Attempt to reconnect
      setTimeout(() => {
        if (!this.isListening) return
        console.log("Attempting to reconnect...")
        this.start().catch(console.error)
      }, 5000)
    })
  }

  async getRecentEvents(fromBlock = "latest", toBlock = "latest") {
    if (!this.contract) {
      throw new Error("Contract not initialized")
    }

    try {
      const events = await this.contract.queryFilter("*", fromBlock, toBlock)
      return events.map((event) => ({
        event: event.event,
        args: event.args,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: event.blockNumber, // This would need to be resolved to actual timestamp
      }))
    } catch (error) {
      console.error("Failed to query events:", error)
      throw error
    }
  }
}

export const blockchainEventListener = new BlockchainEventListener()
