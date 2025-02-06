import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

type MintGameStateProps = {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  isProcessing: boolean
}

type MintStatus = {
  status: 'idle' | 'minting' | 'success' | 'error'
  message: string
  transactionHash?: string
  transactionLink?: string
  logs?: string[]
}

export default function MintGameState({ isOpen, onClose, imageUrl, isProcessing }: MintGameStateProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [mintStatus, setMintStatus] = useState<MintStatus>({
    status: 'idle',
    message: '',
    logs: []
  })

  // Add debugging
  console.log('MintGameState props:', { isOpen, imageUrl })

  const handleMint = async () => {
    if (!walletAddress) return

    try {
      setMintStatus({
        status: 'minting',
        message: 'Initializing minting process...',
        logs: ['Starting NFT minting process...']
      })

      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          walletAddress
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint NFT')
      }

      // Extract logs from the response if available
      const logs = data.mintResult?.split('\n').filter(Boolean) || []

      setMintStatus({
        status: 'success',
        message: 'NFT minted successfully!',
        transactionHash: data.transactionHash,
        transactionLink: data.transactionLink,
        logs
      })
    } catch (error) {
      setMintStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to mint NFT',
        logs: mintStatus.logs
      })
    }
  }

  const handleClose = () => {
    setMintStatus({
      status: 'idle',
      message: '',
      logs: []
    })
    setWalletAddress("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border border-white/10 bg-[#111111] text-white shadow-2xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
            Mint this set
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your wallet address to mint this game state as an NFT.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 pt-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="text-gray-300 font-medium">Preparing your game state...</p>
            </div>
          ) : mintStatus.status === 'idle' && (
            <>
              <Input
                placeholder="Enter your wallet address"
                value={walletAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletAddress(e.target.value)}
                className="bg-[#111111] border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                disabled={!imageUrl}
              />
              <Button 
                onClick={handleMint} 
                disabled={!walletAddress || !imageUrl}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:bg-[#111111]"
              >
                Mint NFT
              </Button>
              {!imageUrl && (
                <p className="text-sm text-gray-400 text-center">
                  Processing game state...
                </p>
              )}
            </>
          )}

          {mintStatus.status === 'minting' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="text-gray-300 font-medium">{mintStatus.message}</p>
              </div>
              
              {mintStatus.logs && mintStatus.logs.length > 0 && (
                <div className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-300 mb-2">Progress:</p>
                  {mintStatus.logs.map((log, index) => (
                    <p key={index} className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {mintStatus.status === 'success' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-500 font-medium">{mintStatus.message}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Transaction Hash</p>
                    <div className="font-mono text-xs bg-gray-800/50 p-1.5 rounded break-all text-gray-300">
                      {mintStatus.transactionHash}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Image URL</p>
                    <div className="font-mono text-xs bg-gray-800/50 p-1.5 rounded break-all text-gray-300">
                      {imageUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <a
                      href={mintStatus.transactionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      View on Block Explorer
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      View Image
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleClose}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Close
              </Button>
            </div>
          )}

          {mintStatus.status === 'error' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-red-500 font-medium">{mintStatus.message}</p>
                </div>
              </div>
              
              {mintStatus.logs && mintStatus.logs.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-300 mb-2">Error Details:</p>
                  {mintStatus.logs.map((log, index) => (
                    <p key={index} className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                      {log}
                    </p>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={handleClose} 
                variant="secondary"
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
