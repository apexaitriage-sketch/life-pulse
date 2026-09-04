const PRODUCTS = {
  'pdt_0NksHal3sXrCqCRxf6I4N': 'Life Pulse Premium',
  'pdt_0NkuNnubcfOh497WJboQF': 'Life Pulse Lifetime',
  'pdt_0NkuPkdN95tA8tTDURZEA': 'Life Pulse Elite'
};

export async function onRequestGet({request,env}){
  try{
    if(!env.DODO_PAYMENTS_API_KEY) return Response.json({active:false,error:'Dodo API key is not configured.'},{status:503});
    const url=new URL(request.url); const paymentId=url.searchParams.get('payment_id'); const subscriptionId=url.searchParams.get('subscription_id'); const installId=url.searchParams.get('install_id');
    if(!installId || (!paymentId&&!subscriptionId)) return Response.json({active:false},{status:400});
    const base=env.DODO_PAYMENTS_ENVIRONMENT==='live_mode'?'https://live.dodopayments.com':'https://test.dodopayments.com';
    const path=paymentId?`/payments/${encodeURIComponent(paymentId)}`:`/subscriptions/${encodeURIComponent(subscriptionId)}`;
    const response=await fetch(base+path,{headers:{Authorization:`Bearer ${env.DODO_PAYMENTS_API_KEY}`}});
    const data=await response.json(); if(!response.ok) return Response.json({active:false},{status:response.status});
    const status=paymentId?data.status:'active';
    const meta=data.metadata||data.customer?.metadata||{};
    const productId=paymentId?data.product_cart?.[0]?.product_id:data.product_id;
    const metadataMatch=meta.installation_id===installId;
    const valid=Boolean(metadataMatch && PRODUCTS[productId] && (paymentId ? status==='succeeded' : status==='active'));
    return Response.json({active:valid,planName:PRODUCTS[productId]||null,productId:productId||null,subscriptionId:data.id||subscriptionId||null});
  }catch(error){return Response.json({active:false,error:error?.message||'Verification failed.'},{status:500});}
}
