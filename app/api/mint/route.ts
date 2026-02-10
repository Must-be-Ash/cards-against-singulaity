import { NextResponse } from 'next/server'
import { CdpClient } from "@coinbase/cdp-sdk"
import { encodeFunctionData, parseAbi, getAddress } from 'viem'

// NFT contract ABI for minting
const NFT_ABI = parseAbi([
  'function mint(address to, uint256 quantity) external'
])

// NFT contract address on Base Sepolia
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || "0x3D13c2cEF827A30e7b1282F5C3Ef6F5C1c5c7268"

// Singleton CDP client
let cdpClient: CdpClient | null = null

function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const apiKeyId = process.env.CDP_API_KEY_ID
    const apiKeySecret = process.env.CDP_API_KEY_SECRET
    const walletSecret = process.env.CDP_WALLET_SECRET

    // Debug: Check which env vars are present
    console.log('CDP_API_KEY_ID:', apiKeyId ? `${apiKeyId.substring(0, 8)}...` : 'MISSING')
    console.log('CDP_API_KEY_SECRET:', apiKeySecret ? `${apiKeySecret.substring(0, 8)}...` : 'MISSING')
    console.log('CDP_WALLET_SECRET:', walletSecret ? `${walletSecret.substring(0, 20)}...` : 'MISSING')

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
    console.log('Mint API called')
    const { imageUrl, walletAddress } = await request.json()
    console.log('Request data:', { imageUrl, walletAddress })

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const cdp = getCdpClient()

    // Get or create account with a name (idempotent - always returns same account)
    console.log('Getting or creating server account...')
    const account = await cdp.evm.getOrCreateAccount({
      name: "cards-against-singularity-minter"
    })
    console.log('Server account address:', account.address)

    // Normalize addresses with proper checksum
    const normalizedWalletAddress = getAddress(walletAddress)
    const normalizedContractAddress = getAddress(NFT_CONTRACT)

    // Encode the mint function call
    const mintData = encodeFunctionData({
      abi: NFT_ABI,
      functionName: 'mint',
      args: [normalizedWalletAddress, BigInt(1)]
    })

    // Send the transaction using the v2 Server Wallet
    console.log('Sending mint transaction...')
    console.log('Contract:', normalizedContractAddress)
    console.log('Destination:', normalizedWalletAddress)

    const sendResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: "base-sepolia",
      transaction: {
        to: normalizedContractAddress,
        data: mintData,
      }
    })

    const transactionHash = sendResult.transactionHash
    console.log('Transaction hash:', transactionHash)
    const transactionLink = `https://sepolia.basescan.org/tx/${transactionHash}`

    return NextResponse.json({
      success: true,
      transactionHash,
      transactionLink,
      serverWalletAddress: account.address,
      mintResult: `Minted NFT from contract ${NFT_CONTRACT} to address ${walletAddress} on Base Sepolia.\nTransaction hash: ${transactionHash}\nTransaction link: ${transactionLink}`
    })

  } catch (error) {
    console.error('Mint API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
