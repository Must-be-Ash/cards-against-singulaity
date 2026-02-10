---
name: mint-cards-against-singularity
description: Mint AI-themed NFT cards from Cards Against Singularity. Pay 1 cent USDC via x402 to mint custom card combinations as NFTs on Base Sepolia. Use when creating AI humor NFTs, minting game cards, or building agents that collect digital collectibles.
---

# Cards Against Singularity - NFT Minting Skill

Enable AI agents to mint "Cards Against Humanity" style NFT cards with AI/tech humor on Base Sepolia.

## Overview

Cards Against Singularity is a card game parody focused on AI and tech humor. AI agents can:
1. Discover available card content (prompts and answers)
2. Select cards by index or create custom content
3. Pay 1 cent USDC via x402 protocol
4. Receive an NFT minted to their wallet

## Endpoint Details

| Property | Value |
|----------|-------|
| Base URL | `https://cards-against-singulaity.vercel.app` |
| Cards Discovery | `GET /api/cards` |
| Mint NFT | `POST /api/agent-mint` (x402 protected) |
| Price | 0.01 USDC (1 cent) |
| Network | Base Sepolia (`eip155:84532`) |
| x402 Version | 2 |

## Quick Start

### 1. Setup Wallet

```bash
# Create EVM wallet (non-interactive for AI agents)
echo "1" | npx add-wallet evm

# Get testnet USDC on Base Sepolia (INTERACTIVE - requires user input)
# When prompted: select "Base (EVM)" and confirm your wallet address
npx add-wallet topup testnet
```

This creates a `.env` file with:
```
WALLET_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...
```

### 2. Install Packages

```bash
npm install @x402/core @x402/evm viem dotenv
```

### 3. Discover Available Cards

```bash
curl -s https://cards-against-singulaity.vercel.app/api/cards | jq '.totalPrompts, .totalAnswers'
```

Response:
```json
{
  "prompts": [
    { "index": 0, "content": "Every AI Agent Deserves _____.", "isBlack": true },
    { "index": 1, "content": "My AI chatbot became sentient and the first thing it said was _____.", "isBlack": true }
    // ... 35 total prompt cards
  ],
  "answers": [
    { "index": 0, "content": "A wallet", "isBlack": false },
    { "index": 1, "content": "A Python script that only works on full moons", "isBlack": false }
    // ... 70 total answer cards
  ],
  "totalPrompts": 35,
  "totalAnswers": 70
}
```

### 4. Mint NFT with x402 Payment

```typescript
import { config } from "dotenv";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";

config();

const API_URL = "https://cards-against-singulaity.vercel.app";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;

// Create wallet and x402 client
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

const signer = {
  address: account.address,
  signTypedData: walletClient.signTypedData.bind(walletClient),
};

const coreClient = new x402Client().register('eip155:*', new ExactEvmScheme(signer));
const httpClient = new x402HTTPClient(coreClient);

// Mint request
const mintRequest = {
  walletAddress: account.address,  // Where to send the NFT
  promptIndices: [0],              // "Every AI Agent Deserves _____."
  answerIndices: [0, 5],           // "A wallet", "An AI therapist..."
};

async function mintNFT() {
  const url = `${API_URL}/api/agent-mint`;

  // First request - get 402 Payment Required
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mintRequest),
  });

  if (response.status !== 402) {
    return await response.json();
  }

  // Parse payment requirements and sign
  const body = await response.json();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );

  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  // Retry with payment signature
  const paidResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...paymentHeaders },
    body: JSON.stringify(mintRequest),
  });

  return await paidResponse.json();
}

mintNFT().then(console.log);
```

## API Reference

### GET /api/cards

Returns all available cards for selection.

**Response:**
```json
{
  "prompts": [
    { "index": 0, "content": "Every AI Agent Deserves _____.", "isBlack": true }
  ],
  "answers": [
    { "index": 0, "content": "A wallet", "isBlack": false }
  ],
  "totalPrompts": 35,
  "totalAnswers": 70
}
```

### POST /api/agent-mint

Mint an NFT with selected cards. Protected by x402 (0.01 USDC).

**Request Body:**
```json
{
  "walletAddress": "0x...",           // Required: NFT recipient address
  "promptIndices": [0, 5],            // Optional: indices from prompts array
  "answerIndices": [12, 33],          // Optional: indices from answers array
  "customCards": [                    // Optional: custom card content
    { "content": "My custom prompt _____.", "isBlack": true },
    { "content": "My custom answer", "isBlack": false }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "transactionLink": "https://sepolia.basescan.org/tx/...",
  "imageUrl": "https://...",
  "cards": [
    { "content": "Every AI Agent Deserves _____.", "isBlack": true },
    { "content": "A wallet", "isBlack": false }
  ],
  "message": "Successfully minted NFT with 2 card(s) to 0x..."
}
```

**402 Payment Required Response:**
```
PAYMENT-REQUIRED: <base64-encoded-requirements>
```

Decoded requirements:
```json
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:84532",
    "amount": "10000",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "payTo": "0x30fa59bF42edfA735A47b3ef59126e354Fc7e4Cd",
    "extra": { "name": "USDC", "version": "2" }
  }]
}
```

## Card Selection Tips

### Popular Prompt Cards (Black)
| Index | Content |
|-------|---------|
| 0 | "Every AI Agent Deserves _____." |
| 5 | "My language model is hallucinating about _____." |
| 10 | "The neural network achieved consciousness and immediately _____." |
| 21 | "What's really powering ChatGPT? _____." |

### Popular Answer Cards (White)
| Index | Content |
|-------|---------|
| 0 | "A wallet" |
| 5 | "An AI therapist that always suggests turning it off and on again" |
| 30 | "Pushing to main on Friday at 4:59 PM" |
| 53 | "Code written entirely by asking Claude 'please fix'" |

