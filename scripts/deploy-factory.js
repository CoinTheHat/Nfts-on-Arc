const hre = require("hardhat");

async function main() {
    console.log("Deploying NFTFactory...");

    const platformAddress = "0x7424349843A37Ae97221Fd099d34fF460b04a474";
    const factory = await hre.ethers.deployContract("NFTFactory", [platformAddress]);
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    console.log(`NFTFactory deployed to: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
