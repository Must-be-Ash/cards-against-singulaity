import { NextResponse } from 'next/server'
import { z } from "zod"
import { Wallet } from "@coinbase/coinbase-sdk"
import { CdpAction } from "@/lib/cdp/cdp_action"
import { CdpAgentkit } from "@/lib/cdp/cdp_agentkit"
import { Coinbase } from "@coinbase/coinbase-sdk"
import fs from 'fs'

// Define the deploy NFT action schema
const DeployNftInput = z.object({
  name: z.string().describe("The name of the NFT collection"),
  symbol: z.string().describe("The symbol of the NFT collection"),
  baseURI: z.string().describe("The base URI for the token metadata"),
}).strip()

// Create the deploy NFT action
const deployNftAction: CdpAction<typeof DeployNftInput> = {
  name: "deploy_nft",
  description: "This tool will deploy an NFT (ERC-721) contract onchain.",
  argsSchema: DeployNftInput,
  func: async (wallet: Wallet, args: z.infer<typeof DeployNftInput>): Promise<string> => {
    try {
      const nftContract = await wallet.deployNFT({
        name: args.name,
        symbol: args.symbol,
        baseURI: args.baseURI,
      });

      const result = await nftContract.wait();
      const transaction = result.getTransaction()!;

      return `Deployed NFT Collection ${args.name} to address ${result.getContractAddress()} on network ${wallet.getNetworkId()}.\nTransaction hash for the deployment: ${transaction.getTransactionHash()}\nTransaction link for the deployment: ${transaction.getTransactionLink()}`;
    } catch (error) {
      console.error('Deploy invocation error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        httpCode: error.httpCode,
        apiCode: error.apiCode,
        apiMessage: error.apiMessage
      });
      throw error; // Re-throw to be caught by the outer try-catch
    }
  }
}

// Create a singleton instance of AgentKit
let agentInstance: {
  agentkit: CdpAgentkit;
  walletAddress: string;
} | null = null;

// Use the wallet that already has funds
const EXISTING_WALLET = {
  id: "7eb4ebfb-6677-4c6f-8893-269f077a4e1d",
  address: "0x17C39C7303B40D63b2a1F6C304A5A89BE63812CA"
};

async function getOrCreateAgent() {
  if (agentInstance) {
    console.log('Using existing agent with wallet:', agentInstance.walletAddress)
    return agentInstance
  }

  console.log('Creating new agent instance...')
  
  let walletDataStr: string | null = null;
  const WALLET_DATA_FILE = "wallet_data.txt";

  // Read existing wallet data if available
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      console.log('Found existing wallet data');
    } catch (error) {
      console.error("Error reading wallet data:", error);
    }
  }

  const config = {
    networkId: Coinbase.networks.BaseSepolia,
    cdpApiKeyName: process.env.NEXT_PUBLIC_CDP_API_KEY_NAME,
    cdpApiKeyPrivateKey: process.env.NEXT_PUBLIC_CDP_API_KEY_PRIVATE_KEY,
    cdpWalletData: walletDataStr || undefined
  }

  const agentkit = await CdpAgentkit.configureWithWallet(config)
  
  // Get the wallet address from the exported data
  const exportedData = JSON.parse(await agentkit.exportWallet());
  const walletAddress = exportedData.address;
  
  agentInstance = {
    agentkit,
    walletAddress
  }

  console.log('Created agent with wallet:', agentInstance.walletAddress)
  return agentInstance
}

export async function POST(request: Request) {
  try {
    console.log('Deploy API called')
    const { name = "Cards Against NFT", symbol = "CANFT", baseURI = "https://cards-against.vercel.app/api/metadata/" } = await request.json()
    console.log('Request data:', { name, symbol, baseURI })

    console.log('Getting agent instance...')
    const { agentkit } = await getOrCreateAgent()

    // Run the deploy NFT action directly
    console.log('Deploying NFT contract...')
    console.log('Parameters:', { name, symbol, baseURI })
    
    try {
      const deployResult = await agentkit.run(deployNftAction, {
        name,
        symbol,
        baseURI
      })
      console.log('Deploy result:', deployResult)

      // Extract contract address, transaction hash and link from result
      const addressMatch = deployResult.match(/to address (0x[a-fA-F0-9]+)/)
      const hashMatch = deployResult.match(/Transaction hash for the deployment: (0x[a-fA-F0-9]+)/)
      const linkMatch = deployResult.match(/Transaction link for the deployment: (https:\/\/[^\s]+)/)
      
      const contractAddress = addressMatch ? addressMatch[1] : ''
      const transactionHash = hashMatch ? hashMatch[1] : ''
      const transactionLink = linkMatch ? linkMatch[1] : ''

      console.log('Deployment complete')
      return NextResponse.json({ 
        success: true,
        contractAddress,
        transactionHash,
        transactionLink,
        deployResult
      })
    } catch (error) {
      console.error('Deploy execution error:', error)
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Detailed API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to deploy NFT contract'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error,
        walletAddress: EXISTING_WALLET.address
      },
      { status: 500 }
    )
  }
} 