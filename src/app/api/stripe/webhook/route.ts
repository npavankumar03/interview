import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    const stripeKey = await getSetting("stripe_secret_key");
    const webhookSecret = await getSetting("stripe_webhook_secret");

    if (!stripeKey || !webhookSecret) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        await query(
          "UPDATE users SET plan = 'pro', stripe_subscription_id = $1, credits = 999999 WHERE id = $2",
          [session.subscription as string, userId]
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await query(
        "UPDATE users SET plan = 'free', stripe_subscription_id = NULL, credits = 3 WHERE stripe_customer_id = $1",
        [customerId]
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`Payment failed for customer: ${invoice.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
