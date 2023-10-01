// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../token/ERC5484.sol";

/// @title Management of Movies
/// @author Colas Vincent
/// @notice Smart contract to generate digital movie for the festival.
contract Movies is ERC5484 {

    /// @notice stock idTokenDirector by tokenIdMovie
    mapping(uint => uint) public directorMovie;

    /// @notice Event when token generated
    event MovieMinted(uint tokenId, string tokenUri);

    constructor(string memory name, string memory symbol) ERC5484(name, symbol){
    }

    /// @notice Mint a new movie.
    /// @dev event MovieMinted when movie is minted.
    /// @param _tokenURI The token URI.
    function mint(address _recipient, string calldata _tokenURI, uint _tokenDirector) external onlyOwner {
        uint tokenId = totalSupply() +1;
        _safeMint(_recipient, tokenId);

        require(_exists(tokenId), "Movie: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        directorMovie[tokenId] = _tokenDirector;

        emit MovieMinted(tokenId, _tokenURI);
    }

    /// @notice Get tokenIdDirector.
    /// @dev search tokenIdDirector with idTokenMovie
    /// @param _tokenIdMovie The token id movie.
    /// @return tokenIdDirector
    function getIdTokenDirector(uint _tokenIdMovie) public view returns(uint) {
        return directorMovie[_tokenIdMovie];
    }
}
