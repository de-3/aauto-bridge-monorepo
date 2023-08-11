import { ethers } from "hardhat";

async function main() {
  const managerContract = await ethers.getContractFactory("AccountManager");
  // add entrypoint
  const manager = await managerContract.deploy(
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8"
  );

  await manager.waitForDeployment();

  console.log("ManagerAccount deployed to: ", await manager.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
