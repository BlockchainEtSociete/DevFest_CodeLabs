import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import dayjs from "dayjs";

describe("Actors Test", function () {
  async function deployActors() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2] = await ethers.getSigners();

    const Actors = await ethers.getContractFactory("Actors");
    const actors = await Actors.deploy("DevFest Actors","DFA");

    return { actors, owner, user1, user2 };
  }

  context("Deployment", () => {
    it("Should get contract address", async function () {
      const { actors } = await loadFixture(deployActors);

      expect(await actors.address).not.to.be.undefined;
    });
  });

  context("SBT Tests", () => {
    it("Require - Should revert on trying to transfer", async () => {
      const { actors, owner, user1 } = await loadFixture(deployActors);

      await actors.connect(owner).mint(user1.address, 'https://www.alyra.fr');

      await expect(actors.connect(user1).transferFrom(user1.address, owner.address, 1))
          .to.be.revertedWith("ERC 5484: Transfer is not allowed");
    })
  })

  context("Mint", () => {
    it("Require - Should revert when already minted", async () => {
      const { actors, owner, user1 } = await loadFixture(deployActors);

      await actors.connect(owner).mint(user1.address, 'https://www.blockchainsociete.org');
      await expect(actors.connect(owner).mint(user1.address, 'https://www.blockchainsociete.org')).to.be.revertedWith('An actor can only have 1 token');
    })

    it("Require - Should revert when not called by contract issuer", async () => {
      const { actors, owner, user1 } = await loadFixture(deployActors);

      await expect(actors.connect(user1).mint(user1.address, 'https://www.blockchainsociete.org')).to.be.revertedWith('Ownable: caller is not the owner');
    })

    it("Event - Should mint a new Actor and emit ActorMinted event", async () => {
      const { actors, owner, user1 } = await loadFixture(deployActors);
      const mintReceipt = await actors.connect(owner).mint(user1.address, 'https://www.blockchainsociete.org');

      expect(mintReceipt).to.emit(actors, 'ActorMinted').withArgs(1, 'https://www.blockchainsociete.org');
    })
  });

});