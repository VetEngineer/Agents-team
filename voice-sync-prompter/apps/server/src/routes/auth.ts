import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabase } from '../plugins/auth'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Sign up
  fastify.post('/signup', async (request, reply) => {
    const body = signUpSchema.parse(request.body)

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    })

    if (error) {
      return reply.status(400).send({ error: error.message })
    }

    if (data.user) {
      // Create user in database
      await db.insert(users).values({
        id: data.user.id,
        email: body.email,
        name: body.name,
        plan: 'free',
        whisperMinutesLimit: 0,
      })
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
      } : null,
      session: data.session,
    }
  })

  // Sign in
  fastify.post('/signin', async (request, reply) => {
    const body = signInSchema.parse(request.body)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error) {
      return reply.status(401).send({ error: error.message })
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.user.id))
      .limit(1)

    return {
      user: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        plan: dbUser.plan,
      } : null,
      session: data.session,
    }
  })

  // Sign out
  fastify.post('/signout', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const { error } = await supabase.auth.admin.signOut(token)

    if (error) {
      return reply.status(400).send({ error: error.message })
    }

    return { success: true }
  })

  // Get current user
  fastify.get('/me', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' })
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.id))
      .limit(1)

    if (!dbUser) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      plan: dbUser.plan,
      whisperMinutesUsed: dbUser.whisperMinutesUsed,
      whisperMinutesLimit: dbUser.whisperMinutesLimit,
    }
  })

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).parse(request.body)

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.refreshToken,
    })

    if (error) {
      return reply.status(401).send({ error: error.message })
    }

    return { session: data.session }
  })
}
