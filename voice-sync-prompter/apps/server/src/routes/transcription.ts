import { FastifyPluginAsync } from 'fastify'
import OpenAI from 'openai'
import { db, users, transcriptions, usageLogs } from '../db'
import { eq } from 'drizzle-orm'
import { requireAuth, requirePlan } from '../plugins/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const transcriptionRoutes: FastifyPluginAsync = async (fastify) => {
  // Transcribe audio (Pro/Team only)
  fastify.post('/', async (request, reply) => {
    await requireAuth(request)
    await requirePlan(['pro', 'team'])(request)

    // Check usage limits
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Team plan has unlimited, Pro has limit
    if (user.plan === 'pro' && user.whisperMinutesUsed >= user.whisperMinutesLimit) {
      return reply.status(403).send({
        error: 'Monthly Whisper quota exceeded',
        used: user.whisperMinutesUsed,
        limit: user.whisperMinutesLimit,
      })
    }

    // Get uploaded file
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: 'No audio file provided' })
    }

    const buffer = await data.toBuffer()
    const file = new File([buffer], data.filename, { type: data.mimetype })

    try {
      const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'ko',
        response_format: 'verbose_json',
      })

      // Calculate duration (approximate from segments or file)
      const duration = response.duration ? Math.ceil(response.duration / 60) : 1

      // Update usage
      await db
        .update(users)
        .set({
          whisperMinutesUsed: user.whisperMinutesUsed + duration,
          updatedAt: new Date(),
        })
        .where(eq(users.id, request.user!.id))

      // Log transcription
      const [transcription] = await db
        .insert(transcriptions)
        .values({
          userId: request.user!.id,
          text: response.text,
          segments: response.segments?.map((s, i) => ({
            id: i,
            start: s.start,
            end: s.end,
            text: s.text,
          })),
          duration: Math.ceil(response.duration || 0),
          language: response.language || 'ko',
        })
        .returning()

      // Log usage
      await db.insert(usageLogs).values({
        userId: request.user!.id,
        action: 'transcription',
        details: {
          transcriptionId: transcription.id,
          duration,
          language: response.language,
        },
      })

      return {
        text: response.text,
        segments: response.segments,
        duration: response.duration,
        language: response.language,
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Transcription failed' })
    }
  })

  // Get transcription history
  fastify.get('/history', async (request, reply) => {
    await requireAuth(request)

    const history = await db
      .select({
        id: transcriptions.id,
        text: transcriptions.text,
        duration: transcriptions.duration,
        language: transcriptions.language,
        createdAt: transcriptions.createdAt,
      })
      .from(transcriptions)
      .where(eq(transcriptions.userId, request.user!.id))
      .orderBy(transcriptions.createdAt)
      .limit(50)

    return history
  })

  // Get usage stats
  fastify.get('/usage', async (request, reply) => {
    await requireAuth(request)

    const [user] = await db
      .select({
        whisperMinutesUsed: users.whisperMinutesUsed,
        whisperMinutesLimit: users.whisperMinutesLimit,
        plan: users.plan,
      })
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return {
      used: user.whisperMinutesUsed,
      limit: user.plan === 'team' ? Infinity : user.whisperMinutesLimit,
      plan: user.plan,
    }
  })
}
