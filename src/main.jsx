import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// ===== PRODUCT CONFIGURATION =====
const PRODUCTS = {
  premium: { id: 'pdt_0NksHal3sXrCqCRxf6I4N', name: 'Life Pulse Premium', price: '$7.99/mo', badge: 'Best starting point' },
  lifetime: { id: 'pdt_0NkuNnubcfOh497WJboQF', name: 'Life Pulse Lifetime', price: '$69 once', badge: 'Own it forever' },
  elite: { id: 'pdt_0NkuPkdN95tA8tTDURZEA', name: 'Life Pulse Elite', price: '$14.99/mo', badge: 'Power users' }
};

// ===== LIFE AREAS =====
const AREAS = [
  ['learning','🧠','Learning','Study, read, build skill'],
  ['health','💪','Health','Move, hydrate, rest'],
  ['work','💼','Work','Ship, focus, finish'],
  ['relationships','❤️','Relationships','Connect, call, care'],
  ['finance','💰','Finance','Budget, save, review'],
  ['home','🏠','Home','Clean, organize, reset'],
  ['creativity','🎨','Creativity','Make, design, invent']
];

// ===== MOOD INTELLIGENCE =====
const MOODS = {
  energised: { emoji:'⚡', label:'Energised', title:'Use the charge.', text:'Protect your high-energy window and attack one meaningful task before small admin.', actions:['Do the hardest task first','Take a short movement break','Finish one visible win before lunch'], color:'gold' },
  focused: { emoji:'🎯', label:'Focused', title:'Protect the tunnel.', text:'Your best move is fewer priorities with deeper attention. Avoid switching lanes too often.', actions:['Pick one deep task','Silence distractions for 25 minutes','Batch small tasks later'], color:'cyan' },
  calm: { emoji:'🌙', label:'Calm', title:'Build steadily.', text:'This is a good state for learning, planning, relationships and quiet progress.', actions:['Do one thoughtful task','Spend time on a relationship','Plan tomorrow before you finish'], color:'indigo' },
  stuck: { emoji:'🫧', label:'Stuck', title:'Make today smaller.', text:'You do not need a perfect day. Start tiny, protect your energy and build one quick win.', actions:['Choose the easiest useful task','Move for two minutes','Use Recovery Mode if the day feels heavy'], color:'rose' }
};

// ===== RETENTION CHALLENGES =====
const CHALLENGES = ['Finish one hard task before noon','Use 3 different life areas today','Create one shareable win card','Complete 3 meaningful tasks','Protect a 7-day streak','Give one hour to something that compounds'];
const today = () => new Date().toISOString().slice(0,10);
const read = (key, fallback) => { try { const v=localStorage.getItem(key); return v===null?fallback:JSON.parse(v); } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);

