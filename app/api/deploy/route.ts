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

export async function POST(request: Request) {
  try {
    console.log('Deploy API called')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name = "Cards Against NFT", symbol = "CANFT", baseURI = "https://cards-against.vercel.app/api/metadata/" } = await request.json()
    console.log('Request data:', { name, symbol, baseURI })

    const cdp = getCdpClient()

    // Get or create the minter account with a name (idempotent)
    const account = await cdp.evm.getOrCreateAccount({
      name: "cards-against-singularity-minter"
    })

    return NextResponse.json({
      success: true,
      message: 'Wallet provider initialized. NFT contract deployment is handled separately.',
      walletAddress: account.address,
      note: 'Use the existing NFT contract for minting or deploy a new contract via the CDP dashboard'
    })
  } catch (error) {
    console.error('Deploy API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize wallet'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
