import { FastifyPluginAsync } from 'fastify'
import Stripe from 'stripe'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../plugins/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  team: process.env.STRIPE_TEAM_PRICE_ID || '',
}

const PLAN_LIMITS = {
  free: { whisperMinutes: 0 },
  pro: { whisperMinutes: 60 }, // 1 hour/month
  team: { whisperMinutes: Infinity },
}

export const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current subscription
  fastify.get('/', async (request, reply) => {
    await requireAuth(request)

    const [user] = await db
      .select({
        plan: users.plan,
        stripeSubscriptionId: users.stripeSubscriptionId,
        whisperMinutesUsed: users.whisperMinutesUsed,
        whisperMinutesLimit: users.whisperMinutesLimit,
      })
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    let subscription = null
    if (user.stripeSubscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      } catch {
        // Subscription may have been deleted
      }
    }

    return {
      plan: user.plan,
      whisperMinutesUsed: user.whisperMinutesUsed,
      whisperMinutesLimit: user.whisperMinutesLimit,
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
    }
  })

  // Create checkout session
  fastify.post<{ Body: { plan: 'pro' | 'team' } }>('/checkout', async (request, reply) => {
    await requireAuth(request)

    const { plan } = request.body

    if (!['pro', 'team'].includes(plan)) {
      return reply.status(400).send({ error: 'Invalid plan' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id))
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/settings?subscription=success`,
      cancel_url: `${process.env.APP_URL}/pricing?subscription=cancelled`,
      metadata: {
        userId: user.id,
        plan,
      },
    })

    return { url: session.url }
  })

  // Create portal session (manage subscription)
  fastify.post('/portal', async (request, reply) => {
    await requireAuth(request)

    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user?.stripeCustomerId) {
      return reply.status(400).send({ error: 'No subscription found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.APP_URL}/settings`,
    })

    return { url: session.url }
  })

  // Cancel subscription
  fastify.post('/cancel', async (request, reply) => {
    await requireAuth(request)

    const [user] = await db
      .select({ stripeSubscriptionId: users.stripeSubscriptionId })
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1)

    if (!user?.stripeSubscriptionId) {
      return reply.status(400).send({ error: 'No subscription found' })
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    return { success: true }
  })
}

export { PLAN_LIMITS }
