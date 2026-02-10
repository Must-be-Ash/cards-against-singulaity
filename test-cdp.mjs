import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing CDP credentials...");
console.log("CDP_API_KEY_ID:", process.env.CDP_API_KEY_ID?.substring(0, 8) + "...");
console.log("CDP_API_KEY_SECRET:", process.env.CDP_API_KEY_SECRET?.substring(0, 8) + "...");
console.log("CDP_WALLET_SECRET:", process.env.CDP_WALLET_SECRET?.substring(0, 15) + "...");

try {
  const cdp = new CdpClient();
  console.log("\nCdpClient created successfully!");

  console.log("\nTrying to create an account...");
  const account = await cdp.evm.createAccount();
  console.log("Account created successfully!");
  console.log("Address:", account.address);
} catch (error) {
  console.error("\nError:", error.message);
  if (error.statusCode) {
    console.error("Status code:", error.statusCode);
  }
  if (error.errorType) {
    console.error("Error type:", error.errorType);
  }
}