// ===== SCORING ENGINE =====
function scoreState(tasks){
  if (!tasks.length) return {score:0, balance:0, completed:0, active:0};
  const completed = tasks.filter(t=>t.done).length;
  const weights = {low:1, medium:2, high:3};
  const totalWeight = tasks.reduce((s,t)=>s+weights[t.priority],0);
  const doneWeight = tasks.filter(t=>t.done).reduce((s,t)=>s+weights[t.priority],0);
  const score = Math.round((doneWeight / Math.max(totalWeight,1))*100);
  const activeAreas = new Set(tasks.map(t=>t.area)).size;
  const balanced = Math.round(Math.min(100, (activeAreas/7)*78 + (completed>0 ? Math.min(22, completed*5) : 0)));
  return {score, balance:balanced, completed, active:activeAreas};
}
function identity(score){
  if(score>=95) return 'Legendary Flow';
  if(score>=90) return 'Power Day';
  if(score>=80) return 'Focused Sprint';
  if(score>=70) return 'Momentum Builder';
  if(score>=55) return 'Slow Burn';
  if(score>0) return 'Reset & Rebuild';
  return 'Start Here';
}
function stressLabel(mood, score, load){
  if(mood==='stuck' || load>12) return {label:'High', tone:'rose', tip:'Lower the bar, keep the streak alive with one meaningful win.'};
  if(mood==='energised' && score>=70 && load<=8) return {label:'Low', tone:'green', tip:'Use the momentum, then protect it with a real break.'};
  if(mood==='focused') return {label:'Moderate', tone:'cyan', tip:'Guard attention before adding more tasks.'};
  return {label:'Balanced', tone:'indigo', tip:'Keep the day steady and leave space to breathe.'};
}
// ===== STRATEGY / STRESS ENGINE =====
function strategyFor(mood, stats, tasks){
  const load = tasks.length;
  const s = stressLabel(mood, stats.score, load);
  if(mood==='stuck') return {headline:'Recovery mode is on.', sub:'You are not behind. You are rebuilding momentum.', moves:['Finish one task that takes under 10 minutes','Move your body for 2–5 minutes','Only then decide whether to add more'], footer:'A smaller day still counts.'};
  if(mood==='energised') return {headline:'Use the peak.', sub:'Your best energy is more valuable than a longer task list.', moves:['Start with the highest-impact task','Protect a 25–45 minute focus block','Stop before the energy crash'], footer:'Momentum is a resource — spend it intentionally.'};
  if(mood==='focused') return {headline:'Protect the tunnel.', sub:'Do less, deeper.', moves:['Choose one priority mission','Silence distractions for one focus block','Batch easy work after the deep win'], footer:'Depth beats busyness.'};
  return {headline:'Make calm compound.', sub:'Steady progress wins when it is repeatable.', moves:['Choose one thoughtful task','Touch one relationship or health win','Prepare tomorrow before closing today'], footer:'Consistency compounds quietly.'};
}

// ===== VISUAL SCORE COMPONENT =====
function Ring({value,label,caption,size=148}){
  const r=42, c=2*Math.PI*r, dash=c*Math.max(0,Math.min(100,value))/100;
  return <div className="ring-wrap" style={{width:size,height:size}}><svg viewBox="0 0 108 108" className="ring-svg"><circle cx="54" cy="54" r={r} className="ring-track"/><circle cx="54" cy="54" r={r} className="ring-value" style={{strokeDasharray:`${dash} ${c-dash}`}}/></svg><div className="ring-center"><strong>{value}</strong><span>{label}</span><small>{caption}</small></div></div>
}

