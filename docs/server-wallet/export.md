> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Exporting Accounts

## Overview

The CDP Server Wallet offers a secure method for exporting private keys of EVM and Solana accounts, that are compatible with all major wallet providers, such as Coinbase Wallet and Metamask.

The export API is end-to-end encrypted between the CDP SDK and the [TEE](/server-wallets/v2/introduction/security#tee-architecture), ensuring that keys are never exposed outside of the secure enclave while exporting. The private key is encrypted within the TEE by a single-use encryption key generated within the SDK.

<Warning>
  Exporting is a sensitive operation that puts your account's security and private keys at risk if not handled securely. It is important to store the private key in a secure place after it's exported.
</Warning>

## Exporting EVM accounts

Export private keys from your EVM accounts using either the account address or name.

<CodeGroup>
  ```typescript TypeScript theme={null}
  import { CdpClient } from "@coinbase/cdp-sdk";
  import dotenv from "dotenv";

  dotenv.config();

  const cdp = new CdpClient();
  const account = await cdp.evm.createAccount({
    name: "ExportEvmAccount",
  });
  console.log("Account to export:", account.address);

  // Export account with its address.
  let privateKey = await cdp.evm.exportAccount({
    address: account.address
  })

  // Export account with its name.
  privateKey = await cdp.evm.exportAccount({
    name: account.name
  })
  ```

  ```python Python theme={null}
  import asyncio
  from cdp import CdpClient
  from dotenv import load_dotenv

  load_dotenv()


  async def main():
      async with CdpClient() as cdp:
          account = await cdp.evm.create_account(
              name="ExportEvmAccount"
          )
          print("Account to export: ", account.address)

          # Export account with its address.
          private_key = await cdp.evm.export_account(
              address=account.address
          )

          # Export account with its name.
          private_key = await cdp.evm.export_account(
              name=account.name
          )

  asyncio.run(main())
  ```
</CodeGroup>

## Exporting Solana accounts

Export private keys from your Solana accounts using either the account address or name.

<CodeGroup>
  ```typescript TypeScript theme={null}
  import { CdpClient } from "@coinbase/cdp-sdk";
  import dotenv from "dotenv";

  dotenv.config();

  const cdp = new CdpClient();
  const account = await cdp.solana.createAccount({
    name: "ExportSolanaAccount",
  });
  console.log("Account to export: ", account.address);

  // Export account with its address.
  let privateKey = await cdp.solana.exportAccount({
    address: account.address
  })

  // Export account with its name.
  privateKey = await cdp.solana.exportAccount({
    name: account.name
  })
  ```

  ```python Python theme={null}
  import asyncio
  from cdp import CdpClient
  from dotenv import load_dotenv

  load_dotenv()


  async def main():
      async with CdpClient() as cdp:
          account = await cdp.solana.create_account(
              name="ExportSolanaAccount"
          )
          print("Account to export: ", account.address)

          # Export account with its address.
          private_key = await cdp.solana.export_account(
              address=account.address
          )

          # Export account with its name.
          private_key = await cdp.solana.export_account(
              name=account.name
          )

  asyncio.run(main())
  ```
</CodeGroup>

## API Key Configuration for Private Key Export

In order to programmatically export account private keys, you'll need to manually configure an API key with a specific scope.

When you're creating a new API Key, first expand the **API restrictions** panel then scroll down to the **API-specific restrictions** section.

Ensure that **Export (export private key)** is checked before key creation as seen in the following screenshot.

<Frame>
    <img src="https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=86515f6e05be0761b1a8e7c09897c4dd" alt="Export Scope" data-og-width="974" width="974" data-og-height="1456" height="1456" data-path="server-wallets/images/manage-accounts-export-api-scope.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=280&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=db21534d8c5eb3029df46ff1ba98b057 280w, https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=560&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=029b9c595c58161b83fd66e1d653fab4 560w, https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=840&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=5a9f5806079f2f3766a3d17f655b24c4 840w, https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=1100&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=971536a905586ff785e3344cc3091b4d 1100w, https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=1650&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=05927ca3995916774bcf3ef2267cc25d 1650w, https://mintcdn.com/coinbase-prod/s_QeFV8SFwGVfV_u/server-wallets/images/manage-accounts-export-api-scope.png?w=2500&fit=max&auto=format&n=s_QeFV8SFwGVfV_u&q=85&s=a485fe34ba04980bcd45231bf1414cba 2500w" />
</Frame>

## What to read next

* [**v2 Wallet Security**](/server-wallets/v2/introduction/security): Learn more about the security features of the CDP v2 Server Wallet.
* [**Policies**](/server-wallets/v2/using-the-wallet-api/policies/overview): Learn more about governing behavior of v2 accounts.
* [**Importing Accounts**](/server-wallets/v2/using-the-wallet-api/import-accounts): Learn more about importing EVM accounts.
