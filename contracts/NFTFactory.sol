// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTCollection.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";

contract NFTFactory {
    address[] public allCollections;
    address public implementation;

    event CollectionDeployed(address indexed collection, address indexed owner, string name, string symbol);

    constructor() {
        implementation = address(new NFTCollection());
    }

    function deployCollection(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        NFTCollection(clone).initialize(
            name,
            symbol,
            baseTokenURI,
            maxSupply,
            mintPrice,
            maxPerWallet,
            msg.sender
        );

        allCollections.push(clone);

        emit CollectionDeployed(clone, msg.sender, name, symbol);

        return clone;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }
}
