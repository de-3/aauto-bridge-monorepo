import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { UserOperationStruct } from "@account-abstraction/contracts";

describe("AccountManager", function () {
  async function deployAccountManager() {
    const [owner, entrypoint, otherAccount] = await ethers.getSigners();

    const AccountManager = await ethers.getContractFactory("AccountManager");
    const accountManager = await AccountManager.deploy(
      entrypoint.address,
      "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8"
    );

    const userOp = {
      sender: "0x05d35D032aFf9b744e22C78Ff20Eda97A33432E1",
      nonce:
        "0x32a490634ecc437eb71d7667991e7c34e8fbfb68000000000000000000000000",
      initCode: "0x",
      callData:
        "0xde3a04ad0000000000000000000000005305f701cc749acf1146e6de47e10d094c20dbe900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000166b37af830ad0a",
      callGasLimit: "0x88b8",
      verificationGasLimit: "0x11170",
      preVerificationGas: "0xC350",
      maxFeePerGas: "0xe57943fa0",
      maxPriorityFeePerGas: "0x59682f00",
      paymasterAndData: "0x",
      signature:
        "0x558292c5fa183905004bf1f4737ad002d217949c8acb4211edba80685bd580ee7bd26f8d5885e761a682c487cc342ef52f5cddb609ecabd68fcad0a3c1fb2c9c1c",
    };

    return { accountManager, userOp, owner, entrypoint, otherAccount };
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

  describe("validateUserOp", function () {
    it("validateUserOp successfully", async function () {
      const { accountManager, userOp, entrypoint } = await loadFixture(
        deployAccountManager
      );

      expect(
        await accountManager
          .connect(entrypoint)
          .validateUserOp(
            userOp,
            "0xb60519aca9b8b5b947e1e708a91db711007c8a7b1c980ce8cc6d88be52cb4706",
            10
          )
      ).to.emit(accountManager, "AddedFundsToEntrypoint");
    });
  });
});
