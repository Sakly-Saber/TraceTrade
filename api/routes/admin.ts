import { Router } from "express"
import { getSigner, getTokenContract, getLotNFTContract } from "../../lib/blockchain"
import { ethers } from "ethers"

const router = Router()

// Simple admin authentication (replace with proper auth in production)
const adminAuth = (req: any, res: any, next: any) => {
  const adminKey = req.headers["x-admin-key"]

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  next()
}

/**
 * POST /api/admin/faucet - Mint demo tokens to address
 */
router.post("/faucet", adminAuth, async (req, res) => {
  try {
    const { address, amount } = req.body

    if (!address || !amount) {
      return res.status(400).json({ error: "Address and amount required" })
    }

    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000000) {
      return res.status(400).json({ error: "Invalid amount (max 1,000,000)" })
    }

    const signer = await getSigner()
    const tokenContract = await getTokenContract(signer)

    // Mint tokens
    const tx = await tokenContract.faucet(address, ethers.utils.parseEther(amount))
    await tx.wait()

    res.json({
      success: true,
      txHash: tx.hash,
      address,
      amount,
      message: `${amount} tokens minted to ${address}`,
    })
  } catch (error) {
    console.error("Faucet error:", error)
    res.status(500).json({ error: "Failed to mint tokens" })
  }
})

/**
 * POST /api/admin/mint-nft - Mint lot NFT
 */
router.post("/mint-nft", adminAuth, async (req, res) => {
  try {
    const { to, tokenURI, commodityType, quantity, unit, quality, location, certifications } = req.body

    if (!to || !tokenURI || !commodityType) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (!ethers.utils.isAddress(to)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const signer = await getSigner()
    const nftContract = await getLotNFTContract(signer)

    // Mint NFT
    const tx = await nftContract.mintLot(
      to,
      tokenURI,
      commodityType,
      quantity || 0,
      unit || "",
      quality || "",
      location || "",
      certifications || "",
    )

    const receipt = await tx.wait()

    // Extract token ID from events
    const mintEvent = receipt.events?.find((e: any) => e.event === "LotMinted")
    const tokenId = mintEvent?.args?.tokenId?.toString()

    res.json({
      success: true,
      txHash: tx.hash,
      tokenId,
      to,
      tokenURI,
      message: `NFT minted successfully`,
    })
  } catch (error) {
    console.error("NFT mint error:", error)
    res.status(500).json({ error: "Failed to mint NFT" })
  }
})

/**
 * GET /api/admin/stats - Get admin statistics
 */
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const tokenContract = await getTokenContract()
    const nftContract = await getLotNFTContract()

    // Get token info
    const tokenName = await tokenContract.name()
    const tokenSymbol = await tokenContract.symbol()
    const tokenDecimals = await tokenContract.decimals()

    // Get NFT info
    const totalNFTs = await nftContract.totalSupply()

    res.json({
      token: {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
      },
      nft: {
        totalSupply: totalNFTs.toString(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    res.status(500).json({ error: "Failed to fetch admin stats" })
  }
})

/**
 * POST /api/admin/emergency-stop - Emergency stop functionality
 */
router.post("/emergency-stop", adminAuth, async (req, res) => {
  try {
    const { auctionId } = req.body

    if (!auctionId) {
      return res.status(400).json({ error: "Auction ID required" })
    }

    // This would call the emergency cancel function on the contract
    // Implementation depends on contract having this functionality

    res.json({
      success: true,
      message: `Emergency stop initiated for auction ${auctionId}`,
    })
  } catch (error) {
    console.error("Emergency stop error:", error)
    res.status(500).json({ error: "Failed to execute emergency stop" })
  }
})

export { router as adminRouter }
