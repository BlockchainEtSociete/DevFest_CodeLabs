// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Management of Movies
/// @author Colas Vincent
/// @notice Smart contract to generate digital movie for the festival.
contract Movies is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {

    /// @notice stock idTokenDirector by tokenIdMovie
    mapping(uint => uint) public directorMovie;

    /// @notice Event when token generated
    event MovieMinted(uint tokenId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol){
    }

    /// @notice Mint a new movie.
    /// @dev event MovieMinted when movie is minted.
    /// @param _tokenURI The token URI.
    function mint(string memory _tokenURI, uint _tokenDirector) external onlyOwner{
        uint tokenId = totalSupply() +1;
        _safeMint(owner(), tokenId);

        require(_exists(tokenId), "Movie: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        directorMovie[tokenId] = _tokenDirector;

        emit MovieMinted(tokenId);
    }

    /// @notice Get tokenIdDirector.
    /// @dev search tokenIdDirector with idTokenMovie
    /// @param _tokenIdMovie The token id movie.
    /// @return tokenIdDirector
    function getIdTokenDirector(uint _tokenIdMovie) public view returns(uint) {
        return directorMovie[_tokenIdMovie];
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
