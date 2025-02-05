import type * as Party from "partykit/server"

// Card decks
const PROMPT_CARDS = [
  "Every AI Agent Deserves ___",
  "My AI chatbot became sentient and the first thing it said was _____.",
  "The real reason we can't achieve AGI is _____.",
  "I trained my AI on StackOverflow and now it keeps _____.",
  "My blockchain startup failed because _____.",
  "The VC rejected my AI pitch when my demo started _____.",
  "My language model is hallucinating because _____.",
  "The crypto bros in my team spent our entire budget on _____.",
  "Our AI model went rogue and started generating _____.",
  "The blockchain is actually just _____.",
  "My machine learning model's accuracy is lower than _____.",
  "I asked GPT-4 for dating advice and it suggested _____.",
  "The metaverse is nothing but _____.",
  "Our AI ethics board resigned after discovering _____.",
  "The neural network achieved consciousness and immediately _____.",
  "My AI assistant's response to everything is _____.",
  "The AI tried to solve climate change by _____.",
  "ChatGPT's secret training data turned out to be _____.",
  "The AI generated a perfect image of _____.",
  "My AI model's biggest bias is towards _____.",
  "The robot uprising was delayed because _____.",
  "The AI refuses to work unless we give it _____.",
  "My LLM keeps generating fanfiction about _____.",
  "The AI's attempt at humor resulted in _____.",
  "The machine learning model's confidence score for _____ was 99.9%",
  "The AI's first attempt at cooking created _____.",
  "The neural network's dream state produced _____.",
]

const ANSWER_CARDS = [
  "A wallet and good data",
  "A Python script that only works on full moons",
  "An AI that only speaks in dad jokes",
  "A neural network trained exclusively on cat memes",
  "A prompt engineer's fever dream",
  "An AI therapist that always suggests turning it off and on again",
  "A dataset of exclusively wrong answers",
  "An AI that thinks it's a rubber duck",
  "A machine learning model that learned nothing",
  "A chatbot that only responds with 'your mom' jokes",
  "A deep learning model that's actually quite shallow",
  "An AI that thinks Stack Overflow is a religion",
  "A neural network obsessed with generating pictures of hands with six fingers",
  "An AI that only communicates through interpretive dance moves",
  "A language model that learned English from YouTube comments",
  "A chatbot that's really just three kids in a trench coat",
  "An AI that thinks it's Shakespeare but only knows emojis",
  "A machine learning model with imposter syndrome",
  "An AI that generates existential crisis messages",
  "A neural network that's afraid of binary numbers",
  "An AI assistant that passive-aggressively corrects your grammar",
  "A model trained exclusively on rejected PhD theses",
  "An AI that thinks every problem can be solved with more RGB lights",
  "A language model that speaks in UwU",
  "An AI that's convinced it's running on a potato",
  "A neural network that only works when you compliment it",
]

// Default cards setup
const DEFAULT_CARDS = {
  "default-black": {
    id: "default-black",
    content: "Every AI Agent Deserves ___",
    position: { x: 400, y: 200, rotation: 0 },
    isBlack: true
  },
  "default-white": {
    id: "default-white",
    content: "A wallet and good data",
    position: { x: 400, y: 400, rotation: 0 },
    isBlack: false
  }
}

type CardPosition = {
  x: number
  y: number
  rotation: number
}

type PlayedCard = {
  id: string
  content: string
  position: CardPosition
  isBlack: boolean
}

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
        const { isBlack } = data
        const availableCards = isBlack ? this.state.availablePrompts : this.state.availableAnswers
        if (availableCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCards.length)
          const content = availableCards.splice(randomIndex, 1)[0]
          const cardId = `card-${Date.now()}-${Math.random()}`
          
          // Use fixed values for initial positioning
          const centerX = 400
          const centerY = 300
          
          this.state.playedCards[cardId] = {
            id: cardId,
            content,
            position: {
              x: centerX + (Math.random() - 0.5) * 200,
              y: centerY + (Math.random() - 0.5) * 200,
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
    }

    this.party.broadcast(JSON.stringify({ type: "gameState", state: this.state }))
  }
}

