// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC5484.sol";

/// @title You can extends this contract to implement Consensual SBTs.
/// @author Bertrand Presles.
/// @notice An implementation of Consensual Soulbound Token.
/// @dev Implements EIP-5484: Consensual Soulbound Tokens - https://eips.ethereum.org/EIPS/eip-5484
abstract contract ERC5484 is IERC5484, ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {

    /// @notice Mapping to store burn authorizations for each token issued.
    mapping (uint256 => BurnAuth) burnAuths;

    /// @notice Constructor of ERC5484.
    constructor (string memory name, string memory symbol) ERC721(name, symbol) {}

    /// @notice Safely mint the SBT.
    /// @dev Same as {xref-ERC5484-_safeMint-address-uint256-BurnAuth-}[`_safeMint`], with an additional `data` parameter which is forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
    function _safeMint(
        address to,
        uint256 tokenId,
        BurnAuth tokenBurnAuth,
        bytes memory data
    ) internal virtual {
        burnAuths[tokenId] = tokenBurnAuth;
        ERC721._safeMint(to, tokenId, data);

        emit Issued(_msgSender(), to, tokenId, tokenBurnAuth);
    }

    /// @notice Safely mints `tokenId` and transfers it to `to` with `tokenBurnAuth` burn policy.
    /// @dev Prefer use this function than the _mint() one.
    ///
    /// Requirements:
    ///
    /// - `tokenId` must not exist.
    /// - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
    ///
    /// Emits a {Transfer} event.
    /// Emits a {Issued} event.
    ///
    /// @param to The recipient address.
    /// @param tokenId The token id to mint.
    /// @param tokenBurnAuth The burn policy to apply for this token.
    function _safeMint(address to, uint256 tokenId, BurnAuth tokenBurnAuth) internal virtual {
        _safeMint(to, tokenId, tokenBurnAuth, "");
    }

    /// @notice Forbid transfer for SBTs.
    /// @dev Transfer is forbidden for ERC 5484 tokens. Reverts systematically.
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override virtual {
        revert("ERC 5484: Transfer is not allowed");
    }

    /// @notice Ensure that burn is only allowed if it complies with the burn policy of the token.
    /// @dev Requirements:
    ///
    /// - `msg.sender` should be the one defined by the burn auth rule.
    /// - `tokenId` must exists
    ///
    /// @param tokenId The token id to burn.
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        // Implements check on burn auths for burn allowance.
        if (burnAuths[tokenId] == BurnAuth.Neither) {
            revert("ERC 5484: Burn is not allowed");
        }
        else if (burnAuths[tokenId] == BurnAuth.IssuerOnly) {
            require(owner() ==  _msgSender(), "ERC 5484: Only the issuer of the token is allowed to burn.");
        }
        else if (burnAuths[tokenId] == BurnAuth.OwnerOnly) {
            require(_ownerOf(tokenId) ==  _msgSender(), "ERC 5484: Only the owner of the token is allowed to burn.");
        }
        else if (burnAuths[tokenId] == BurnAuth.Both) {
            require(_ownerOf(tokenId) ==  _msgSender() || owner() ==  _msgSender(), "ERC 5484: Only the owner or the issuer of the token are allowed to burn.");
        }

        ERC721._burn(tokenId);
    }

    /// @notice Gets the burn authorization information for this token.
    /// @param tokenId The token Id.
    /// @return BurnAuth The burn policy for the token.
    function burnAuth(
        uint256 tokenId
    ) external view returns (BurnAuth) {
        require(_exists(tokenId), "EmployeeCard: token does not exist");
        return burnAuths[tokenId];
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
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
