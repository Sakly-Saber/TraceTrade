// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AuctionHouse
 * @dev Smart contract for managing B2B commodity auctions with NFT escrow
 */
contract AuctionHouse is ReentrancyGuard, Ownable {
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        address currency; // ERC-20 address or address(0) for native HBAR
        uint256 reservePrice;
        uint256 startTime;
        uint256 endTime;
        bool settled;
        address highestBidder;
        uint256 highestBid;
        uint16 feeBps; // Fee in basis points (e.g., 100 = 1%)
        string metadataURI;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
    }

    // State variables
    address public feeReceiver;
    uint256 public auctionCount;
    uint256 public constant MAX_FEE_BPS = 1000; // 10% maximum fee
    
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => bool) public approvedCurrencies;
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );
    
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalAmount
    );
    
    event AuctionCancelled(uint256 indexed auctionId);
    
    event CurrencyApproved(address indexed currency, bool approved);

    constructor(address _feeReceiver) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
        
        // Approve native currency (HBAR) by default
        approvedCurrencies[address(0)] = true;
    }

    /**
     * @dev Create a new auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        address currency,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        uint16 feeBps,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 auctionId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(approvedCurrencies[currency], "Currency not approved");
        require(startTime < endTime, "Invalid time range");
        require(startTime >= block.timestamp, "Start time in past");
        require(feeBps <= MAX_FEE_BPS, "Fee too high");
        require(reservePrice > 0, "Reserve price must be > 0");

        // Transfer NFT to escrow
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        auctionId = ++auctionCount;
        
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            currency: currency,
            reservePrice: reservePrice,
            startTime: startTime,
            endTime: endTime,
            settled: false,
            highestBidder: address(0),
            highestBid: 0,
            feeBps: feeBps,
            metadataURI: metadataURI
        });

        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            reservePrice,
            startTime,
            endTime
        );
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId, uint256 amount) 
        external 
        payable 
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "Auction does not exist");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(!auction.settled, "Auction already settled");
        require(amount > auction.highestBid, "Bid too low");
        require(amount >= auction.reservePrice, "Below reserve price");

        // Handle payment based on currency type
        if (auction.currency == address(0)) {
            // Native HBAR payment
            require(msg.value == amount, "Incorrect HBAR amount");
            
            // Refund previous highest bidder
            if (auction.highestBidder != address(0) && auction.highestBid > 0) {
                (bool success, ) = auction.highestBidder.call{value: auction.highestBid}("");
                require(success, "Refund failed");
            }
        } else {
            // ERC-20 payment
            IERC20 token = IERC20(auction.currency);
            
            // Transfer new bid amount from bidder
            require(
                token.transferFrom(msg.sender, address(this), amount),
                "Token transfer failed"
            );
            
            // Refund previous highest bidder
            if (auction.highestBidder != address(0) && auction.highestBid > 0) {
                require(
                    token.transfer(auction.highestBidder, auction.highestBid),
                    "Refund failed"
                );
            }
        }

        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = amount;

        // Record bid
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        }));

        emit BidPlaced(auctionId, msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Settle an auction after it ends
     */
    function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "Auction does not exist");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Already settled");

        auction.settled = true;

        if (auction.highestBidder == address(0) || auction.highestBid < auction.reservePrice) {
            // No valid bids - return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
            
            emit AuctionCancelled(auctionId);
            return;
        }

        // Calculate fees and payout
        uint256 fee = (auction.highestBid * auction.feeBps) / 10000;
        uint256 sellerPayout = auction.highestBid - fee;

        // Transfer payments
        if (auction.currency == address(0)) {
            // Native HBAR
            if (fee > 0) {
                (bool feeSuccess, ) = feeReceiver.call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            }
            
            (bool payoutSuccess, ) = auction.seller.call{value: sellerPayout}("");
            require(payoutSuccess, "Seller payout failed");
        } else {
            // ERC-20
            IERC20 token = IERC20(auction.currency);
            
            if (fee > 0) {
                require(token.transfer(feeReceiver, fee), "Fee transfer failed");
            }
            
            require(token.transfer(auction.seller, sellerPayout), "Seller payout failed");
        }

        // Transfer NFT to winner
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.highestBidder,
            auction.tokenId
        );

        emit AuctionSettled(auctionId, auction.highestBidder, auction.highestBid);
    }

    /**
     * @dev Get auction details
     */
    function getAuction(uint256 auctionId) 
        external 
        view 
        returns (Auction memory) 
    {
        return auctions[auctionId];
    }

    /**
     * @dev Get bid history for an auction
     */
    function getBids(uint256 auctionId) 
        external 
        view 
        returns (Bid[] memory) 
    {
        return auctionBids[auctionId];
    }

    /**
     * @dev Admin function to approve/disapprove currencies
     */
    function setCurrencyApproval(address currency, bool approved) 
        external 
        onlyOwner 
    {
        approvedCurrencies[currency] = approved;
        emit CurrencyApproved(currency, approved);
    }

    /**
     * @dev Admin function to update fee receiver
     */
    function setFeeReceiver(address newFeeReceiver) external onlyOwner {
        require(newFeeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = newFeeReceiver;
    }

    /**
     * @dev Emergency function to cancel auction (only owner)
     */
    function emergencyCancelAuction(uint256 auctionId) external onlyOwner {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "Auction does not exist");
        require(!auction.settled, "Already settled");

        auction.settled = true;

        // Refund highest bidder if exists
        if (auction.highestBidder != address(0) && auction.highestBid > 0) {
            if (auction.currency == address(0)) {
                (bool success, ) = auction.highestBidder.call{value: auction.highestBid}("");
                require(success, "Refund failed");
            } else {
                IERC20 token = IERC20(auction.currency);
                require(token.transfer(auction.highestBidder, auction.highestBid), "Refund failed");
            }
        }

        // Return NFT to seller
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Handle NFT transfers
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Fallback function to receive HBAR
     */
    receive() external payable {}
}
