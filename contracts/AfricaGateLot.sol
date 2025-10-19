// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TraceTradeLot
 * @dev NFT contract for tokenized commodity lots
 */
contract TraceTradeLot is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct LotMetadata {
        string commodityType;
        uint256 quantity;
        string unit;
        string quality;
        string location;
        string certifications;
        uint256 createdAt;
        address originalOwner;
    }
    
    mapping(uint256 => LotMetadata) public lotMetadata;
    mapping(address => bool) public authorizedMinters;
    
    event LotMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string commodityType,
        uint256 quantity,
        string location
    );
    
    event MinterAuthorized(address indexed minter, bool authorized);

    constructor() ERC721("Africa Gate Commodity Lot", "AGCL") {
        // Owner is authorized minter by default
        authorizedMinters[msg.sender] = true;
    }

    /**
     * @dev Mint a new commodity lot NFT
     */
    function mintLot(
        address to,
        string memory tokenURI,
        string memory commodityType,
        uint256 quantity,
        string memory unit,
        string memory quality,
        string memory location,
        string memory certifications
    ) external returns (uint256) {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(to != address(0), "Invalid recipient");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        lotMetadata[newTokenId] = LotMetadata({
            commodityType: commodityType,
            quantity: quantity,
            unit: unit,
            quality: quality,
            location: location,
            certifications: certifications,
            createdAt: block.timestamp,
            originalOwner: to
        });
        
        emit LotMinted(newTokenId, to, commodityType, quantity, location);
        
        return newTokenId;
    }

    /**
     * @dev Get lot metadata
     */
    function getLotMetadata(uint256 tokenId) 
        external 
        view 
        returns (LotMetadata memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return lotMetadata[tokenId];
    }

    /**
     * @dev Authorize/deauthorize minters
     */
    function setMinterAuthorization(address minter, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Override to ensure only authorized transfers during auctions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        // Additional logic can be added here for auction restrictions
    }
}