// ===== MAIN PRODUCT EXPERIENCE =====
function App(){
  const [tab,setTab]=useState('today');
  const [tasks,setTasks]=useState(()=>read('lp.tasks',[]));
  const [history,setHistory]=useState(()=>read('lp.history',[]));
  const [mood,setMood]=useState(()=>read('lp.mood','focused'));
  const [challenge,setChallenge]=useState(()=>read('lp.challenge',0));
  const [toast,setToast]=useState('');
  const [draft,setDraft]=useState('');
  const [area,setArea]=useState('work');
  const [priority,setPriority]=useState('medium');
  const [showPulse,setShowPulse]=useState(false);
  const [pulseScores,setPulseScores]=useState(Object.fromEntries(AREAS.map(([id])=>[id,7])));
  const [premium,setPremium]=useState(()=>read('lp.premium',false));
  const [premiumPlan,setPremiumPlan]=useState(()=>read('lp.premiumPlan',null));
  const [busy,setBusy]=useState(false);
  const [celebrate,setCelebrate]=useState(false);
  const [strategyExpanded,setStrategyExpanded]=useState(false);
  const [tomorrowReady,setTomorrowReady]=useState(false);
  const installId=useMemo(()=>{let id=localStorage.getItem('lp.installId'); if(!id){id=uid(); localStorage.setItem('lp.installId',id);} return id;},[]);

  const stats=useMemo(()=>scoreState(tasks),[tasks]);
  const moodInfo=MOODS[mood]||MOODS.focused;
  const dayLabel=new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
  const streak=history.length ? Math.max(...history.map(x=>x.streak||0)) : 0;
  const activeAreas=stats.active;
  const challengeText=CHALLENGES[Math.abs(challenge)%CHALLENGES.length];
  const strongest=useMemo(()=>[...AREAS].sort((a,b)=>{
    const ap=tasks.filter(t=>t.area===a[0]&&t.done).length; const bp=tasks.filter(t=>t.area===b[0]&&t.done).length; return bp-ap;
  })[0],[tasks]);
  const weakest=useMemo(()=>[...AREAS].sort((a,b)=>{
    const ap=tasks.filter(t=>t.area===a[0]&&t.done).length; const bp=tasks.filter(t=>t.area===b[0]&&t.done).length; return ap-bp;
  })[0],[tasks]);
  const stress=useMemo(()=>stressLabel(mood,stats.score,tasks.length),[mood,stats.score,tasks.length]);
  const strategy=useMemo(()=>strategyFor(mood,stats,tasks),[mood,stats,tasks.length]);
  const overload = tasks.length>10 || (tasks.length>7 && mood==='stuck');
  const perfectDays=history.filter(x=>x.score>=90).length;
  const monthAverage=history.length?Math.round(history.slice(0,28).reduce((s,x)=>s+x.score,0)/Math.min(28,history.length)):0;

  useEffect(()=>write('lp.tasks',tasks),[tasks]);
  useEffect(()=>write('lp.history',history),[history]);
  useEffect(()=>write('lp.mood',mood),[mood]);
  useEffect(()=>write('lp.challenge',challenge),[challenge]);
  useEffect(()=>write('lp.premium',premium),[premium]);
  useEffect(()=>write('lp.premiumPlan',premiumPlan),[premiumPlan]);
  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(''),2600); return()=>clearTimeout(t);},[toast]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const paymentId=params.get('payment_id');
    const subscriptionId=params.get('subscription_id');
    const returnedInstallId=params.get('install_id');
    const checkoutSuccess=params.get('payment')==='success';
    const currentInstallId=returnedInstallId || installId;
    if((paymentId||subscriptionId) && checkoutSuccess){
      fetch(`/api/dodo/verify?${new URLSearchParams({install_id:currentInstallId,...(paymentId?{payment_id:paymentId}:{}),...(subscriptionId?{subscription_id:subscriptionId}:{})})}`)
        .then(r=>r.json()).then(data=>{
          if(data.active){setPremium(true);setPremiumPlan(data.planName||'Life Pulse Premium');if(data.subscriptionId) localStorage.setItem('lp.subscriptionId',data.subscriptionId);setTab('today');setToast('✦ Premium unlocked. Your deeper tools are live.');}
          else setToast('Payment received. Your premium access is being confirmed. Refresh in a moment.');
        }).catch(()=>setToast('Payment received. We are confirming your access.'));
      window.history.replaceState({},'',window.location.pathname);
    }
  },[installId]);

  useEffect(()=>{
    const subscriptionId=localStorage.getItem('lp.subscriptionId');
    if(!subscriptionId || !premium) return;
    fetch(`/api/dodo/verify?${new URLSearchParams({install_id:installId,subscription_id:subscriptionId})}`)
      .then(r=>r.json()).then(data=>{
        if(!data.active){setPremium(false);setPremiumPlan(null);localStorage.removeItem('lp.subscriptionId');setToast('Your premium access is no longer active.');}
      }).catch(()=>{});
  },[installId]);

  // --- Planner actions ---
  function addTask(e){
    e?.preventDefault();
    const text=draft.trim(); if(!text){setToast('Write the task first.');return;}
    setTasks(prev=>[...prev,{id:uid(),text,area,priority,done:false}]);
    setDraft(''); setToast('Mission added.');
  }
  function toggleTask(id){
    const current=tasks.find(t=>t.id===id);
    setTasks(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
    if(current && !current.done){setCelebrate(true);setTimeout(()=>setCelebrate(false),900);setToast('✦ Score moved. Momentum recorded.');}
    else setToast('Score updated.');
  }
  function deleteTask(id){setTasks(prev=>prev.filter(t=>t.id!==id));}
  function chooseMood(key){setMood(key);setToast(`${MOODS[key].emoji} ${MOODS[key].label} mode saved.`);}
  function sealDay(){
    if(tasks.length<3){setToast(`You need 3 tasks to seal today — you have ${tasks.length}.`);return;}
    const log={id:uid(),date:today(),score:stats.score,balance:stats.balance,completed:stats.completed,total:tasks.length,streak:stats.score>=70?(history[0]?.streak||0)+1:0,label:identity(stats.score),mood};
    setHistory(prev=>[log,...prev].slice(0,365));
    setTasks([]);setTomorrowReady(true);setToast('Day sealed. Fresh page unlocked.');setTab('today');
  }
  // --- Monetization ---
  async function startCheckout(product){
    try{
      setBusy(product);
      const res=await fetch('/api/dodo/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId:PRODUCTS[product].id,source:'life-pulse-upgrade',installId})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||'Checkout unavailable');
      window.location.href=data.checkout_url;
    }catch(err){setToast(err.message||'Checkout is not ready yet.');}
    finally{setBusy(false)}
  }
  // --- Acquisition hook: free Pulse Check ---
  function runPulse(){
    const vals=Object.values(pulseScores); const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10);
    setShowPulse(false);setToast(`Your free Life Score is ${avg}. Build today from that baseline.`);
    setTasks(prev=>prev.length?prev:[{id:uid(),text:'Build your first meaningful win',area:'work',priority:'high',done:false},{id:uid(),text:'Move for 10 minutes',area:'health',priority:'medium',done:false},{id:uid(),text:'Do one thing that improves tomorrow',area:'learning',priority:'medium',done:false}]);
  }
  function copyShare(){
    const text=`Life Pulse — ${identity(stats.score)}. Score ${stats.score}/100, balance ${stats.balance}/100, ${stats.completed}/${tasks.length} missions complete.`;
    navigator.clipboard?.writeText(text);setToast('Share card text copied.');
  }
  // --- Render helpers ---
  const moodActions=<div className="mood-actions">{moodInfo.actions.map((a,i)=><div key={a}><span>{i+1}</span>{a}</div>)}</div>;

  return <div className={`app-shell ${celebrate?'celebrate':''}`}>
    <div className="orb orb-a"/><div className="orb orb-b"/><div className="orb orb-c"/>
    <main className="container">
      <header className="topbar glass">
        <div className="brand"><div className="brand-mark">✦</div><div><small>LIFE PULSE</small><h1>Planning that feels alive.</h1></div></div>
        <div className="top-actions"><span className="pill">{dayLabel}</span><span className="pill">No sign-up</span><button className="ghost" onClick={()=>setShowPulse(true)}>⚡ Free Pulse Check</button></div>
      </header>
      {toast && <div className="toast">{toast}</div>}

      <section className="hero glass">
        <div className="hero-copy"><div className="eyebrow">TODAY · DAY {history.length+1}</div><h2>Plan your day.<br/><em>Tap what you finish.</em></h2><p>Watch your Life Score rise as real actions become visible progress. No signup. Your planner stays on your device.</p><div className="hero-tags"><span>⚡ Mood-aware</span><span>🔥 Streak-ready</span><span>📈 Live scoring</span></div></div>
        <div className="hero-rings"><Ring value={stats.score} label="Life score" caption={identity(stats.score)}/><Ring value={stats.balance} label="Balance" caption={`${activeAreas}/7 lanes`} /></div>
      </section>

      <nav className="tabs glass"><button className={tab==='today'?'active':''} onClick={()=>setTab('today')}>✦ Today</button><button className={tab==='archive'?'active':''} onClick={()=>setTab('archive')}>◌ Life Replay</button><button className={tab==='upgrade'?'active':''} onClick={()=>setTab('upgrade')}>♜ Premium</button></nav>

      {tab==='today' && <>
        <section className="grid-3">
          <div className="card glass mood-card"><div className="section-label">MOOD CHECK-IN</div><h3>How is your day feeling?</h3><p className="muted">Your choice changes today's strategy.</p><div className="mood-grid">{Object.entries(MOODS).map(([k,m])=><button key={k} className={mood===k?'mood selected':'mood'} onClick={()=>chooseMood(k)}><span>{m.emoji}</span><strong>{m.label}</strong></button>)}</div></div>
          <div className="card glass strategy-card"><div className="section-label">TODAY'S STRATEGY</div><h3>{moodInfo.emoji} {strategy.headline}</h3><p>{strategy.sub}</p>{moodActions}<button className="strategy-toggle" onClick={()=>setStrategyExpanded(v=>!v)}>{strategyExpanded?'Hide my plan':'See my plan'} ↗</button>{strategyExpanded&&<div className="strategy-deep"><div className="strategy-kpi"><span>Stress load</span><b className={`tone-${stress.tone}`}>{stress.label}</b></div><p>{stress.tip}</p>{strategy.moves.map(move=><div className="deep-move" key={move}>✓ {move}</div>)}<small>{strategy.footer}</small></div>}</div>
          <div className="card glass challenge-card"><div className="section-label">GLOBAL DAILY CHALLENGE</div><h3>{challengeText}</h3><p className="muted">One extra challenge. One extra reason to return tomorrow.</p><button className="button-secondary" onClick={()=>{setChallenge(x=>x+1);setToast('New challenge unlocked')}}>↻ New challenge</button></div>
        </section>

        <section className="planner glass">
          <div className="planner-head"><div><div className="section-label">BUILD TODAY</div><h3>Your missions</h3><p className="muted">Add at least 3 tasks before you seal the day.</p></div><div className="mini-stats"><span>{stats.completed} done</span><span>{stats.score} score</span><span>{stats.balance} balance</span></div></div>
          {overload&&<div className="overload-note">🫶 Your day is getting heavy. Protect your energy: pick the <b>5 tasks that matter most</b>.</div>}
          <form className="add-row" onSubmit={addTask}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What needs to happen today?"/><select value={area} onChange={e=>setArea(e.target.value)}>{AREAS.map(([id,emoji,name])=><option key={id} value={id}>{emoji} {name}</option>)}</select><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Soft</option><option value="medium">Glow</option><option value="high">Deep</option></select><button className="button-primary" type="submit">+ Add</button></form>
          <div className="chip-row">{['Write the hardest task','Move for 10 minutes','Read one page','Check money','Message one important person'].map(x=><button key={x} className="chip" onClick={()=>setDraft(x)}>{x}</button>)}</div>
          <div className="task-list">{tasks.length===0?<div className="empty"><div className="empty-icon">✦</div><h4>Nothing is written yet.</h4><p>Start with three meaningful moves. The score comes alive when you complete them.</p><button className="button-secondary" onClick={()=>setDraft('Finish the most important task')}>Add first mission</button></div>:tasks.map(t=>{const a=AREAS.find(x=>x[0]===t.area);return <div className={t.done?'task done':'task'} key={t.id}><button className={t.done?'check checked':'check'} onClick={()=>toggleTask(t.id)} aria-label={t.done?'Mark task incomplete':'Mark task complete'}>{t.done?'✓':''}</button><div className="task-main"><strong>{t.text}</strong><span>{a?.[1]} {a?.[2]} · {t.priority==='high'?'Deep':t.priority==='medium'?'Glow':'Soft'}</span></div><button className="delete" onClick={()=>deleteTask(t.id)} aria-label="Delete task">×</button></div>})}</div>
          <div className="planner-footer"><div>{tasks.length<3?<span className="warning">⚠ Add {3-tasks.length} more task{3-tasks.length===1?'':'s'} to seal today.</span>:<span className="positive">✓ Minimum mission complete</span>}</div><button className={tasks.length>=3?'seal':'seal disabled'} onClick={sealDay}>♜ {tasks.length>=3?'Seal day':'Add 3 tasks to seal'}</button></div>
        </section>

        {premium&&<section className="premium-dashboard glass"><div className="planner-head"><div><div className="section-label">PREMIUM LIVE</div><h3>Your deeper layer is active.</h3><p className="muted">{premiumPlan||'Life Pulse Premium'} · personalized from your real activity</p></div><span className="premium-live">● LIVE</span></div><div className="premium-grid"><div><span>Month average</span><strong>{monthAverage}</strong></div><div><span>Perfect days</span><strong>{perfectDays}</strong></div><div><span>Current mood</span><strong>{moodInfo.emoji} {moodInfo.label}</strong></div><div><span>Focus tip</span><strong>{strategy.moves[0]}</strong></div></div><div className="premium-insight">✦ Your premium insight: {stats.completed>0?`You are building momentum in ${strongest?.[2]||'your strongest lane'}. Protect it, then give ${weakest?.[2]||'a quieter lane'} one meaningful win.`:'Finish your first mission and Premium will turn the signal into a clearer daily strategy.'}</div></section>}

        <section className="life-wheel glass"><div className="planner-head"><div><div className="section-label">LIFE WHEEL</div><h3>Every lane counts.</h3></div><span className="pill">{activeAreas}/7 active</span></div><div className="area-grid">{AREAS.map(([id,emoji,name,hint])=>{const ts=tasks.filter(t=>t.area===id);const done=ts.filter(t=>t.done).length;const pct=ts.length?Math.round(done/ts.length*100):0;return <div key={id} className="area-card"><div className="area-top"><span className="area-icon">{emoji}</span><div><strong>{name}</strong><small>{hint}</small></div><span>{pct}%</span></div><div className="bar"><i style={{width:`${pct}%`}}/></div></div>})}</div><div className="callout">Strongest lane: <b>{strongest?.[2]}</b> · Needs attention: <b>{weakest?.[2]}</b></div></section>

        <section className="grid-2"><div className="card glass"><div className="section-label">SMART GUARDRAIL</div><h3>{overload?'Protect the day.':'Protect your energy.'}</h3><p>{overload?'You have planned a lot. Life Pulse will keep highlighting your highest-value work so you do not confuse a packed day with a productive day.':'Plan enough to grow, not enough to overwhelm yourself. The app keeps your score anchored to meaningful completions.'}</p><div className="callout">{stress.tip}</div></div><div className="card glass"><div className="section-label">SHARE YOUR WIN</div><h3>Make today's progress visible.</h3><p>Copy a clean progress line for friends, social posts or your own log.</p><button className="button-secondary" onClick={copyShare}>↗ Copy win card</button></div></section>

        {tomorrowReady&&<section className="tomorrow glass"><div><div className="section-label">TOMORROW PREVIEW</div><h3>Leave tomorrow a head start.</h3><p className="muted">Your last day is saved. Start the next one with a smaller, clearer mission.</p></div><button className="button-primary" onClick={()=>{setTomorrowReady(false);setDraft(strategy.moves[0]);setToast('Tomorrow starts with a clear first move.')}}>Set first move →</button></section>}
      </>}

      {tab==='archive' && <section className="archive-stack"><div className="glass archive-hero"><div><div className="section-label">LIFE REPLAY</div><h2>Your story is adding up.</h2><p>See the days you showed up, the patterns you are building and where your next level is.</p></div><div className="replay-number"><strong>{history.length}</strong><span>saved days</span></div></div><div className="grid-3"><div className="card glass"><div className="section-label">STREAK</div><h3>{streak} days</h3><p className="muted">Keep the chain alive.</p></div><div className="card glass"><div className="section-label">BEST IDENTITY</div><h3>{history[0]?.label||'Start Here'}</h3><p className="muted">Your latest logged rhythm.</p></div><div className="card glass"><div className="section-label">AVERAGE</div><h3>{monthAverage}</h3><p className="muted">Your recent saved-day score.</p></div></div><div className="card glass history"><div className="section-label">RECENT DAYS</div>{history.length===0?<div className="empty small"><h4>Your replay is waiting.</h4><p>Seal your first day and this becomes your visual memory of progress.</p></div>:history.slice(0,12).map(x=><div className="history-row" key={x.id}><div><strong>{x.label}</strong><span>{x.date} · {x.completed}/{x.total} tasks · {MOODS[x.mood]?.emoji||'✦'} {MOODS[x.mood]?.label||'Day'}</span></div><div className="history-score">{x.score}</div></div>)}</div></section>}

      {tab==='upgrade' && <section className="upgrade-stack"><div className="glass upgrade-hero"><div><div className="section-label">PREMIUM</div><h2>Your free planner gets you moving.<br/><em>Premium helps you go deeper.</em></h2><p>Upgrade when you want the full Life Pulse operating system.</p></div><div className="premium-glow">✦</div></div><div className="premium-preview glass"><div><div className="section-label">FEEL IT BEFORE YOU BUY</div><h3>Imagine opening Life Pulse tomorrow and already knowing what matters.</h3><p>Premium turns your real behavior into deeper strategies, patterns, replays and personalized momentum signals.</p></div><div className="premium-preview-grid"><span>⚡ Mood-aware coaching</span><span>📈 Pattern insights</span><span>🏆 Deeper replay</span><span>🧭 Smart priorities</span></div></div><div className="pricing-grid"><article className="price-card glass"><span className="plan-badge">BEST VALUE</span><h3>Life Pulse Premium</h3><div className="price">$7.99<span>/month</span></div><p>For people who want Life Pulse to become their daily guide.</p><ul><li>AI-style mood coaching</li><li>Unlimited history</li><li>Life Replay</li><li>Advanced analytics</li><li>Premium themes</li><li>Custom goals</li><li>Deep daily strategy</li><li>Recovery Mode</li></ul><button className="button-primary wide" disabled={busy==='premium'} onClick={()=>startCheckout('premium')}>{busy==='premium'?'Opening…':'Unlock Premium →'}</button></article><article className="price-card glass featured"><span className="plan-badge gold">FOREVER</span><h3>Life Pulse Lifetime</h3><div className="price">$69<span> once</span></div><p>For people who know they want Life Pulse in their long-term system.</p><ul><li>Everything in Premium</li><li>Lifetime access</li><li>Future feature updates</li><li>Premium template library</li><li>Exclusive themes</li><li>Replay archive</li><li>Long-term progress layer</li></ul><button className="button-primary wide" disabled={busy==='lifetime'} onClick={()=>startCheckout('lifetime')}>{busy==='lifetime'?'Opening…':'Own Life Pulse →'}</button></article><article className="price-card glass"><span className="plan-badge cyan">POWER</span><h3>Life Pulse Elite</h3><div className="price">$14.99<span>/month</span></div><p>For power users who want deeper systems and priority experiences.</p><ul><li>Everything in Premium</li><li>Advanced strategy insights</li><li>Accountability systems</li><li>Team/family features when launched</li><li>Beta access</li><li>Priority future features</li><li>Power-user analytics</li></ul><button className="button-secondary wide" disabled={busy==='elite'} onClick={()=>startCheckout('elite')}>{busy==='elite'?'Opening…':'Enter Elite →'}</button></article></div><div className="glass trust-strip"><span>✓ No intrusive ads</span><span>✓ Cancel anytime</span><span>✓ Secure Dodo checkout</span><span>✓ No signup to start</span></div><div className="premium-fineprint">Premium is optional. The free planner is genuinely useful; upgrade when you want the deeper layer.</div></section>}

      <footer className="footer"><span>Life Pulse · Build your next day.</span><button className="link" onClick={()=>setShowPulse(true)}>Take the free Life Score test</button></footer>
    </main>

    {showPulse && <div className="modal-backdrop" onClick={()=>setShowPulse(false)}><div className="modal glass" onClick={e=>e.stopPropagation()}><div className="section-label">FREE PULSE CHECK</div><h2>How strong does each area feel right now?</h2><p className="muted">No signup. One minute. We'll give you a baseline and turn it into your first plan.</p>{AREAS.map(([id,emoji,name])=><label className="slider-row" key={id}><span>{emoji} {name}</span><input aria-label={`${name} rating`} type="range" min="1" max="10" value={pulseScores[id]} onChange={e=>setPulseScores(s=>({...s,[id]:Number(e.target.value)}))}/><b>{pulseScores[id]}</b></label>)}<div className="modal-actions"><button className="button-secondary" onClick={()=>setShowPulse(false)}>Close</button><button className="button-primary" onClick={runPulse}>Show my Life Score</button></div></div></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
