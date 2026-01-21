import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      plan: string
    }
  }
}

const authPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null)

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return // No auth header, continue without user
    }

    const token = authHeader.substring(7)

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token)

      if (error || !authUser) {
        return
      }

      // Get user from database
      const [dbUser] = await db
        .select({ id: users.id, email: users.email, plan: users.plan })
        .from(users)
        .where(eq(users.id, authUser.id))
        .limit(1)

      if (dbUser) {
        request.user = dbUser
      }
    } catch {
      // Invalid token, continue without user
    }
  })
}

export const authPlugin = fp(authPluginCallback, {
  name: 'auth-plugin',
})

// Helper to require authentication
export const requireAuth = async (request: FastifyRequest) => {
  if (!request.user) {
    throw { statusCode: 401, message: 'Authentication required' }
  }
}

// Helper to require specific plan
export const requirePlan = (plans: string[]) => async (request: FastifyRequest) => {
  await requireAuth(request)
  if (!plans.includes(request.user!.plan)) {
    throw { statusCode: 403, message: 'Upgrade required for this feature' }
  }
}
