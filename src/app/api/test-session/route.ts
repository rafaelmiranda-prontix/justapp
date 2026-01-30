import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function GET() {
  try {
    const sessionId = `test_${nanoid(10)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    console.log('Testing session creation...')
    console.log('SessionId:', sessionId)

    // Test 1: Create without messages
    const now = new Date()
    const session1 = await prisma.anonymousSession.create({
      data: {
        id: nanoid(),
        sessionId: `${sessionId}_empty`,
        mensagens: [],
        status: 'ACTIVE',
        expiresAt,
        updatedAt: now,
      },
    })
    console.log('✓ Empty session created:', session1.id)

    // Test 2: Create with simple message
    const session2 = await prisma.anonymousSession.create({
      data: {
        id: nanoid(),
        sessionId: `${sessionId}_simple`,
        mensagens: [
          {
            role: 'assistant',
            content: 'Test message',
            timestamp: new Date().toISOString(),
          },
        ],
        status: 'ACTIVE',
        expiresAt,
        updatedAt: now,
      },
    })
    console.log('✓ Session with message created:', session2.id)

    // Clean up
    await prisma.anonymousSession.deleteMany({
      where: {
        sessionId: {
          startsWith: sessionId,
        },
      },
    })

    return NextResponse.json({
      status: 'ok',
      message: 'Session creation test passed',
    })
  } catch (error: any) {
    console.error('Test failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
