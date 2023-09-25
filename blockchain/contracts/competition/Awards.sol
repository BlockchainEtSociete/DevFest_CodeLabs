// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Awards of participated
/// @author Colas Vincent
/// @notice Smart contract for sending rewards to competition winners
contract Awards is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {

    /// @notice Event when token send to winner
    event AwardSendWinner(string tokenUri, uint tokenId, address _recipient);

    constructor(string memory name, string memory symbol) ERC721(name, symbol){
    }

    /// @notice Mint award winner competition.
    /// @dev event AwardSendWinner when award is minted.
    /// @param _recipient Recipient address.
    /// @param _tokenURI The token URI.
    /// @return the tokenId
    function mint(address _recipient, string memory _tokenURI) public returns(uint){
        uint tokenId = totalSupply() + 1;
        _safeMint(_recipient, tokenId);

        require(_exists(tokenId), "Award: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        emit AwardSendWinner(_tokenURI, tokenId, _recipient);

        return tokenId;
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
