// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../token/ERC5484.sol";

/// @title Management of Actor
/// @author Colas Vincent
/// @notice Smart contract to generate digital actors for the festival.
contract Actors is ERC5484 {

    /// @notice Event when token generated
    event ActorMinted(uint tokenId, string tokenUri);

    constructor(string memory name, string memory symbol) ERC5484(name, symbol) {
    }

    /// @notice Mint a new actor.
    /// @dev event ActorMinted when actor is minted.
    /// @param _tokenURI The token URI.
    function mint(address _recipient, string calldata _tokenURI) external onlyOwner {
        require(balanceOf(_recipient) == 0, "An actor can only have 1 token");

        // TODO: Calculate tokenId
        // TODO: Implement mint

        require(_exists(tokenId), "Actor: token generation failed");
        // TODO: set tokenURI

        // TODO: emit ActorMinted event
    }
}