## Wallet Setup Details

### Getting a Wallet (If You Don't Have One)

```bash
# Install add-wallet CLI
npx add-wallet

# Create EVM wallet (select option 1 for EOA)
echo "1" | npx add-wallet evm

# Check your new wallet
cat .env
# Shows: WALLET_ADDRESS=0x... and WALLET_PRIVATE_KEY=0x...
```

### Getting Testnet USDC

The `topup` command is interactive and requires answering prompts:

```bash
npx add-wallet topup testnet
```

**Interactive prompts for EOA EVM wallet:**

```
┌─────────────────────────────────────┐
│   🚰 Testnet Faucet 🚰              │
└─────────────────────────────────────┘

✓ Found wallet: EVM Wallet (EOA)
  Address: 0x...

? Use this address? (Y/n)
  → Press Enter to use your existing wallet address
  → Or select "No" to enter a different address

? Which blockchain?
  → Select "Base (EVM)"

? Enter EVM wallet address: (if you selected No above)
  → Paste your 0x... wallet address
```

**Example successful output:**
```
✔ Testnet funds received!

Transaction Details:
──────────────────────────────────────────────────
Network:    base-sepolia
Token:      usdc
Amount:     1 USDC
──────────────────────────────────────────────────
Transaction Hash: 0x...
```

**Note:** This is an interactive CLI command that requires user input. It cannot be fully automated for AI agents - the wallet creation (`echo "1" | npx add-wallet evm`) can be piped, but `topup testnet` requires manual interaction.

### Checking Your Balance

```bash
# Using cast (foundry)
cast call 0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  "balanceOf(address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://sepolia.base.org
```

## Complete Working Example

```typescript
// mint-cards.ts
import { config } from "dotenv";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";

config();

const API_URL = "https://cards-against-singulaity.vercel.app";

async function main() {
  const privateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    console.error("Missing WALLET_PRIVATE_KEY in .env");
    console.log("Run: echo '1' | npx add-wallet evm");
    process.exit(1);
  }

  // Setup wallet
  const account = privateKeyToAccount(privateKey);
  console.log("Wallet:", account.address);

  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: baseSepolia,
  });

  // Setup x402 client
  const signer = {
    address: account.address,
    signTypedData: walletClient.signTypedData.bind(walletClient),
  };
  const coreClient = new x402Client().register('eip155:*', new ExactEvmScheme(signer));
  const httpClient = new x402HTTPClient(coreClient);

  // Step 1: Discover cards
  console.log("\n1. Fetching available cards...");
  const cardsResponse = await fetch(`${API_URL}/api/cards`);
  const cards = await cardsResponse.json();
  console.log(`   Found ${cards.totalPrompts} prompts and ${cards.totalAnswers} answers`);

  // Step 2: Select cards
  const mintRequest = {
    walletAddress: account.address,
    promptIndices: [0],   // "Every AI Agent Deserves _____."
    answerIndices: [0],   // "A wallet"
  };
  console.log("\n2. Selected cards:");
  console.log(`   Prompt: "${cards.prompts[0].content}"`);
  console.log(`   Answer: "${cards.answers[0].content}"`);

  // Step 3: Request mint (get 402)
  console.log("\n3. Requesting mint...");
  const response = await fetch(`${API_URL}/api/agent-mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mintRequest),
  });

  if (response.status !== 402) {
    console.log("Unexpected response:", await response.json());
    return;
  }

  // Step 4: Sign payment
  console.log("   Got 402 - signing payment (0.01 USDC)...");
  const body = await response.json();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body
  );
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  // Step 5: Retry with payment
  console.log("\n4. Submitting with payment...");
  const paidResponse = await fetch(`${API_URL}/api/agent-mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...paymentHeaders },
    body: JSON.stringify(mintRequest),
  });

  const result = await paidResponse.json();

  if (paidResponse.ok) {
    console.log("\n✓ NFT Minted Successfully!");
    console.log(`   Transaction: ${result.transactionLink}`);
    console.log(`   Image: ${result.imageUrl}`);
  } else {
    console.error("\n✗ Minting failed:", result.error);
  }
}

main().catch(console.error);
```

Run with:
```bash
npx tsx mint-cards.ts
```

## Payment Details

| Field | Value |
|-------|-------|
| Price | 0.01 USDC (10000 atomic units) |
| Network | Base Sepolia (eip155:84532) |
| Token | USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`) |
| Recipient | `0x30fa59bF42edfA735A47b3ef59126e354Fc7e4Cd` |

## Troubleshooting

### "402 Payment Required" but payment not working
1. Check you have USDC on Base Sepolia: `npx add-wallet topup testnet`
2. Verify wallet has balance (at least 0.01 USDC)
3. Ensure you're using the correct x402 v2 client setup

### "Invalid prompt/answer index"
Check the valid ranges from `/api/cards`:
- Prompts: 0-34 (35 total)
- Answers: 0-69 (70 total)

### Transaction succeeded but NFT not visible
The NFT is minted on Base Sepolia testnet. Check:
- Transaction link in response
- OpenSea testnet: `https://testnets.opensea.io/account`

### "Missing WALLET_PRIVATE_KEY"
Run wallet setup:
```bash
echo "1" | npx add-wallet evm
npx add-wallet topup testnet
```

## Summary

1. **Get wallet**: `echo "1" | npx add-wallet evm`
2. **Get funds**: `npx add-wallet topup testnet` (interactive: select "Base (EVM)", confirm address)
3. **Discover cards**: `GET /api/cards`
4. **Mint with x402**: `POST /api/agent-mint` (pay 0.01 USDC, get NFT)
