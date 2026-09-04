const PRODUCTS = new Set([
  'pdt_0NksHal3sXrCqCRxf6I4N',
  'pdt_0NkuNnubcfOh497WJboQF',
  'pdt_0NkuPkdN95tA8tTDURZEA'
]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!PRODUCTS.has(body.productId)) return Response.json({ error: 'Invalid product.' }, { status: 400 });
    if (!env.DODO_PAYMENTS_API_KEY) return Response.json({ error: 'Dodo API key is not configured.' }, { status: 503 });
    const origin = new URL(request.url).origin;
    const mode = env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live' : 'test';
    const base = mode === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
    const response = await fetch(`${base}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_cart: [{ product_id: body.productId, quantity: 1 }],
        return_url: `${origin}/?payment=success&install_id=${encodeURIComponent(body.installId || '')}`, 
        cancel_url: `${origin}/?payment=cancelled`,
        allowed_payment_method_types: ['credit', 'debit', 'apple_pay', 'google_pay'],
        metadata: { source: 'life_pulse', campaign: body.source || 'upgrade', installation_id: body.installId || 'unknown' }
      })
    });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: data?.message || 'Dodo checkout creation failed.' }, { status: response.status });
    return Response.json({ checkout_url: data.checkout_url, session_id: data.session_id });
  } catch (error) {
    return Response.json({ error: error?.message || 'Checkout error.' }, { status: 500 });
  }
}
