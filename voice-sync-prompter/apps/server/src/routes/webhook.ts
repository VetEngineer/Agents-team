import { FastifyPluginAsync } from 'fastify'
import Stripe from 'stripe'
import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import { PLAN_LIMITS } from './subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Stripe webhook
  fastify.post('/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody as Buffer,
        sig,
        webhookSecret
      )
    } catch (err) {
      fastify.log.error('Webhook signature verification failed')
      return reply.status(400).send({ error: 'Invalid signature' })
    }

    fastify.log.info(`Processing webhook: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as 'pro' | 'team'

        if (userId && plan) {
          const subscriptionId = session.subscription as string

          await db
            .update(users)
            .set({
              plan,
              stripeSubscriptionId: subscriptionId,
              whisperMinutesLimit: PLAN_LIMITS[plan].whisperMinutes,
              whisperMinutesUsed: 0, // Reset on new subscription
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))

          fastify.log.info(`User ${userId} upgraded to ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1)

        if (user) {
          // Check if subscription is active
          if (subscription.status === 'active') {
            // Get plan from price
            const priceId = subscription.items.data[0]?.price.id
            const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'team'

            await db
              .update(users)
              .set({
                plan,
                whisperMinutesLimit: PLAN_LIMITS[plan].whisperMinutes,
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id))
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db
          .update(users)
          .set({
            plan: 'free',
            stripeSubscriptionId: null,
            whisperMinutesLimit: PLAN_LIMITS.free.whisperMinutes,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))

        fastify.log.info(`Customer ${customerId} downgraded to free`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Reset monthly usage on successful payment
        if (invoice.billing_reason === 'subscription_cycle') {
          await db
            .update(users)
            .set({
              whisperMinutesUsed: 0,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId))

          fastify.log.info(`Reset usage for customer ${customerId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        fastify.log.warn(`Payment failed for customer ${invoice.customer}`)
        // Could send email notification here
        break
      }
    }

    return { received: true }
  })
}
