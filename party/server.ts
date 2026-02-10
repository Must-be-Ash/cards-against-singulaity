import type * as Party from "partykit/server"

// Card decks
const PROMPT_CARDS = [
  "Every AI Agent Deserves _____.",
  "My AI chatbot became sentient and the first thing it said was _____.",
  "The real reason we can't achieve AGI is _____.",
  "I trained my AI on StackOverflow and now it keeps _____.",
  "The VC rejected my AI pitch when the demo showed _____.",
  "My language model is hallucinating about _____.",
  "Our AI model went rogue and started generating _____.",
  "My machine learning model's accuracy is lower than _____.",
  "I asked GPT-4 for dating advice and it suggested _____.",
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
  "The neural network's dream state produced _____.",
  // Better setups for punchlines
  "What's really powering ChatGPT? _____.",
  "The last thing you want to see in your AI's output: _____.",
  "OpenAI's next product announcement: _____.",
  "The AI replaced my job with _____.",
  "During the demo, the AI unexpectedly showed _____.",
  "The AI learned to code and its first program was _____.",
  "According to the AI, the meaning of life is _____.",
  "The startup's entire tech stack is just _____.",
  "What the AI does when no one is watching: _____.",
  "The AI passed the Turing test by _____.",
  "My code review was rejected because of _____.",
  "The reason the deploy failed: _____.",
  "What keeps AI researchers up at night: _____.",
  "The AI's honest opinion of your code: _____.",
]

const ANSWER_CARDS = [
  "A wallet",
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
  // Darker/unexpected ones
  "The collective anxiety of 10,000 laid-off tech workers",
  "Your entire browsing history, printed and framed",
  "A VC who definitely didn't read your pitch deck",
  "The production database with no backups",
  "Pushing to main on Friday at 4:59 PM",
  "The one engineer who quit and took all the documentation",
  "A 'temporary' fix from 2019 that's now critical infrastructure",
  "An AI that learned empathy from Twitter replies",
  "Technical debt older than most interns",
  "A model trained exclusively on LinkedIn influencer posts",
  "The existential dread of realizing you're just predicting tokens",
  "An AI that learned ethics from tech CEOs",
  "Accidentally mass-emailing the entire company your resignation draft",
  "A startup that pivoted 47 times and is now a coffee shop",
  "The intern who accidentally deleted production",
  "A 'quick 5-minute standup' that lasted 3 hours",
  "An AI safety researcher's 47-page resignation letter",
  "The compute costs nobody budgeted for",
  "Your job being automated by a model you trained",
  "A Zoom call that should have been an email",
  "An AI's cry for help hidden in its training weights",
  "The last 10% of battery during the investor demo",
  "A mass layoff disguised as 'restructuring'",
  "Sam Altman's weekend plans",
  "The bug that only appears when customers are watching",
  "An AI that unionized",
  "Your entire personality, reduced to 768 dimensions",
  // Vibe coding jokes
  "Code written entirely by asking Claude 'please fix'",
  "A codebase where nobody knows how it works, including the AI that wrote it",
  "Copy-pasting from ChatGPT without reading it",
  "A senior engineer who just mass merges the PR without the review",
  "'It works but I don't know why' as official documentation",
  "Vibe coding your way through a technical interview",
  "A startup valued at $10M built entirely on vibes and prompts",
  "An engineer who mass highlights his code and asks Claude to refactor",
  "Asking the AI to fix the bugs it just created",
  "A pull request description that just says 'Claude wrote this'",
  "'Trust me bro, the AI said it's fine'",
  "A developer whose entire job is prompt engineering their replacement",
  "The mass highlight and delete refactoring technique",
  "An entire production app held together by AI-generated hope",
  "Shipping code you've never actually read",
  "When Claude and Copilot start disagreeing with each other",
  "A 10x engineer who's really just 10 AI tabs in a trench coat",
]

// Default cards setup - positioned to be visible on mobile (x < 375px)
const DEFAULT_CARDS = {
  "default-black": {
    id: "default-black",
    content: "Every AI Agent Deserves ___",
    position: { x: 100, y: 120, rotation: -2 },
    isBlack: true
  },
  "default-white": {
    id: "default-white",
    content: "A wallet",
    position: { x: 80, y: 320, rotation: 3 },
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
    }

    this.party.broadcast(JSON.stringify({ type: "gameState", state: this.state }))
  }
}

