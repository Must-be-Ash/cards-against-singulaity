# Wallet Setup for x402 Payments

## Table of Contents

1. [Quick Wallet Creation](#quick-wallet-creation)
2. [Non-Interactive CLI Commands](#non-interactive-cli-commands)
3. [EVM Wallet Setup](#evm-wallet-setup)
4. [Solana Wallet Setup](#solana-wallet-setup)
5. [CDP Embedded Wallets](#cdp-embedded-wallets)
6. [Funding Your Wallet](#funding-your-wallet)

## Quick Wallet Creation

Create a wallet using the CLI:

```bash
npx add-wallet
```

Select wallet type when prompted:
- **EVM** - For Base, Ethereum, Avalanche networks
- **Solana** - For Solana network

This generates a wallet and stores the private key securely.

## Non-Interactive CLI Commands

**IMPORTANT FOR AI AGENTS:** The `npx add-wallet` command has an interactive prompt that doesn't work in non-TTY environments. Use these commands instead:

### EVM Wallet (EOA) - Recommended for most use cases

```bash
echo "1" | npx add-wallet evm
```

This pipes "1" to select the first option (EOA - Externally Owned Account).

### EVM Wallet (Smart Account)

```bash
echo "2" | npx add-wallet evm
```

This selects Smart Account with EIP-4337 account abstraction.

### Solana Wallet

```bash
npx add-wallet sol
```

Solana wallet creation doesn't have the interactive prompt.

### What Gets Created

After running the command, a `.env` file is created with:
```bash
WALLET_ADDRESS=0x...  # or Solana address
WALLET_PRIVATE_KEY=...
```

### Top Up Commands

```bash
# Get mainnet USDC funding link
npx add-wallet topup

# Get testnet USDC on Base Sepolia
npx add-wallet topup testnet
```

### Manual Wallet Generation (Fallback)

If the CLI doesn't work, generate an EVM wallet manually:

```bash
node -e "
const crypto = require('crypto');
const { keccak256 } = require('viem');
const privateKey = '0x' + crypto.randomBytes(32).toString('hex');
console.log('WALLET_PRIVATE_KEY=' + privateKey);
"
```

Then derive the address in your code:
```typescript
import { privateKeyToAccount } from "viem/accounts";
const signer = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as \`0x\${string}\`);
console.log("Address:", signer.address);
```

## EVM Wallet Setup

### Using Private Key (viem)

```typescript
import { privateKeyToAccount } from "viem/accounts";

// Load from environment variable
const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

console.log("Address:", signer.address);
```

### Using with x402 Client

```typescript
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });
```

### Required Dependencies

```bash
npm install viem @x402/core @x402/evm
```

## Solana Wallet Setup

### Using Private Key (@solana/kit)

```typescript
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

// Load base58-encoded private key (64 bytes: private + public)
const svmSigner = await createKeyPairSignerFromBytes(
  base58.decode(process.env.SOLANA_PRIVATE_KEY!)
);

console.log("Address:", svmSigner.address);
```

### Using with x402 Client

```typescript
import { x402Client } from "@x402/core/client";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

const svmSigner = await createKeyPairSignerFromBytes(
  base58.decode(process.env.SOLANA_PRIVATE_KEY!)
);

const client = new x402Client();
registerExactSvmScheme(client, { signer: svmSigner });
```

### Required Dependencies

```bash
npm install @solana/kit @scure/base @x402/core @x402/svm
```

## CDP Embedded Wallets

For browser/frontend applications using Coinbase Developer Platform:

### Installation

```bash
npm install @coinbase/cdp-react @coinbase/cdp-core @coinbase/cdp-hooks
```

### Setup Provider

```tsx
import { CDPReactProvider } from "@coinbase/cdp-react";

function App() {
  return (
    <CDPReactProvider
      config={{
        projectId: "your-project-id",
        ethereum: { createOnLogin: "eoa" },
        solana: { createOnLogin: true },
        appName: "Your App Name"
      }}
    >
      <YourApp />
    </CDPReactProvider>
  );
}
```

### Use x402 with Embedded Wallet

```tsx
import { useX402 } from "@coinbase/cdp-hooks";

function PaymentComponent() {
  const { fetchWithPayment } = useX402();

  const handlePaidRequest = async () => {
    const response = await fetchWithPayment("https://api.example.com/paid", {
      method: "GET",
    });
    const data = await response.json();
    console.log(data);
  };

  return <button onClick={handlePaidRequest}>Make Paid Request</button>;
}
```

### Required Dependencies

```bash
npm install @coinbase/cdp-react @coinbase/cdp-core @coinbase/cdp-hooks x402-fetch
```

## Funding Your Wallet

### Testnet Faucets

| Network | Faucet URL |
|---------|------------|
| Base Sepolia ETH | https://portal.cdp.coinbase.com/products/faucet |
| Base Sepolia USDC | https://faucet.circle.com/ |
| Solana Devnet | https://faucet.solana.com/ |

### Mainnet

1. Purchase USDC from an exchange
2. Bridge to desired network (Base, Ethereum, etc.)
3. Send to your wallet address

### Check Balance

```typescript
// EVM (using viem)
import { createPublicClient, http, erc20Abi } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia

const balance = await publicClient.readContract({
  address: USDC_ADDRESS,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [signer.address],
});

console.log("USDC Balance:", balance.toString());
```

## Environment Variables

Store private keys securely in environment variables:

```bash
# .env file
EVM_PRIVATE_KEY=0x... # Include 0x prefix
SOLANA_PRIVATE_KEY=... # Base58 encoded

# For CDP
CDP_PROJECT_ID=your-project-id
```

Load with dotenv:

```typescript
import { config } from "dotenv";
config();
```

## Security Best Practices

1. **Never commit private keys** - Use environment variables
2. **Use separate wallets** - Don't use your main wallet for automated payments
3. **Set spending limits** - Use policies to cap spending
4. **Monitor balance** - Check balance before making requests
5. **Use testnets first** - Test on Base Sepolia before mainnet
