async function hmac(secret, message) {
  const material = secret.startsWith('whsec_') ? Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0)) : new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey('raw', material, {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
function parseSignatures(header){ return (header||'').split(' ').map(x=>x.trim()).filter(Boolean).map(x=>{const [v,s]=x.split(',',2);return {v,s};}); }
function equal(a,b){ if(a.length!==b.length)return false; let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0; }
export async function onRequestPost({request,env}){
  const raw=await request.text();
  const secret=env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if(!secret) return Response.json({error:'Webhook secret is not configured.'},{status:503});
  const id=request.headers.get('webhook-id');
  const ts=request.headers.get('webhook-timestamp');
  const sig=request.headers.get('webhook-signature');
  if(!id||!ts||!sig) return Response.json({error:'Missing webhook headers.'},{status:400});
  const age=Math.abs(Math.floor(Date.now()/1000)-Number(ts));
  if(!Number.isFinite(age)||age>300) return Response.json({error:'Stale webhook.'},{status:400});
  const expected='v1,'+await hmac(secret,`${id}.${ts}.${raw}`);
  const ok=parseSignatures(sig).some(x=>x.v==='v1'&&equal(x.s,expected.slice(3)));
  if(!ok) return Response.json({error:'Invalid webhook signature.'},{status:401});
  const event=JSON.parse(raw);
  // No signup is required by Life Pulse. The browser keeps its planner locally.
  // Production cloud entitlements can be added here later using D1/KV keyed by Dodo customer/subscription IDs.
  return Response.json({received:true,type:event?.type||null},{status:200});
}
