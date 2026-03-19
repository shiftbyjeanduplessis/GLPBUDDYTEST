(function(){
  const KEY='glpbuddy_v2_data';
  const todayISO=()=>new Date().toISOString().slice(0,10);
  const addDays=(iso,days)=>{const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
  const uid=()=>Math.random().toString(36).slice(2,10);
  const defaultData=()=>({
    profile:{name:'Sarah',age:39,startWeight:92.4,currentWeight:79.8,goalWeight:68,medication:'Mounjaro',dose:'7.5mg',injectionDay:'Monday',theme:'feminine',photoReminder:'biweekly'},
    settings:{units:'kg',photoReminder:'biweekly'},
    dailyLogs:{},
    meals:{currentPlan:null,savedAt:null,lastShoppingMode:'week',favorites:[]},
    photos:[],
    exercise:{level:'Builder',streakWeeks:4,completedSessions:12,favorites:['Chair Squat'],lastWorkoutDate:null},
    community:{friends:[{name:'Emma',email:'emma@example.com'},{name:'Nadine',email:'nadine@example.com'}],posts:[]},
    badges:['First Check-In','7 Day Consistency','Hydration Builder'],
    demoLoaded:false
  });
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||defaultData()}catch{return defaultData()}};
  const write=(d)=>localStorage.setItem(KEY,JSON.stringify(d));
  const ensure=(d)=>{
    d.profile ||= defaultData().profile; d.settings ||= defaultData().settings; d.dailyLogs ||= {}; d.meals ||= defaultData().meals; d.photos ||= []; d.exercise ||= defaultData().exercise; d.community ||= defaultData().community; d.badges ||= []; return d;
  };
  const get=()=>ensure(read());
  const set=(d)=>write(ensure(d));
  const update=(fn)=>{const d=get(); fn(d); set(d); return d};
  const logFor=(date=todayISO())=>{const d=get(); d.dailyLogs[date] ||= {date,weight:null,mood:null,energy:null,appetite:null,water:0,medicationTaken:false,walkDone:false,checkinDone:false,sideEffects:[],notes:''}; set(d); return d.dailyLogs[date];};
  const themeVars={
    medical:{bg:'#f4f8ff',card:'rgba(255,255,255,.86)',text:'#15365d',muted:'#56708f',line:'rgba(126,157,204,.28)',accent:'#2f76d2',accent2:'#71b7ff',glow:'rgba(47,118,210,.15)'},
    feminine:{bg:'#fff5f8',card:'rgba(255,255,255,.78)',text:'#41263b',muted:'#86687d',line:'rgba(212,163,190,.24)',accent:'#d56a9a',accent2:'#f3afc9',glow:'rgba(213,106,154,.16)'},
    midnight:{bg:'#181126',card:'rgba(42,31,61,.62)',text:'#f3eefe',muted:'#b5a8cc',line:'rgba(175,151,214,.18)',accent:'#8f6df5',accent2:'#cf9cff',glow:'rgba(143,109,245,.2)'},
    executive:{bg:'#111315',card:'rgba(35,39,43,.68)',text:'#f0f2f4',muted:'#a9b0b8',line:'rgba(176,184,192,.16)',accent:'#9ca7b3',accent2:'#d6dbe0',glow:'rgba(156,167,179,.15)'},
    nature:{bg:'#eef6ef',card:'rgba(255,255,255,.76)',text:'#274033',muted:'#64836d',line:'rgba(130,170,139,.22)',accent:'#4c8a61',accent2:'#9ed1a6',glow:'rgba(76,138,97,.15)'},
    glass:{bg:'linear-gradient(180deg,#f8f0ff,#f0f6ff)',card:'rgba(255,255,255,.34)',text:'#2d2340',muted:'#6f6782',line:'rgba(255,255,255,.38)',accent:'#7f67db',accent2:'#b9a8ff',glow:'rgba(127,103,219,.18)'}
  };
  const baseMeals=[
    ['Greek yoghurt bowl','180g yoghurt · berries · 20g granola'],['Eggs on toast','2 eggs · 1 slice toast · tomato'],['Tuna wrap','120g tuna · lettuce · wrap'],['Chicken wrap','140g chicken · salad · wrap'],['Beef bolognese','150g beef · pasta · tomato sauce'],['Chicken curry','150g chicken · rice · veg'],['Steak and sweet potato','150g steak · sweet potato · greens'],['Salmon tray bake','140g salmon · potatoes · broccoli'],['Cottage cheese toast','2 slices toast · cottage cheese · cucumber'],['Prawn paella','150g prawns · rice · peppers']
  ];
  const genMeal=(seed)=>{const item=baseMeals[seed%baseMeals.length]; return {id:uid(),name:item[0],details:item[1],locked:false}};
  const generatePlan=()=>{const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; return days.map((day,i)=>({day,breakfast:genMeal(i),lunch:genMeal(i+2),dinner:genMeal(i+5)}));};
  const ensurePlan=()=>update(d=>{if(!d.meals.currentPlan){d.meals.currentPlan=generatePlan();d.meals.savedAt=todayISO();}}).meals.currentPlan;
  const regenerateUnlocked=(single)=>update(d=>{
    d.meals.currentPlan ||= generatePlan();
    d.meals.currentPlan.forEach((day,di)=>['breakfast','lunch','dinner'].forEach((slot,si)=>{
      const m=day[slot];
      const target=!single || (single.day===di && single.slot===slot);
      if(target && !m.locked){day[slot]=genMeal(di*3+si+Math.floor(Math.random()*7)); day[slot].locked=false;}
    }));
    d.meals.savedAt=todayISO();
  }).meals.currentPlan;
  const shoppingList=(mode='week')=>{
    const d=get(); const plan=d.meals.currentPlan||generatePlan(); const mult=mode==='month'?4:1; const items={};
    plan.forEach(day=>['breakfast','lunch','dinner'].forEach(slot=>{const parts=day[slot].details.split('·').map(s=>s.trim()); parts.forEach(p=>items[p]=(items[p]||0)+mult);}));
    return Object.entries(items).map(([name,count])=>({name,count}));
  };
  const loadDemo=()=>update(d=>{
    if(d.demoLoaded) return;
    const start=new Date(); start.setMonth(start.getMonth()-6);
    let weight=92.4;
    const sideFx=[[],['nausea'],['fatigue'],[],['bloating'],[],['headache'],[]];
    for(let i=0;i<180;i++){
      const date=new Date(start); date.setDate(start.getDate()+i); const iso=date.toISOString().slice(0,10);
      if(i%3!==1){ weight += (i<45?-0.11:i<100?-0.07:i<145?-0.03:-0.02) + ((i%11===0)?0.25:0);
        d.dailyLogs[iso]={date:iso,weight:+weight.toFixed(1),mood:Math.max(2,Math.min(5,3+((i%9===0)?1:0))),energy:Math.max(1,Math.min(5,2+(i>50)+(i>110)+((i%13===0)?-1:0))),appetite:Math.max(1,Math.min(5,4-(i>25)-(i>90)+((i%15===0)?1:0))),water:Math.min(8,4+(i%5)),medicationTaken:i%7===0,walkDone:i%2===0,checkinDone:true,sideEffects:sideFx[i%sideFx.length],notes:''};
      }
    }
    d.profile.currentWeight=+weight.toFixed(1);
    d.meals.currentPlan=generatePlan(); d.meals.savedAt=todayISO();
    d.photos=['2025-10-01','2025-10-15','2025-11-01','2025-12-01','2026-01-01','2026-02-01'].map((date,idx)=>({id:uid(),date,front:`https://picsum.photos/seed/front${idx}/480/640`,side:`https://picsum.photos/seed/side${idx}/480/640`,back:`https://picsum.photos/seed/back${idx}/480/640`,note:`Check-in ${idx+1}`}));
    d.community.posts=[
      {id:uid(),date:todayISO(),type:'event',text:'Emma completed her weigh-in today.'},
      {id:uid(),date:addDays(todayISO(),-1),type:'post',text:'Big win: jeans fit better this week.'},
      {id:uid(),date:addDays(todayISO(),-2),type:'event',text:'Nadine finished her workout.'},
      {id:uid(),date:addDays(todayISO(),-4),type:'event',text:'Sarah earned the 7 Day Consistency badge.'}
    ];
    d.demoLoaded=true;
  });
  window.GLPStore={KEY,get,set,update,logFor,todayISO,addDays,themeVars,ensurePlan,regenerateUnlocked,shoppingList,loadDemo};
})();
