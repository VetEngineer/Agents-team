import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { authPlugin } from './plugins/auth'
import { authRoutes } from './routes/auth'
import { scriptsRoutes } from './routes/scripts'
import { transcriptionRoutes } from './routes/transcription'
import { subscriptionRoutes } from './routes/subscription'
import { webhookRoutes } from './routes/webhook'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
})

// Plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
})

await fastify.register(multipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for Whisper API
  },
})

await fastify.register(authPlugin)

// Routes
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(scriptsRoutes, { prefix: '/scripts' })
await fastify.register(transcriptionRoutes, { prefix: '/transcription' })
await fastify.register(subscriptionRoutes, { prefix: '/subscription' })
await fastify.register(webhookRoutes, { prefix: '/webhook' })

// Health check
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    fastify.log.info(`Server listening on ${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
