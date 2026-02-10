/**
 * Test script for x402 agent-mint endpoint
 * Uses X402_WALLET_PRIVATE_KEY to sign payment authorization
 *
 * Usage:
 *   node test-agent-mint.mjs [walletAddress]
 *
 * Environment variables:
 *   X402_WALLET_PRIVATE_KEY - Private key for signing x402 payments
 *   API_URL - Base URL (default: http://localhost:3000)
 */
import { config } from "dotenv";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";

config();

const PRIVATE_KEY = process.env.X402_WALLET_PRIVATE_KEY;
const API_URL = process.env.API_URL || "http://localhost:3000";

if (!PRIVATE_KEY) {
  console.error("Error: X402_WALLET_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

// Create wallet from private key
const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Using wallet:", account.address);

const walletClient = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Create x402 signer (needs address + signTypedData)
const signer = {
  address: account.address,
  signTypedData: walletClient.signTypedData.bind(walletClient),
};

// Create x402 client with EVM scheme
const coreClient = new x402Client()
  .register('eip155:*', new ExactEvmScheme(signer));
const httpClient = new x402HTTPClient(coreClient);

// Mint request
const mintRequest = {
  walletAddress: process.argv[2] || account.address,
  promptIndices: [0],
  answerIndices: [0],
};

async function mintWithX402() {
  const url = `${API_URL}/api/agent-mint`;

  console.log("\nMinting to:", mintRequest.walletAddress);

  // First request - expect 402
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mintRequest),
  });

  if (response.status !== 402) {
    const data = await response.json();
    if (response.ok) {
      console.log("\n✓ Minted (no payment required):", data.transactionLink);
    } else {
      console.error("\n✗ Error:", data.error);
    }
    return;
  }

  // Parse 402 and create payment
  console.log("Creating x402 payment signature...");
  const body = await response.json();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  // Retry with payment
  const paidResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...paymentHeaders },
    body: JSON.stringify(mintRequest),
  });

  const data = await paidResponse.json();

  if (paidResponse.ok) {
    console.log("\n✓ NFT Minted Successfully!");
    console.log("Transaction:", data.transactionLink);
    console.log("Image:", data.imageUrl);
  } else {
    console.error("\n✗ Failed:", data.error);
  }
}

mintWithX402().catch(console.error);
