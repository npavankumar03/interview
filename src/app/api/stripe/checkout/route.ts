import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOne, query } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import Stripe from "stripe";

export async function POST() {
  try {
    const stripeKey = await getSetting("stripe_secret_key");
    const priceId = await getSetting("stripe_pro_price_id");

    if (!stripeKey || !priceId) {
      return NextResponse.json({ error: "Stripe not configured. Contact admin." }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOne(
      "SELECT id, stripe_customer_id FROM users WHERE email = $1",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, user.id]);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
