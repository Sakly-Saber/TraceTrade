// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TraceTradeToken
 * @dev Demo stablecoin for auction bidding
 */
contract TraceTradeToken is ERC20, Ownable {
    uint8 private _decimals;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10**decimals_);
        }
    }

    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from caller
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from account (with allowance)
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Faucet function for demo purposes
     */
    function faucet(address to, uint256 amount) external {
        require(to != address(0), "Invalid recipient");
        require(amount <= 1000000 * 10**_decimals, "Amount too large for faucet");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
