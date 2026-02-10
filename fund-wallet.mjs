import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

console.log("Funding server wallet...");
console.log("CDP_API_KEY_ID:", process.env.CDP_API_KEY_ID?.substring(0, 8) + "...");
console.log("CDP_API_KEY_SECRET:", process.env.CDP_API_KEY_SECRET?.substring(0, 8) + "...");
console.log("CDP_WALLET_SECRET:", process.env.CDP_WALLET_SECRET?.substring(0, 15) + "...");

const cdp = new CdpClient();

// Create or get an account with a name (this is idempotent with names)
console.log("\nGetting or creating server wallet account...");
const account = await cdp.evm.getOrCreateAccount({
  name: "cards-against-singularity-minter"
});
console.log("Server wallet address:", account.address);

// Request faucet funds
console.log("\nRequesting testnet ETH from faucet...");
try {
  const faucetResponse = await cdp.evm.requestFaucet({
    address: account.address,
    network: "base-sepolia",
    token: "eth"
  });
  console.log("Faucet transaction hash:", faucetResponse.transactionHash);
  console.log("Transaction link: https://sepolia.basescan.org/tx/" + faucetResponse.transactionHash);
} catch (error) {
  if (error.message?.includes("rate limit")) {
    console.log("Rate limited on faucet - wallet may already have funds");
  } else {
    console.error("Faucet error:", error.message);
  }
}

// Update .env file with the wallet address
console.log("\nUpdating .env with wallet address...");
let envContent = fs.readFileSync(".env", "utf8");

if (envContent.includes("SERVER_WALLET_ADDRESS=")) {
  envContent = envContent.replace(/SERVER_WALLET_ADDRESS=.*/g, `SERVER_WALLET_ADDRESS=${account.address}`);
} else {
  envContent += `\nSERVER_WALLET_ADDRESS=${account.address}\n`;
}

fs.writeFileSync(".env", envContent);
console.log("Added SERVER_WALLET_ADDRESS to .env");

console.log("\nDone! Your server wallet is funded and ready to mint NFTs.");
console.log("Wallet address:", account.address);
