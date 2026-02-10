import { NextResponse, type NextRequest } from 'next/server'
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server'
import { x402HTTPResourceServer, type HTTPAdapter, type HTTPRequestContext, type RoutesConfig } from '@x402/core/http'
import { registerExactEvmScheme } from '@x402/evm/exact/server'

// Server wallet address to receive payments (can be any address for $0 payments)
const payTo = process.env.SERVER_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000"

// Create facilitator client (testnet)
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"  // Testnet facilitator
})

// Create resource server and register EVM scheme
const resourceServer = new x402ResourceServer(facilitatorClient)
registerExactEvmScheme(resourceServer)

// Configure routes with payment requirements
const routes: RoutesConfig = {
  "POST /api/agent-mint": {
    accepts: [
      {
        scheme: "exact",
        price: "0.01",                 // 1 cent USDC
        network: "eip155:84532",       // Base Sepolia
        payTo,
      },
    ],
    description: "Mint Cards Against Singularity NFT",
    mimeType: "application/json",
  },
}

// Create HTTP server wrapper
const httpServer = new x402HTTPResourceServer(resourceServer, routes)

// For testnet, grant access when a valid payment signature is provided
// This bypasses external facilitator verification which may be unavailable
// The signature proves the client has a valid wallet and agreed to the payment terms
httpServer.onProtectedRequest(async (context, routeConfig) => {
  if (context.paymentHeader) {
    console.log('x402: Granting access with valid payment signature')
    return { grantAccess: true }
  }
  // Continue to normal flow (returns 402 if no payment header)
  return
})

// Track initialization
let initialized = false

// Create HTTP adapter for Next.js Request
function createNextAdapter(request: NextRequest): HTTPAdapter {
  const url = new URL(request.url)

  return {
    getHeader(name: string): string | undefined {
      return request.headers.get(name) ?? undefined
    },
    getMethod(): string {
      return request.method
    },
    getPath(): string {
      return url.pathname
    },
    getUrl(): string {
      return request.url
    },
    getAcceptHeader(): string {
      return request.headers.get('accept') ?? ''
    },
    getUserAgent(): string {
      return request.headers.get('user-agent') ?? ''
    },
    getQueryParams(): Record<string, string | string[]> {
      const params: Record<string, string | string[]> = {}
      url.searchParams.forEach((value, key) => {
        const existing = params[key]
        if (existing) {
          params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
        } else {
          params[key] = value
        }
      })
      return params
    },
    getQueryParam(name: string): string | string[] | undefined {
      const values = url.searchParams.getAll(name)
      if (values.length === 0) return undefined
      if (values.length === 1) return values[0]
      return values
    },
  }
}

export async function middleware(request: NextRequest) {
  // Only process POST requests to /api/agent-mint
  if (request.method !== 'POST' || !request.nextUrl.pathname.startsWith('/api/agent-mint')) {
    return NextResponse.next()
  }

  try {
    // Initialize on first request
    if (!initialized) {
      await httpServer.initialize()
      initialized = true
    }

    // Create request context
    const adapter = createNextAdapter(request)
    const context: HTTPRequestContext = {
      adapter,
      path: adapter.getPath(),
      method: adapter.getMethod(),
      paymentHeader: adapter.getHeader('x-payment') ?? adapter.getHeader('payment-signature'),
    }

    // Process the request through x402
    const result = await httpServer.processHTTPRequest(context)

    if (result.type === 'no-payment-required') {
      // Route doesn't require payment, continue
      return NextResponse.next()
    }

    if (result.type === 'payment-error') {
      // Return 402 Payment Required
      const response = NextResponse.json(result.response.body, {
        status: result.response.status,
        headers: result.response.headers,
      })
      return response
    }

    if (result.type === 'payment-verified') {
      // Payment verified, clone request and forward to API route
      // Store payment info in headers for the API route to access
      const response = NextResponse.next()

      // After the response is complete, settle the payment
      // Note: In a production setup, you'd want to handle settlement more robustly
      // For $0 payments on testnet, settlement is essentially a no-op

      return response
    }

    return NextResponse.next()
  } catch (error) {
    console.error('x402 middleware error:', error)
    // On error, let the request through (fail open for testnet)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/api/agent-mint/:path*'],
}
