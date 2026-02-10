> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Accounts

## Overview

**Accounts** refer to an address on a blockchain that has the ability to sign transactions on behalf of the address, allowing you to not only send and receive funds, but also interact with smart contracts. Cryptographically, an account corresponds to a **private/public key pair**.

<Info>
  **Accounts** are a term consistent across the crypto ecosystem: [Ethereum](https://ethereum.org/en/glossary/#section-a), [Solana](https://solana.com/docs/core/accounts), and [viem](https://viem.sh/docs/faq#why-use-the-terms-wallet--account-instead-of-signer) use this term to refer to the same concept.
</Info>

The v2 Server Wallet supports the following account types:

* **EVM Compatible Accounts**:
  * **EOAs**: [Externally Owned Accounts](https://ethereum.org/en/developers/docs/accounts/) on any EVM-compatible blockchain that have the ability to sign transactions on behalf of an account's address (i.e., when using a Smart Account).
  * **Smart Account**: A smart contract-based account that can provide advanced functionality such as gas sponsorships and spend permissions.
* **Solana Accounts**: An account on the Solana blockchain.

<Tip>
  More code samples are available in our [Typescript](https://github.com/coinbase/cdp-sdk/blob/main/examples/typescript/README.md)
  and [Python](https://github.com/coinbase/cdp-sdk/blob/main/examples/python/README.md) SDK repositories.
</Tip>

## EVM accounts

When using the v2 Server Wallet, ensure you understand the differences between our two offered account types, Externally Owned Accounts (EOAs) and Smart Accounts so that you select the proper type for your application.

The v2 Server Wallet supports EOAs on **all EVM-compatible networks** and Smart Accounts on \*\*Base, Arbitrum, Optimism, Zora, Polygon, BNB, Avalanche and Ethereum Mainnet \*\*.

### EOA vs Smart Accounts

While both account types enable blockchain interactions, they differ significantly in their architecture, capabilities, and constraints:

| Feature                            | EOA                                                                                                                                                                                    | Smart Account                                                                                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Control**                        | Private key generated and secured in CDP's TEE                                                                                                                                         | Controlled by smart contract code with an owner account (can be a CDP-managed EOA or bring your own)                                                                                                       |
| **Creation**                       | Generated new or imported from existing private key                                                                                                                                    | Created with CREATE2 opcode, deployed on first operation                                                                                                                                                   |
| **Transaction type**               | Direct, signed blockchain transactions                                                                                                                                                 | Bundled transactions (user operations)                                                                                                                                                                     |
| **Gas payment**                    | <Icon icon="x" color="#ef4444" /> Must pay gas fees directly                                                                                                                           | <Icon icon="check" color="#10b981" /> Gas sponsorship available via paymaster (subsidized on Base Sepolia)                                                                                                 |
| **Batch operations**               | <Icon icon="x" color="#ef4444" /> Single operation at a time                                                                                                                           | <Icon icon="check" color="#10b981" /> Multiple calls in a single user operation                                                                                                                            |
| **Owner requirements**             | <Icon icon="x" color="#ef4444" /> None required                                                                                                                                        | <Icon icon="check" color="#10b981" /> Requires an owner account (CDP EOA or external)                                                                                                                      |
| **CDP limitations**                | None                                                                                                                                                                                   | One smart account per owner, one owner per smart account                                                                                                                                                   |
| **Network support**                | <Icon icon="check" color="#10b981" /> All EVM networks supported by CDP                                                                                                                | <Icon icon="check" color="#10b981" /> Base, Arbitrum, Optimism, Zora, Polygon, BNB, Avalanche and Ethereum Mainnet                                                                                         |
| **Concurrent operations**          | <Icon icon="check" color="#10b981" /> Can have multiple pending transactions                                                                                                           | <Icon icon="check" color="#10b981" /> Support for concurrent userOperations                                                                                                                                |
| **viem compatibility**             | <Icon icon="check" color="#10b981" /> Works seamlessly with viem for all onchain actions                                                                                               | <Icon icon="check" color="#10b981" /> Smart account owners work seamlessly with viem for all onchain actions                                                                                               |
| **web3/eth-account compatibility** | <Icon icon="check" color="#10b981" /> Works seamlessly with web3.py and [eth-account](https://web3py.readthedocs.io/en/stable/web3.eth.account.html) libraries for all onchain actions | <Icon icon="check" color="#10b981" /> Smart account owners work seamlessly with web3.py and [eth-account](https://web3py.readthedocs.io/en/stable/web3.eth.account.html) libraries for all onchain actions |
| **Faucet support**                 | <Icon icon="check" color="#10b981" /> Base, Ethereum, Solana                                                                                                                           | <Icon icon="check" color="#10b981" /> Base, Ethereum, Solana                                                                                                                                               |

<Note>
  Need support for additional networks? Reach out to us on the [Coinbase Developer Platform Discord](https://discord.com/invite/cdp) in the **#cdp-sdk** channel.
</Note>

### Use cases

**Use EOAs when:**

* You need support across all EVM networks
* You require simple wallet functionality
* You don't need gas sponsorship features

**Use Smart Accounts when:**

* You're building on Base Sepolia or Base Mainnet
* You need to batch multiple operations in one transaction
* You want to sponsor gas fees for users
* You need EIP-4337 account abstraction features

### Implementation

EOAs are controlled directly by a private key.

#### EOAs

EOAs can be created new or imported from existing private keys. The following example shows both methods:

```typescript  theme={null}
// Create a new EOA
const newAccount = await cdp.evm.createAccount();

// Import an existing EOA from private key
const importedAccount = await cdp.evm.importAccount({
  privateKey: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  name: "imported-account"
});
```

Here's how to create an EOA and send a simple transaction:

<CodeGroup>
  ```typescript TypeScript theme={null}
  // Create a new EOA
  const account = await cdp.evm.createAccount();

  // Send a transaction
  const { transactionHash } = await cdp.evm.sendTransaction({
    address: account.address,
    transaction: {
      to: "0x...",
      value: parseEther("0.1"),
    },
    network: "base-sepolia",
  });
  ```

  ```python Python theme={null}
  from cdp.evm_transaction_types import TransactionRequestEIP1559
  from web3 import Web3

  # Create a new EOA
  account = await cdp.evm.create_account()

  # Send a transaction
  tx_hash = await cdp.evm.send_transaction(
      address=account.address,
      transaction=TransactionRequestEIP1559(
          to="0x...",
          value=Web3.to_wei(0.1, "ether"),
      ),
      network="base-sepolia",
  )
  ```
</CodeGroup>

For a complete example of creating and using EOAs, see the [quickstart guide](/server-wallets/v2/introduction/quickstart#evm).

<Note>
  Unlike Solana, EVM signing is handled automatically by the CDP SDK. When you call `sendTransaction()` for EOAs or `sendUserOperation()` for Smart Accounts, CDP manages the entire signing and submission process - you don't need to manually serialize, sign, or submit transactions.
</Note>

#### Smart Accounts

Smart Accounts operate through deployed smart contracts, enabling advanced features through [EIP-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337).

When creating a Smart Account, an EOA must be provided as the owner (either a CDP-managed EOA or an external EOA).

A Smart Account is not deployed until its first user operation:

```typescript  theme={null}
const smartAccount = await cdp.evm.createSmartAccount({
  owner: evmAccount,
});
// Contract address is deterministic but not yet deployed

// Contract is deployed with the first user operation
const sendResult = await cdp.evm.sendUserOperation({
  smartAccount,
  network: "base-sepolia",
  calls: [/* ... */],
});
```

<Note>
  Smart Accounts use the [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode for deterministic addresses, allowing the contract address to be known before deployment.
</Note>

For detailed implementation examples including batch operations and gas sponsorship, see the [Smart Accounts guide](/server-wallets/v2/evm-features/smart-accounts).

## Solana accounts

Solana accounts represent addresses on the Solana blockchain that can hold SOL and other tokens. They function similarly to EOAs on EVM chains but with some key differences in capabilities and architecture.

### Features

Here's what's available for Solana accounts in the v2 Server Wallet:

| Feature                  | Solana Account Support                                                                                                                                                                 | Notes                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Control**              | <Icon icon="check" color="#10b981" /> Private key secured in CDP's [TEE](/server-wallets/v2/introduction/security)                                                                     | Similar to EVM EOAs                                                                    |
| **Creation**             | <Icon icon="check" color="#10b981" /> Generate new or [import existing](/server-wallets/v2/using-the-wallet-api/import-accounts#solana-accounts-import-from-external-wallet-providers) | From base58 or raw private keys                                                        |
| **Transaction signing**  | <Icon icon="check" color="#10b981" /> Native Solana transactions                                                                                                                       | See [sending transactions](/server-wallets/v2/solana-features/sending-transactions)    |
| **Message signing**      | <Icon icon="check" color="#10b981" /> Off-chain message signing                                                                                                                        | See [message signing](/server-wallets/v2/solana-features/message-signing)              |
| **Gas payment**          | <Icon icon="x" color="#ef4444" /> Must pay fees directly                                                                                                                               | Sender pays transaction fees                                                           |
| **Fee sponsorship**      | <Icon icon="check" color="#10b981" /> Via `feePayer` property                                                                                                                          | See [sponsoring transactions](/server-wallets/v2/solana-features/sponsor-transactions) |
| **Batch operations**     | <Icon icon="check" color="#10b981" /> Multiple instructions per transaction                                                                                                            | See [batching instructions](/server-wallets/v2/solana-features/batching-instructions)  |
| **Token transfers**      | <Icon icon="check" color="#10b981" /> SOL and SPL tokens                                                                                                                               | See [transfers](/server-wallets/v2/using-the-wallet-api/transfers)                     |
| **Program interactions** | <Icon icon="check" color="#10b981" /> Any Solana program                                                                                                                               | Full support                                                                           |
| **Faucet support**       | <Icon icon="check" color="#10b981" /> Solana devnet only                                                                                                                               | See [quickstart](/server-wallets/v2/introduction/quickstart#solana)                    |
| **Network support**      | <Icon icon="check" color="#10b981" /> Mainnet and Devnet                                                                                                                               | `solana` and `solana-devnet`                                                           |

<Note>
  CDP currently supports standard Solana accounts (similar to EOAs on EVM). While Solana does support programmable wallets and PDAs, these advanced account types are not yet available through CDP's Server Wallet v2.
</Note>

### Implementation

Creating and using Solana accounts with the CDP Server Wallet is straightforward. This example demonstrates creating an account, funding it via faucet, and signing a message:

<CodeGroup>
  ```typescript TypeScript theme={null}
  const account = await cdp.solana.createAccount();

  await cdp.solana.signMessage({
    address: account.address,
    message: "Hello Solana!"
  });
  ```

  ```python Python theme={null}
  account = await cdp.solana.create_account()

  await cdp.solana.sign_message(
    address=account.address,
    message="Hello Solana!"
  )
  ```
</CodeGroup>

### Transaction signing

Beyond basic account operations, you'll often need to sign and send **transactions**. While message signing, demonstrated above, is used to verify account ownership (e.g., for authentication or off-chain verification), transaction signing is used to authorize actual on-chain actions, such as transferring SOL or interacting with a program.

The CDP Server Wallet integrates seamlessly with the Solana Web3.js library for transaction handling. For complete examples of creating Solana accounts and sending transactions, see:

* [Quickstart guide](/server-wallets/v2/introduction/quickstart#solana): Basic Solana account creation and transactions using CDP with Solana's Web3 library
* [Sending transactions](/server-wallets/v2/solana-features/sending-transactions): How to send transactions using the CDP Server Wallet
* [Batching Instructions](/server-wallets/v2/solana-features/batching-instructions): Execute multiple Solana instructions in a single transaction
* [Sponsor Transactions](/server-wallets/v2/solana-features/sponsor-transactions): Learn about fee sponsorship on Solana

## What to read next

* [**v2 Security**](/server-wallets/v2/introduction/security): Learn about the security features of v2 Server Wallet.
* [**API Reference**](/api-reference/v2/introduction): Explore the complete API reference for v2 Server Wallet.
