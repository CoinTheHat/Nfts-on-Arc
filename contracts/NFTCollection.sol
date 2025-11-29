// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    constructor() ERC721("", "") Ownable(msg.sender) {}
    
    // ============ Storage Layout (Optimized for Gas) ============
    // Slot 0: bool (1 byte) + uint96 (12 bytes) + uint96 (12 bytes) + uint96 (12 bytes) = 37 bytes (2 slots)
    bool private _initialized;
    uint96 public totalMinted;      // Max 79B tokens
    uint96 public maxSupply;        // Max 79B tokens
    uint96 public mintPrice;        // Max 79B wei
    uint96 public maxPerWallet;     // Max tokens per wallet
    
    // Slot 1: Timestamps (Packed)
    uint64 public mintStart;
    uint64 public mintEnd;

    // Slot 2-3: strings
    string private _name;
    string private _symbol;
    
    // Slot 4: string
    // Slot 4: string + address
    string private baseTokenURI;
    address public platformAddress;

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
        
        _name = name_;
        _symbol = symbol_;
        _transferOwnership(owner_);
        
        baseTokenURI = baseTokenURI_;
        maxSupply = uint96(maxSupply_);
        mintPrice = uint96(mintPrice_);
        maxPerWallet = uint96(maxPerWallet_);
        mintStart = uint64(mintStart_);
        mintEnd = uint64(mintEnd_);
        platformAddress = platformAddress_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function mint() external payable {
        require(totalMinted < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(balanceOf(msg.sender) < maxPerWallet, "Max per wallet reached");
        require(block.timestamp >= mintStart, "Mint not started");
        require(mintEnd == 0 || block.timestamp <= mintEnd, "Mint ended");
        
        uint256 tokenId;
        unchecked {
            tokenId = ++totalMinted; // Pre-increment saves gas
        }
        _mint(msg.sender, tokenId); // Use _mint instead of _safeMint for gas savings
    }

    // Mint multiple NFTs in one transaction
    function mintMultiple(uint256 quantity) external payable {
        require(quantity > 0, "Quantity must be > 0");
        require(totalMinted + quantity <= maxSupply, "Exceeds max supply");
        require(balanceOf(msg.sender) + quantity <= maxPerWallet, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        require(block.timestamp >= mintStart, "Mint not started");
        require(mintEnd == 0 || block.timestamp <= mintEnd, "Mint ended");

        uint256 nextId = totalMinted;
        unchecked {
            for (uint256 i; i < quantity; ++i) {
                _mint(msg.sender, ++nextId);
            }
            totalMinted = uint96(nextId);
        }
    }

    function airdrop(address[] calldata recipients) external onlyOwner {
        uint256 len = recipients.length;
        require(totalMinted + len <= maxSupply, "Max supply reached");
        
        uint256 nextId = totalMinted;
        unchecked {
            for (uint256 i; i < len; ++i) {
                _mint(recipients[i], ++nextId);
            }
            totalMinted = uint96(nextId);
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

        // Calculate 0.5% platform fee
        // 0.5% = 50 basis points (out of 10000)
        uint256 platformFee = (balance * 50) / 10000;
        uint256 ownerAmount = balance - platformFee;

        // Send fee to platform
        (bool feeSuccess, ) = payable(platformAddress).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");

        // Send remaining to owner
        (bool ownerSuccess, ) = payable(owner()).call{value: ownerAmount}("");
        require(ownerSuccess, "Owner transfer failed");
    }
}
