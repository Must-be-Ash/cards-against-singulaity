import { NextResponse } from 'next/server'
import { PROMPT_CARDS, ANSWER_CARDS } from '@/lib/cards'
import WebSocket from 'ws'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999'
const ROOM_ID = 'game'

type CardPosition = {
  x: number
  y: number
  rotation: number
}

interface AgentPlayRequest {
  action: 'addCard' | 'addSpecificCard' | 'moveCard' | 'deleteCard' | 'clearCards' | 'getState'
  // For addSpecificCard
  promptIndex?: number
  answerIndex?: number
  content?: string
  isBlack?: boolean
  position?: CardPosition
  // For moveCard
  cardId?: string
}

// Send message to PartyKit room
async function sendToPartyKit(message: object): Promise<void> {
  const protocol = PARTYKIT_HOST.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${PARTYKIT_HOST}/parties/main/${ROOM_ID}`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
}

// Get current game state via WebSocket connection
async function getGameState(): Promise<object> {
  return new Promise((resolve, reject) => {
    const protocol = PARTYKIT_HOST.includes('localhost') ? 'ws' : 'wss'
    const ws = new WebSocket(`${protocol}://${PARTYKIT_HOST}/parties/main/${ROOM_ID}`)

    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Timeout waiting for game state'))
    }, 5000)

    ws.on('message', (data: Buffer) => {
      clearTimeout(timeout)
      const parsed = JSON.parse(data.toString())
      if (parsed.type === 'gameState') {
        ws.close()
        resolve(parsed.state)
      }
    })

    ws.on('error', (err: Error) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

export async function GET() {
  try {
    const state = await getGameState()
    return NextResponse.json({
      success: true,
      state,
      message: 'Current game state retrieved'
    })
  } catch (error) {
    console.error('Failed to get game state:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: AgentPlayRequest = await request.json()
    const { action, promptIndex, answerIndex, content, isBlack, position, cardId } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (addCard, addSpecificCard, moveCard, deleteCard, clearCards, getState)' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'getState': {
        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          message: 'Current game state retrieved'
        })
      }

      case 'addCard': {
        // Add random card (same as human UI)
        if (typeof isBlack !== 'boolean') {
          return NextResponse.json(
            { error: 'isBlack is required for addCard (true for prompt, false for answer)' },
            { status: 400 }
          )
        }
        await sendToPartyKit({ type: 'addCard', isBlack, viewport: { width: 1024, height: 768 } })
        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          message: `Random ${isBlack ? 'prompt' : 'answer'} card added to board`
        })
      }

      case 'addSpecificCard': {
        // Add specific card by index or content
        let cardContent = content
        let cardIsBlack = isBlack

        if (typeof promptIndex === 'number') {
          if (promptIndex < 0 || promptIndex >= PROMPT_CARDS.length) {
            return NextResponse.json(
              { error: `Invalid promptIndex: ${promptIndex}. Valid range: 0-${PROMPT_CARDS.length - 1}` },
              { status: 400 }
            )
          }
          cardContent = PROMPT_CARDS[promptIndex]
          cardIsBlack = true
        } else if (typeof answerIndex === 'number') {
          if (answerIndex < 0 || answerIndex >= ANSWER_CARDS.length) {
            return NextResponse.json(
              { error: `Invalid answerIndex: ${answerIndex}. Valid range: 0-${ANSWER_CARDS.length - 1}` },
              { status: 400 }
            )
          }
          cardContent = ANSWER_CARDS[answerIndex]
          cardIsBlack = false
        }

        if (!cardContent) {
          return NextResponse.json(
            { error: 'Provide promptIndex, answerIndex, or content' },
            { status: 400 }
          )
        }

        await sendToPartyKit({
          type: 'addSpecificCard',
          content: cardContent,
          isBlack: cardIsBlack ?? false,
          position
        })

        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          cardAdded: { content: cardContent, isBlack: cardIsBlack },
          message: `Card "${cardContent.substring(0, 30)}..." added to board`
        })
      }

      case 'moveCard': {
        if (!cardId || !position) {
          return NextResponse.json(
            { error: 'cardId and position are required for moveCard' },
            { status: 400 }
          )
        }
        await sendToPartyKit({ type: 'moveCard', cardId, position })
        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          message: `Card ${cardId} moved`
        })
      }

      case 'deleteCard': {
        if (!cardId) {
          return NextResponse.json(
            { error: 'cardId is required for deleteCard' },
            { status: 400 }
          )
        }
        await sendToPartyKit({ type: 'deleteCard', cardId })
        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          message: `Card ${cardId} deleted`
        })
      }

      case 'clearCards': {
        await sendToPartyKit({ type: 'clearCards' })
        const state = await getGameState()
        return NextResponse.json({
          success: true,
          state,
          message: 'Board cleared to default cards'
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Agent play error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process action'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
