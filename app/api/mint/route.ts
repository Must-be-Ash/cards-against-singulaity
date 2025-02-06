import { NextResponse } from 'next/server'
import { z } from "zod"
import { Wallet } from "@coinbase/coinbase-sdk"
import { CdpAction } from "@/lib/cdp/cdp_action"
import { CdpAgentkit } from "@/lib/cdp/cdp_agentkit"
import { Coinbase } from "@coinbase/coinbase-sdk"
import fs from 'fs'

// Define the mint NFT action schema
const MintNftInput = z.object({
  contractAddress: z.string().describe("The contract address of the NFT to mint"),
  destination: z.string().describe("The destination address that will receive the NFT"),
}).strip()

// Create the mint NFT action
const mintNftAction: CdpAction<typeof MintNftInput> = {
  name: "mint_nft",
  description: "This tool will mint an NFT to a specified destination address onchain.",
  argsSchema: MintNftInput,
  func: async (wallet: Wallet, args: z.infer<typeof MintNftInput>): Promise<string> => {
    const mintArgs = {
      to: args.destination,
      quantity: "1"
    };

    try {
      const mintInvocation = await wallet.invokeContract({
        contractAddress: args.contractAddress,
        method: "mint",
        args: mintArgs
      });

      const result = await mintInvocation.wait();
      const transaction = result.getTransaction();

      return `Minted NFT from contract ${args.contractAddress} to address ${args.destination} on network ${wallet.getNetworkId()}.\nTransaction hash for the mint: ${transaction.getTransactionHash()}\nTransaction link for the mint: ${transaction.getTransactionLink()}`;
    } catch (error) {
      console.error('Mint invocation error:', error);
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

// Use an existing NFT contract address
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || "0x3D13c2cEF827A30e7b1282F5C3Ef6F5C1c5c7268"

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
    console.log('Mint API called')
    const { imageUrl, walletAddress } = await request.json()
    console.log('Request data:', { imageUrl, walletAddress })

    console.log('Getting agent instance...')
    const { agentkit } = await getOrCreateAgent()

    // Run the mint NFT action directly
    console.log('Minting NFT...')
    console.log('Using contract:', NFT_CONTRACT)
    console.log('Destination:', walletAddress)
    
    try {
      const mintResult = await agentkit.run(mintNftAction, {
        contractAddress: NFT_CONTRACT,
        destination: walletAddress
      })
      console.log('Mint result:', mintResult)

      // Extract transaction hash and link from result using more precise regex
      const hashMatch = mintResult.match(/Transaction hash for the mint: (0x[a-fA-F0-9]+)/)
      const linkMatch = mintResult.match(/Transaction link for the mint: (https:\/\/[^\s]+)/)
      const transactionHash = hashMatch ? hashMatch[1] : ''
      const transactionLink = linkMatch ? linkMatch[1] : ''

      console.log('Minting complete')
      return NextResponse.json({ 
        success: true, 
        transactionHash,
        transactionLink,
        mintResult
      })
    } catch (error) {
      console.error('Mint execution error:', error)
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Detailed API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT'
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
