const hre = require("hardhat");

async function main() {
    console.log("Deploying NFTFactory...");

    const factory = await hre.ethers.deployContract("NFTFactory");
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    console.log(`NFTFactory deployed to: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
