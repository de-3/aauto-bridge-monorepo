import { ethers } from "hardhat";

async function main() {
  const managerContract = await ethers.getContractFactory("AccountManager");
  // add entrypoint
  const manager = await managerContract.deploy(
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8",
    "0xfA6D8Ee5BE770F84FC001D098C4bD604Fe01284a",
    "0xDb9F51790365e7dc196e7D072728df39Be958ACe"
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
