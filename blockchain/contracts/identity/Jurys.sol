// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../token/ERC5484.sol";

/// @title An SBT for Jury identification
/// @author Colas Vincent
/// @notice this contract generate digital ids for jury's members of a competition.
contract Jurys is ERC5484 {

    /// @notice Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    event JuryMinted(address jury, uint tokenId, string tokerURI);

    constructor (string memory name, string memory symbol) ERC5484(name, symbol) {}

    /// @notice Gets the token URI for the passed token id.
    /// @dev Returns an URI for a given token ID. Revert if the token ID does not exist. May return an empty string.
    /// @param tokenId uint256 ID of the token to query
    /// @return The token URI
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId));
        return _tokenURIs[tokenId];
    }

    /// @notice Sets a token URI for a given token id.
    /// @dev Internal function to set the token URI for a given token. Reverts if the token ID does not exist
    /// @param tokenId uint256 ID of the token to set its URI
    /// @param uri string URI to assign
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId));
        _tokenURIs[tokenId] = uri;
    }

    /// @notice Mint a new jury Consensual SBT token.
    /// @param _recipient Recipient address.
    /// @param _tokenURI The token URI.
    /// emit JuryMinted event when jury is minted.
    function mint(address _recipient, string calldata _tokenURI) external onlyOwner {
        require(balanceOf(_recipient) == 0, "A jury can only have 1 token");

        uint tokenId = this.totalSupply() + 1;
        _safeMint(_recipient, tokenId, BurnAuth.Both);

        require(_exists(tokenId), "Jury: token generation failed");
        _setTokenURI(tokenId, _tokenURI);

        emit JuryMinted(_recipient, tokenId, _tokenURI);

        _approve(owner(), tokenId);
    }

    /// @notice Get tje jury id
    /// @param jury address
    /// @return the jury id
    function getJuryId(address jury) public view returns (uint) {
        require(0 < this.balanceOf(jury), "Jury: This address doesn't have any jury.");

        uint juryTokenId = tokenOfOwnerByIndex(jury, 0);
        _requireMinted(juryTokenId);

        return juryTokenId;
    }

    /// @notice Returns if the SBT is still valid.
    /// @dev A valid token is a token minted
    /// @return True is it's still valid, false otherwise.
    function isTokenValid(uint256 tokenId) public view returns (bool) {
        _requireMinted(tokenId);
        return true;
    }

    /// @notice Burns a jury.
    /// @param jury Current
    function burnCard(address jury) external onlyOwner {
        uint juryTokenId = getJuryId(jury);

        _burn(juryTokenId);

        // Clear metadata (if any)
        if (bytes(_tokenURIs[juryTokenId]).length != 0) {
            delete _tokenURIs[juryTokenId];
        }
    }
}
