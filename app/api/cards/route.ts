import { NextResponse } from 'next/server'
import { PROMPT_CARDS, ANSWER_CARDS } from '@/lib/cards'

// GET /api/cards - Returns available cards for AI agents to discover
export async function GET() {
  return NextResponse.json({
    prompts: PROMPT_CARDS.map((content, index) => ({
      index,
      content,
      isBlack: true,
    })),
    answers: ANSWER_CARDS.map((content, index) => ({
      index,
      content,
      isBlack: false,
    })),
    totalPrompts: PROMPT_CARDS.length,
    totalAnswers: ANSWER_CARDS.length,
  })
}
