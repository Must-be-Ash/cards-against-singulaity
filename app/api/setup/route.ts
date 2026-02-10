import { NextResponse } from 'next/server'
import { CdpClient } from "@coinbase/cdp-sdk"

// Singleton CDP client
let cdpClient: CdpClient | null = null

function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const apiKeyId = process.env.CDP_API_KEY_ID
    const apiKeySecret = process.env.CDP_API_KEY_SECRET
    const walletSecret = process.env.CDP_WALLET_SECRET

    if (!apiKeyId || !apiKeySecret || !walletSecret) {
      throw new Error('Missing CDP credentials. Check CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET')
    }

    cdpClient = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret,
    })
  }
  return cdpClient
}

export async function POST() {
  try {
    console.log('Setup API called')

    const cdp = getCdpClient()

    // Get or create the minter account with a name (idempotent)
    const account = await cdp.evm.getOrCreateAccount({
      name: "cards-against-singularity-minter"
    })

    console.log('Wallet initialized:', account.address)

    return NextResponse.json({
      success: true,
      message: 'Wallet setup complete',
      walletAddress: account.address,
      network: 'base-sepolia',
      faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet'
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to setup wallet'
      },
      { status: 500 }
    )
  }
}
