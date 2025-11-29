require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("PRIVATE_KEY not found in .env");
        return;
    }
    const wallet = new ethers.Wallet(privateKey);
    console.log("Admin Address:", wallet.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
