// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../token/ERC5484.sol";

/// @title Management of Director
/// @author Colas Vincent
/// @notice Smart contract to generate digital directors for the festival.
contract Directors is ERC5484 {

    /// @notice Event when token generated
    event DirectorMinted(uint tokenId, string tokenUri);

    constructor(string memory name, string memory symbol) ERC5484(name, symbol) {
    }

    /// @notice Mint a new director.
    /// @dev event DirectorMinted when director is minted.
    /// @param _tokenURI The token URI.
    function mint(address _recipient, string calldata _tokenURI) external onlyOwner {
        require(balanceOf(_recipient) == 0, "A director can only have 1 token");

        uint tokenId = totalSupply() +1;
        _safeMint(_recipient, tokenId);

        require(_exists(tokenId), "Director: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        emit DirectorMinted(tokenId, _tokenURI);
    }
}
