import type * as Party from "partykit/server"
import { PROMPT_CARDS, ANSWER_CARDS, DEFAULT_CARDS, type CardPosition, type PlayedCard } from "../lib/cards"

type GameState = {
  playedCards: Record<string, PlayedCard>
  availablePrompts: string[]
  availableAnswers: string[]
}

export default class CardsServer implements Party.Server {
  private state: GameState = {
    playedCards: { ...DEFAULT_CARDS },
    availablePrompts: [...PROMPT_CARDS],
    availableAnswers: [...ANSWER_CARDS],
  }

  constructor(readonly party: Party.Party) {}

  async onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "gameState", state: this.state }))
  }

  async onMessage(message: string) {
    const data = JSON.parse(message)

    switch (data.type) {
      case "clearCards": {
        this.state.playedCards = { ...DEFAULT_CARDS }
        break
      }

      case "addCard": {
        const { isBlack, viewport } = data
        const availableCards = isBlack ? this.state.availablePrompts : this.state.availableAnswers
        if (availableCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCards.length)
          const content = availableCards.splice(randomIndex, 1)[0]
          const cardId = `card-${Date.now()}-${Math.random()}`

          // Card dimensions (mobile: 176x256, desktop: 256x384)
          const cardWidth = viewport?.width && viewport.width < 768 ? 176 : 256
          const cardHeight = viewport?.width && viewport.width < 768 ? 256 : 384

          // Calculate center position based on viewport, with padding for card size
          const viewportWidth = viewport?.width || 800
          const viewportHeight = viewport?.height || 600
          const headerHeight = viewport?.width && viewport.width < 768 ? 64 : 96
          const footerHeight = viewport?.width && viewport.width < 768 ? 128 : 96

          // Available area for cards (accounting for header, footer, and card size)
          const availableWidth = viewportWidth - cardWidth - 32 // 32px padding
          const availableHeight = viewportHeight - headerHeight - footerHeight - cardHeight

          // Center of available area
          const centerX = 16 + availableWidth / 2
          const centerY = headerHeight + availableHeight / 2

          // Random offset (smaller on mobile)
          const offsetRange = viewport?.width && viewport.width < 768 ? 60 : 100

          this.state.playedCards[cardId] = {
            id: cardId,
            content,
            position: {
              x: centerX + (Math.random() - 0.5) * offsetRange,
              y: centerY + (Math.random() - 0.5) * offsetRange,
              rotation: (Math.random() - 0.5) * 15
            },
            isBlack
          }
        }
        break
      }

      case "moveCard": {
        const { cardId, position } = data
        if (this.state.playedCards[cardId]) {
          const boundedPosition = {
            x: Math.max(-1000, Math.min(2000, position.x)),
            y: Math.max(-1000, Math.min(2000, position.y)),
            rotation: position.rotation
          }
          this.state.playedCards[cardId].position = boundedPosition
        }
        break
      }

      case "deleteCard": {
        const { cardId } = data
        if (this.state.playedCards[cardId]) {
          // Return the card content back to the available pool
          const card = this.state.playedCards[cardId]
          if (card.isBlack) {
            this.state.availablePrompts.push(card.content)
          } else {
            this.state.availableAnswers.push(card.content)
          }
          delete this.state.playedCards[cardId]
        }
        break
      }

      case "addSpecificCard": {
        // Allow adding a specific card by content (for AI agents)
        const { content, isBlack, position } = data
        if (!content) break

        const cardId = `card-${Date.now()}-${Math.random()}`

        // Use provided position or generate a default one
        const cardPosition = position || {
          x: 200 + Math.random() * 300,
          y: 150 + Math.random() * 200,
          rotation: (Math.random() - 0.5) * 15
        }

        this.state.playedCards[cardId] = {
          id: cardId,
          content,
          position: cardPosition,
          isBlack: isBlack ?? false
        }

        // Remove from available pool if it exists there
        if (isBlack) {
          const idx = this.state.availablePrompts.indexOf(content)
          if (idx !== -1) this.state.availablePrompts.splice(idx, 1)
        } else {
          const idx = this.state.availableAnswers.indexOf(content)
          if (idx !== -1) this.state.availableAnswers.splice(idx, 1)
        }
        break
      }
    }

    this.party.broadcast(JSON.stringify({ type: "gameState", state: this.state }))
  }
}

