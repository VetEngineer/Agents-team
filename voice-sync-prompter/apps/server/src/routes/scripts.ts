import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, scripts } from '../db'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '../plugins/auth'

const createScriptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().default(''),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
  }).optional(),
})

const updateScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  metadata: z.object({
    wordCount: z.number().optional(),
    estimatedDuration: z.number().optional(),
    lastPosition: z.number().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  isPublic: z.boolean().optional(),
})

export const scriptsRoutes: FastifyPluginAsync = async (fastify) => {
  // List scripts
  fastify.get('/', async (request, reply) => {
    await requireAuth(request)

    const userScripts = await db
      .select({
        id: scripts.id,
        title: scripts.title,
        metadata: scripts.metadata,
        isPublic: scripts.isPublic,
        createdAt: scripts.createdAt,
        updatedAt: scripts.updatedAt,
      })
      .from(scripts)
      .where(eq(scripts.userId, request.user!.id))
      .orderBy(desc(scripts.updatedAt))

    return userScripts
  })

  // Get single script
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await requireAuth(request)

    const [script] = await db
      .select()
      .from(scripts)
      .where(
        and(
          eq(scripts.id, request.params.id),
          eq(scripts.userId, request.user!.id)
        )
      )
      .limit(1)

    if (!script) {
      return reply.status(404).send({ error: 'Script not found' })
    }

    return script
  })

  // Create script
  fastify.post('/', async (request, reply) => {
    await requireAuth(request)

    const body = createScriptSchema.parse(request.body)

    const [script] = await db
      .insert(scripts)
      .values({
        userId: request.user!.id,
        title: body.title,
        content: body.content,
        metadata: body.metadata,
      })
      .returning()

    return reply.status(201).send(script)
  })

  // Update script
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await requireAuth(request)

    const body = updateScriptSchema.parse(request.body)

    const [existing] = await db
      .select({ id: scripts.id })
      .from(scripts)
      .where(
        and(
          eq(scripts.id, request.params.id),
          eq(scripts.userId, request.user!.id)
        )
      )
      .limit(1)

    if (!existing) {
      return reply.status(404).send({ error: 'Script not found' })
    }

    const [updated] = await db
      .update(scripts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, request.params.id))
      .returning()

    return updated
  })

  // Delete script
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await requireAuth(request)

    const [existing] = await db
      .select({ id: scripts.id })
      .from(scripts)
      .where(
        and(
          eq(scripts.id, request.params.id),
          eq(scripts.userId, request.user!.id)
        )
      )
      .limit(1)

    if (!existing) {
      return reply.status(404).send({ error: 'Script not found' })
    }

    await db.delete(scripts).where(eq(scripts.id, request.params.id))

    return { success: true }
  })
}
