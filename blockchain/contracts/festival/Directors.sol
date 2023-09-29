// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Management of Director
/// @author Colas Vincent
/// @notice Smart contract to generate digital directors for the festival.
contract Directors is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {

    /// @notice Event when token generated
    event DirectorMinted(uint tokenId, string tokenUri);

    constructor(string memory name, string memory symbol) ERC721(name, symbol){
    }

    /// @notice Mint a new director.
    /// @dev event DirectorMinted when director is minted.
    /// @param _tokenURI The token URI.
    function mint(address _recipient, string calldata _tokenURI) external onlyOwner{
        require(balanceOf(_recipient) == 0, "A director can only have 1 token");

        uint tokenId = totalSupply() +1;
        _safeMint(_recipient, tokenId);

        require(_exists(tokenId), "Director: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        emit DirectorMinted(tokenId, _tokenURI);
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
