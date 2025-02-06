import { NextResponse } from 'next/server'
import { CdpAgentkit } from "@/lib/cdp/cdp_agentkit"
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk"
import { CdpAction } from "@/lib/cdp/cdp_action"
import { z } from "zod"
import * as fs from "fs"

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt"

// Define the faucet request action schema
const RequestFaucetFundsInput = z.object({
  assetId: z.string().optional().describe("The optional asset ID to request from faucet"),
}).strip()

// Create the faucet request action
const requestFaucetAction: CdpAction<typeof RequestFaucetFundsInput> = {
  name: "request_faucet_funds",
  description: "This tool will request test tokens from the faucet.",
  argsSchema: RequestFaucetFundsInput,
  func: async (wallet: Wallet, args: z.infer<typeof RequestFaucetFundsInput>): Promise<string> => {
    try {
      // Request funds from the faucet
      const faucetTx = await wallet.faucet(args.assetId || undefined);

      // Wait for the faucet transaction to be confirmed
      const result = await faucetTx.wait();

      return `Received ${args.assetId || "ETH"} from the faucet. Transaction: ${result.getTransactionLink()}`;
    } catch (error) {
      console.error('Faucet request error:', error);
      throw error;
    }
  }
}

async function requestMultipleFaucetFunds(agentkit: CdpAgentkit, count: number = 3) {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    try {
      console.log(`Requesting faucet funds attempt ${i + 1}/${count}...`);
      const result = await agentkit.run(requestFaucetAction, {
        assetId: "eth"
      });
      results.push(result);
      
      // Wait a bit between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed faucet request ${i + 1}:`, error);
      // Continue with next attempt even if one fails
    }
  }
  
  return results;
}

async function initializeAgent() {
  try {
    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
        console.log('Found existing wallet data');
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    // Configure CDP AgentKit
    const config = {
      cdpWalletData: walletDataStr || undefined,
      networkId: Coinbase.networks.BaseSepolia,
      cdpApiKeyName: process.env.NEXT_PUBLIC_CDP_API_KEY_NAME,
      cdpApiKeyPrivateKey: process.env.NEXT_PUBLIC_CDP_API_KEY_PRIVATE_KEY,
    };

    console.log('Initializing CDP AgentKit...');
    const agentkit = await CdpAgentkit.configureWithWallet(config);

    // Save wallet data for future use
    const exportedWallet = await agentkit.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);
    console.log('Saved wallet data');

    return agentkit;
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('Setup API called');
    
    // Initialize the agent
    const agentkit = await initializeAgent();
    
    // Request funds multiple times from the faucet
    console.log('Requesting multiple faucet funds...');
    const faucetResults = await requestMultipleFaucetFunds(agentkit);
    console.log('Faucet request results:', faucetResults);

    // Export wallet data for other routes to use
    const exportedWallet = await agentkit.exportWallet();
    
    return NextResponse.json({ 
      success: true,
      message: 'Wallet setup complete and multiple faucet funds requested',
      walletData: exportedWallet,
      faucetResults
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to setup wallet',
        details: error
      },
      { status: 500 }
    );
  }
} 
