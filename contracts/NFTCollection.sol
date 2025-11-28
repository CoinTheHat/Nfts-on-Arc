// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    constructor() ERC721("", "") Ownable(msg.sender) {}
    
    // ============ Storage Layout (Optimized for Gas) ============
    // Slot 0: bool (1 byte) + uint96 (12 bytes) + uint96 (12 bytes) + uint96 (12 bytes) = 1 slot
    bool private _initialized;
    uint96 public totalMinted;      // Max 79B tokens (more than enough)
    uint96 public maxSupply;        // Max 79B tokens
    uint96 public mintPrice;        // Max 79B wei (~79 million ETH, plenty)
    
    // Slot 1-2: strings
    string private _name;
    string private _symbol;
    
    // Slot 3: string
    string private baseTokenURI;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        address owner_
    ) external {
        require(!_initialized, "Already initialized");
        _initialized = true;
        
        _name = name_;
        _symbol = symbol_;
        _transferOwnership(owner_);
        
        baseTokenURI = baseTokenURI_;
        maxSupply = uint96(maxSupply_);
        mintPrice = uint96(mintPrice_);
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
        
        uint256 tokenId;
        unchecked {
            tokenId = ++totalMinted; // Pre-increment saves gas
        }
        _mint(msg.sender, tokenId); // Use _mint instead of _safeMint for gas savings
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
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
