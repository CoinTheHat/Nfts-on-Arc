// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    constructor() ERC721("", "") Ownable(msg.sender) {}
    bool private _initialized;

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
        
        // Manually set name and symbol storage variables if possible, 
        // but ERC721 OpenZeppelin stores them in private variables which we can't access directly in a clone easily without using their Initializable version.
        // HOWEVER, standard OZ ERC721 uses constructor for name/symbol. 
        // For Clones, we usually use 'ERC721Upgradeable' or a custom implementation.
        // To keep it simple and avoid installing new packages (OpenZeppelin Upgradeable), 
        // we will just store name and symbol in public variables and override the name()/symbol() functions.
        
        _name = name_;
        _symbol = symbol_;
        _transferOwnership(owner_);
        
        baseTokenURI = baseTokenURI_;
        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
    }

    // Storage for name and symbol since we can't use constructor
    string private _name;
    string private _symbol;

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function mint() external payable {
        require(totalMinted < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = totalMinted + 1;
        totalMinted++;
        _safeMint(msg.sender, tokenId);
    }

    function airdrop(address[] calldata recipients) external onlyOwner {
        require(totalMinted + recipients.length <= maxSupply, "Max supply reached");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = totalMinted + 1;
            totalMinted++;
            _safeMint(recipients[i], tokenId);
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
        mintPrice = newMintPrice;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
