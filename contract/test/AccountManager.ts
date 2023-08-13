import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AccountManager", function () {
  async function deployAccountManager() {
    const [owner, entrypoint, otherAccount] = await ethers.getSigners();

    const AccountManager = await ethers.getContractFactory("AccountManager");
    const accountManager = await AccountManager.deploy(
      entrypoint.address,
      "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8",
      "0xfA6D8Ee5BE770F84FC001D098C4bD604Fe01284a",
      "0xDb9F51790365e7dc196e7D072728df39Be958ACe"
    );

    return { accountManager, owner, entrypoint, otherAccount };
  }

  describe("initialize", function () {
    it("initialize successfully", async function () {
      const { accountManager, otherAccount } = await loadFixture(
        deployAccountManager
      );
      expect(
        await accountManager
          .connect(otherAccount)
          .initialize(otherAccount.address, { value: 100 })
      )
        .to.emit(accountManager, "Deposited")
        .withArgs(otherAccount.address, 100);
    });
  });

  describe("deposit", function () {
    it("deposit successfully", async function () {
      const { accountManager, owner } = await loadFixture(deployAccountManager);

      expect(await accountManager.connect(owner).deposit({ value: 100 }))
        .to.emit(accountManager, "Deposited")
        .withArgs(owner.address, 100);
    });
  });

  describe("withdraw", function () {
    it("withdraw successfully", async function () {
      const { accountManager, otherAccount } = await loadFixture(
        deployAccountManager
      );

      await accountManager.connect(otherAccount).deposit({ value: 100 });
      expect(await accountManager.connect(otherAccount).withdraw(50))
        .to.emit(accountManager, "Withdrawn")
        .withArgs(otherAccount.address, 50);
    });
  });
});
