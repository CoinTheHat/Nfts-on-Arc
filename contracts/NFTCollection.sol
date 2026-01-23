// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721A, Ownable {
    // ============ Storage Layout ============
    bool private _initialized;
    // totalMinted is handled by ERC721A (_totalMinted())
    
    uint96 public maxSupply;        
    uint96 public mintPrice;        
    uint96 public maxPerWallet;     
    
    // Timestamps
    uint64 public mintStart;
    uint64 public mintEnd;

    // Metadata
    string private _nameStorage;
    string private _symbolStorage;
    string private baseTokenURI;
    
    address public platformAddress;

    constructor() ERC721A("", "") Ownable(msg.sender) {}

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        uint256 maxPerWallet_,
        uint256 mintStart_,
        uint256 mintEnd_,
        address owner_,
        address platformAddress_
    ) external {
        require(!_initialized, "Already initialized");
        _initialized = true;
        
        _nameStorage = name_;
        _symbolStorage = symbol_;
        _transferOwnership(owner_);
        
        baseTokenURI = baseTokenURI_;
        maxSupply = uint96(maxSupply_);
        mintPrice = uint96(mintPrice_);
        maxPerWallet = uint96(maxPerWallet_);
        mintStart = uint64(mintStart_);
        mintEnd = uint64(mintEnd_);
        platformAddress = platformAddress_;
    }

    // Override name and symbol to return storage values (for Clones)
    function name() public view virtual override returns (string memory) {
        return _nameStorage;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbolStorage;
    }

    // Expose totalMinted for frontend compatibility
    function totalMinted() external view returns (uint256) {
        return _totalMinted();
    }

    function mint() external payable {
        mintMultiple(1);
    }

    // Mint multiple NFTs in one transaction (Optimized with ERC721A)
    function mintMultiple(uint256 quantity) public payable {
        require(quantity > 0, "Quantity must be > 0");
        require(_totalMinted() + quantity <= maxSupply, "Exceeds max supply");
        require(_numberMinted(msg.sender) + quantity <= maxPerWallet, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        require(block.timestamp >= mintStart, "Mint not started");
        require(mintEnd == 0 || block.timestamp <= mintEnd, "Mint ended");

        _mint(msg.sender, quantity);
    }

    function airdrop(address[] calldata recipients) external onlyOwner {
        uint256 len = recipients.length;
        require(_totalMinted() + len <= maxSupply, "Max supply reached");
        
        for (uint256 i; i < len; ) {
            _mint(recipients[i], 1);
            unchecked { ++i; }
        }
    }

    function collectionURI() external view returns (string memory) {
        return baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = uint96(newMintPrice);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        // Calculate 3% platform fee
        uint256 platformFee = (balance * 300) / 10000;
        uint256 ownerAmount = balance - platformFee;

        // Send fee to platform
        (bool feeSuccess, ) = payable(platformAddress).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");

        // Send remaining to owner
        (bool ownerSuccess, ) = payable(owner()).call{value: ownerAmount}("");
        require(ownerSuccess, "Owner transfer failed");
    }
}
