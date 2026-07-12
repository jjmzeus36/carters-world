/* ================= Carter's World — QUESTS & MISSIONS layer (v1) =================
   Self-installing, additive-only chunk. MUST be concatenated AFTER game_logic.js.
   House rules honored (see CLAUDE.md):
   - NO coins from quests, EVER. Rewards are stars ⭐, stickers, badges, titles,
     confetti and world flourishes only. Quests never grant or require... they may
     use the normal shop loop once (one early quest) but never award currency.
   - No "Dad" text kid-visible. No PII. Copy is short + emoji-heavy for age 8.
   - Zero edits to game_core.js / game_logic.js: installs by wrapping the global
     bindings objUpdate / scanInteract / doInteract / anyModal / closeModals at load.
   - Save data lives additively in save.quests (no SAVE_KEY bump — keeps his coins).
   - Escape hatch: localStorage.setItem('cw_quests_off','1') + reload disables layer.
*/
(function(){
if(window.__QUESTS_V1__)return;window.__QUESTS_V1__=1;
try{if(localStorage.getItem('cw_quests_off'))return;}catch(e){}

/* ---------------- save namespace ---------------- */
if(!save.quests)save.quests={};
const Q=save.quests;
function def(k,v){if(Q[k]===undefined)Q[k]=v;}
def('v',1);def('stars',0);def('done',{});def('act',{});def('p',{});def('track',null);
def('stick',{});def('badge',{});def('gnome',{});def('photo',{});def('litter',{});
def('daily',{date:'',ids:[],done:{},bonus:false});
def('days',{});def('pondDays',{});def('best',{});def('seen',{});def('flags',{});
def('st',{walk:0,drive:0,jump:0,boing:0,greet:0,pet:0,mail:0,knock:0,fuel:0,
          photo:0,orders:0,shiny:0,dailies:0,races:0,coins:0,driveV:{},greetN:{}});
const ST=Q.st;
let dirty=false;
function mark(){dirty=true;}
function flushSave(){if(dirty){dirty=false;try{persist();}catch(e){}}}

/* ---------------- map anchors (from real world geometry) ---------------- */
const TRAMP_P=(typeof TRAMP!=='undefined')?TRAMP:{x:24,z:-26};
const POIS={
  park:  {x:-120,z:29,  r:14, name:'the park',      icon:'🛝'},
  pond:  {x:-109,z:18,  r:8,  name:'the duck pond', icon:'🦆'},
  qt:    {x:112, z:-30, r:17, name:'QuikTrip',      icon:'🏪'},
  home:  {x:-58, z:-10.5,r:8, name:'your house',    icon:'🏠'},
  stop:  {x:86.8,z:6.3, r:5,  name:'the stop sign', icon:'🛑'},
  tramp: {x:TRAMP_P.x,z:TRAMP_P.z,r:5,name:'the trampoline',icon:'🤸'},
  picnic:{x:-104,z:34,  r:5,  name:'the picnic table',icon:'🧺'},
  heroS: {x:80,  z:56,  r:9,  name:'south Hero Way',icon:'🛣️'},
  hyd:   {x:-14, z:-6.6,r:4,  name:'the fire hydrant',icon:'🚒'},
  oak:   {x:-72, z:-60, r:11, name:'Oak Lane',       icon:'🌳'},
  maple: {x:36,  z:60,  r:11, name:'Maple Drive',    icon:'🍁'},
  lemon: {x:-72, z:-56.5,r:5, name:'the lemonade stand',icon:'🍋'},
  kite:  {x:-6,  z:-56, r:6,  name:"Sam's kite field",icon:'🪁'},
  soccer:{x:116, z:38,  r:12, name:'Carter Stadium', icon:'⚽'},
  balloon:{x:33, z:53,  r:6,  name:'the balloon house',icon:'🎈'},
};
const GNOME_SPOTS=[
  [132,-44,'behind the store'],[-136,30,'under a park tree'],[-104,14,'in the pond reeds'],
  [28,-28,'by the trampoline'],[-46,24,'in a south backyard'],[-14,-8.6,'next to the hydrant'],
  [-62,-7,'in the bushes at home'],[86,40,'along Hero Way'],[91,10,'near the stop sign'],
  [-95,-28,'behind the west houses'],
  [-134,-58,'at the west end of Oak Lane'],[134,58,'at the east end of Maple Drive'],
  [-74,-54,'behind the lemonade stand'],[12,86,'in a Maple Drive backyard'],
  [100.5,38,'near the soccer goal'],
];
const SHINY_SPOTS=[[-51,-13],[104,5.4],[-129,21],[80,28],[128,-14],[-64,30],[16,-27],
  [-108,38],[97,-17],[-26,-5.4],[48,-38],[120,24],
  [-100,-58.6],[60,-58.6],[-100,58.6],[60,58.6],[0,44],[8,-70]];
const PHOTO_SPOTS=[
  {id:'porch', x:-62,  z:-13,  name:'Front Porch',   em:'🏠'},
  {id:'pond',  x:-106, z:15,   name:'Duck Pond',     em:'🦆'},
  {id:'stop',  x:88.5, z:8,    name:'Stop Sign',     em:'🛑'},
  {id:'tramp', x:TRAMP_P.x+2.5,z:TRAMP_P.z+1,name:'Trampoline',em:'🤸'},
  {id:'picnic',x:-102, z:32,   name:'Picnic Spot',   em:'🧺'},
  {id:'pumps', x:108,  z:-24,  name:'Gas Pumps',     em:'⛽'},
  {id:'hoop',  x:-51,  z:-13.5,name:'Basketball Hoop',em:'🏀'},
  {id:'hero',  x:80,   z:52,   name:'Hero Way',      em:'🛣️'},
  {id:'oaksign',x:74.4,z:-57.6, name:'Oak Lane Sign', em:'🌳'},
  {id:'lemon', x:-70,  z:-54.5, name:'Lemonade Stand',em:'🍋'},
  {id:'balloon',x:33.5,z:54,    name:'Balloon House', em:'🎈'},
  {id:'soccer',x:107,  z:32,    name:'Carter Stadium',em:'⚽'},
];
const LITTER_SPOTS=[[100,-20],[85,12],[-60,5],[-115,25],[20,-5],[-60,-58.6],[24,58.6],[110,-58.6],[-110,58.6]];
const BOARD={x:94,z:-10};

/* ---------------- quest catalog ---------------- */
/* step kinds: ev{ev,n} · goto{x,z,r} · linger{x,z,r,secs} · stat{k,n} · race{race} */
const RACES={
  race_max:{veh:'bike',from:{x:-120,z:29,r:7},to:{x:86.8,z:6.3,r:8},limit:60,name:'Park → Stop Sign'},
  race_qt: {veh:'car', from:{x:-56,z:-6,r:8}, to:{x:112,z:-28,r:12},limit:35,name:'Home → QuikTrip'},
  race_hero:{veh:'car',from:{x:86.8,z:6.3,r:8},to:{x:80,z:58,r:9},limit:22,name:'Stop Sign → Hero Way'},
  race_oak: {veh:'bike',from:{x:86.8,z:6.3,r:8},to:{x:-130,z:-64,r:11},limit:60,name:'Stop Sign → Oak Lane West'},
  race_maple:{veh:'car',from:{x:112,z:-28,r:12},to:{x:130,z:64,r:11},limit:42,name:'QuikTrip → Maple East'},
  race_tour:{veh:'car',from:{x:-56,z:-6,r:8},to:{x:-130,z:64,r:11},limit:85,name:'Home → Maple West'},
};
const QUESTS=[
 /* — Neighborhood Hero arc — */
 {id:'hello_town',icon:'👋',name:'Meet the Neighbors',giver:'auto',stars:2,stick:'🏡',
  brief:'Say hi to everybody in town!',
  steps:[
   {t:'ev',ev:'greet:Mr. Bob',n:1,txt:'Say hi to Mr. Bob',tgt:()=>npcPos('Mr. Bob')},
   {t:'ev',ev:'greet:Max',n:1,txt:'Say hi to Max',tgt:()=>npcPos('Max')},
   {t:'ev',ev:'greet:Lily',n:1,txt:'Say hi to Lily',tgt:()=>npcPos('Lily')},
   {t:'ev',ev:'greet:Miss Sue',n:1,txt:'Say hi to Miss Sue',tgt:()=>npcPos('Miss Sue')}]},
 {id:'helping_hands',icon:'🤝',name:'Helping Hands',giver:'auto',req:'hello_town',stars:2,stick:'🐾',
  brief:'Little jobs around the house!',
  steps:[
   {t:'ev',ev:'pet',n:2,txt:'Pet Tiny 2 times',tgt:dogPos},
   {t:'ev',ev:'mail',n:1,txt:'Check the mailbox',tgt:()=>({x:-54.6,z:-5.2})},
   {t:'ev',ev:'knock',n:1,txt:'Knock on your door',tgt:()=>({x:-58,z:-10.5})}]},
 {id:'errand_run',icon:'🛒',name:'The Big Errand',giver:'auto',req:'helping_hands',stars:3,stick:'🧾',
  brief:'A real shopping trip, boss-style!',
  steps:[
   {t:'goto',x:112,z:-30,r:17,txt:'Drive to QuikTrip'},
   {t:'ev',ev:'order',n:1,txt:'Buy a snack at the counter',tgt:()=>({x:124.6,z:-38})},
   {t:'ev',ev:'fuel',n:1,txt:'Fill up or charge your ride',tgt:()=>({x:108,z:-26})}]},
 {id:'block_patrol',icon:'🚴',name:'Block Patrol',giver:'auto',req:'errand_run',stars:2,stick:'🚴',
  brief:'Patrol the whole neighborhood!',
  steps:[
   {t:'goto',x:-120,z:29,r:14,txt:'Visit the park'},
   {t:'goto',x:86.8,z:6.3,r:6,txt:'Touch the stop sign'},
   {t:'goto',x:112,z:-30,r:17,txt:'Swing by QuikTrip'},
   {t:'goto',x:-58,z:-10.5,r:8,txt:'Report back home'}]},
 {id:'town_hero',icon:'🦸',name:'Hero of Carter Town',giver:'auto',req:'block_patrol',stars:4,stick:'🦸',badge:'town_hero',
  brief:'Everybody knows your name!',
  steps:[
   {t:'stat',k:'greet',n:12,txt:'Say hi 12 times (total)'},
   {t:'stat',k:'pet',n:5,txt:'Pet Tiny 5 times (total)',tgt:dogPos}]},
 /* — Gnome arc — */
 {id:'gnomes1',icon:'🍄',name:'Gnome Hunt!',giver:'board',req:'hello_town',stars:2,stick:'🍄',
  brief:'Tiny gnomes are hiding in town. Find 3!',
  steps:[{t:'count',get:()=>Object.keys(Q.gnome||{}).length,n:3,txt:'Find 3 hidden gnomes'}]},
 {id:'gnomes2',icon:'🎩',name:'More Gnomes!',giver:'board',req:'gnomes1',stars:2,stick:'🎩',
  brief:'They hide behind stores and trees...',
  steps:[{t:'count',get:()=>Object.keys(Q.gnome||{}).length,n:6,txt:'Find 6 gnomes in all'}]},
 {id:'gnomes3',icon:'👑',name:'The Gnome King',giver:'board',req:'gnomes2',stars:4,stick:'👑',badge:'gnome_king',
  brief:'Find them ALL and become Gnome King!',
  steps:[{t:'count',get:()=>Object.keys(Q.gnome||{}).length,n:10,txt:'Find 10 gnomes in all'}],
  onDone:()=>{Q.flags.gnomeBuddy=1;spawnGnomeBuddy();toast('🍄 A gnome friend moved in by your porch!');}},
 /* — Duck arc — */
 {id:'ducks1',icon:'🦆',name:'Duck Detective',giver:'auto',req:'hello_town',stars:2,stick:'🦆',
  brief:'Something is quacking at the park...',
  steps:[
   {t:'goto',x:-109,z:18,r:9,txt:'Find the duck pond'},
   {t:'linger',x:-109,z:18,r:9,secs:15,txt:'Watch the ducks for 15s'}]},
 {id:'ducks2',icon:'📷',name:'Duck Watcher',giver:'auto',req:'ducks1',stars:2,stick:'📷',
  brief:'The ducks like you now!',
  steps:[
   {t:'linger',x:-109,z:18,r:9,secs:30,txt:'Hang out with the ducks 30s'},
   {t:'ev',ev:'photo:pond',n:1,txt:'Take a pond picture',tgt:()=>({x:-106,z:15})}]},
 {id:'ducks3',icon:'🎪',name:'The Duck Parade',giver:'auto',req:'ducks2',stars:3,stick:'🎪',
  brief:'Visit your duck pals on 3 different days!',
  steps:[{t:'days',k:'pondDays',n:3,txt:'Visit the pond on 3 days'}]},
 /* — Racing arc — */
 {id:'race_max',icon:'🏁',name:'Race Ya!',giver:'Max',req:'hello_town',stars:2,stick:'🏁',
  brief:'Max: "Bet you cannot beat my bike record!"',
  steps:[{t:'race',race:'race_max',txt:'Bike: park → stop sign under 60s'}]},
 {id:'race_qt',icon:'⚡',name:'QuikTrip Dash',giver:'Max',req:'race_max',stars:2,stick:'⚡',
  brief:'Max: "Now with an engine! Ready?"',
  steps:[{t:'race',race:'race_qt',txt:'Car: home → QuikTrip under 35s'}]},
 {id:'race_hero',icon:'🏆',name:'Hero Way Flyer',giver:'Max',req:'race_qt',stars:3,stick:'🏆',badge:'speed_legend',
  brief:'Max: "The big one. Hero Way. Full send!"',
  steps:[{t:'race',race:'race_hero',txt:'Car: stop sign → Hero Way under 22s'}]},
 /* — Photo arc — */
 {id:'photo1',icon:'📸',name:'Say Cheese!',giver:'board',req:'hello_town',stars:2,stick:'📸',
  brief:'Sparkly photo spots are all over town!',
  steps:[{t:'ev',ev:'photo',n:3,txt:'Take 3 pictures at photo spots'}]},
 {id:'photo2',icon:'🌇',name:'Shutterbug',giver:'board',req:'photo1',stars:3,stick:'🌇',badge:'shutterbug',
  brief:'Snap every photo spot in town!',
  steps:[{t:'stat',k:'photoSpots',n:8,txt:'Photograph all 8 spots'}]},
 /* — Tiny arc — */
 {id:'tiny1',icon:'🐶',name:'Tiny Time',giver:'auto',req:'helping_hands',stars:2,stick:'🦴',
  brief:'Tiny wants to play!',
  steps:[
   {t:'ev',ev:'pet',n:3,txt:'Pet Tiny 3 times',tgt:dogPos},
   {t:'ev',ev:'jump',n:10,txt:'Do 10 happy jumps'}]},
 {id:'tiny2',icon:'💨',name:'Zoomies!',giver:'auto',req:'tiny1',stars:2,stick:'💨',
  brief:'Run it out like Tiny does!',
  steps:[
   {t:'ev',ev:'boing',n:5,txt:'Bounce 5 times on the trampoline',tgt:()=>({x:TRAMP_P.x,z:TRAMP_P.z})},
   {t:'ev',ev:'walkm',n:400,txt:'Walk or run 400m'}]},
 {id:'tiny3',icon:'❤️',name:'Best Friends',giver:'auto',req:'tiny2',stars:3,stick:'❤️',badge:'best_friend',
  brief:'Tiny loves you the most.',
  steps:[{t:'stat',k:'pet',n:15,txt:'Pet Tiny 15 times (total)',tgt:dogPos}]},
 /* — NPC side quests — */
 {id:'bob_rake',icon:'🧰',name:'The Lost Rake',giver:'Mr. Bob',req:'hello_town',stars:2,stick:'🧰',
  brief:'Mr. Bob: "My rake vanished! Backyards, maybe?"',
  steps:[
   {t:'ev',ev:'item:rake',n:1,txt:'Find the rake (north backyards)',tgt:()=>({x:-30,z:-28})},
   {t:'ev',ev:'greet:Mr. Bob',n:1,txt:'Bring it back to Mr. Bob',tgt:()=>npcPos('Mr. Bob')}]},
 {id:'sue_glasses',icon:'🕶️',name:'Lost Glasses',giver:'Miss Sue',req:'hello_town',stars:2,stick:'🕶️',
  brief:'Miss Sue: "I left my glasses at the picnic!"',
  steps:[
   {t:'ev',ev:'item:glasses',n:1,txt:'Find the glasses (picnic table)',tgt:()=>({x:-104,z:34})},
   {t:'ev',ev:'greet:Miss Sue',n:1,txt:'Return them to Miss Sue',tgt:()=>npcPos('Miss Sue')}]},
 {id:'lily_bounce',icon:'🤸',name:'Bounce Champion',giver:'Lily',req:'hello_town',stars:2,stick:'🤸',
  brief:'Lily: "Show me your BIGGEST bounces!"',
  steps:[{t:'ev',ev:'boing',n:8,txt:'8 trampoline bounces',tgt:()=>({x:TRAMP_P.x,z:TRAMP_P.z})}]},
 {id:'max_spots',icon:'🗺️',name:'Secret Spots',giver:'Max',req:'hello_town',stars:2,stick:'🗺️',
  brief:'Max: "I know 3 secret spots. Find them!"',
  steps:[
   {t:'goto',x:135,z:-40,r:6,txt:'Secret spot: behind the store'},
   {t:'goto',x:-134,z:-14,r:6,txt:'Secret spot: far west corner'},
   {t:'goto',x:-40,z:52,r:6,txt:'Secret spot: way down south'}]},
 {id:'clean_town',icon:'🧹',name:'Clean Team',giver:'board',req:'hello_town',stars:2,stick:'🧹',
  brief:'Litter alert! Help tidy up Carter Town.',
  steps:[{t:'ev',ev:'litter',n:5,txt:'Pick up 5 pieces of litter'}]},
 {id:'sign_spotter',icon:'🛑',name:'Sign Spotter',giver:'board',req:'hello_town',stars:1,stick:'🛑',
  brief:'How well do you know the town signs?',
  steps:[
   {t:'goto',x:86.8,z:6.3,r:6,txt:'Find the stop sign'},
   {t:'goto',x:100,z:-26,r:8,txt:'Find the gas price board'},
   {t:'goto',x:112.5,z:-41,r:6,txt:'Find the SNACKS sign'}]},
 {id:'hydrant_hunt',icon:'🚒',name:'Hydrant Hunt',giver:'board',req:'hello_town',stars:1,stick:'🚒',
  brief:'There is a little red hero on the sidewalk.',
  steps:[{t:'goto',x:-14,z:-6.6,r:4,txt:'Find the fire hydrant'}]},
 {id:'sky_gazer',icon:'☁️',name:'Sky Gazer',giver:'board',req:'hello_town',stars:1,stick:'☁️',
  brief:'Chill at the picnic table and watch clouds.',
  steps:[{t:'linger',x:-104,z:34,r:6,secs:12,txt:'Relax at the picnic table 12s'}]},
 /* — long-haul autos — */
 {id:'walk1',icon:'👟',name:'Walker',giver:'auto',req:'hello_town',stars:2,stick:'👟',
  brief:'Strong legs, big adventures!',steps:[{t:'stat',k:'walk',n:1000,txt:'Walk 1,000m (total)'}]},
 {id:'walk2',icon:'🏅',name:'Marathon Kid',giver:'auto',req:'walk1',stars:3,stick:'🏅',
  brief:'You could walk to the moon probably.',steps:[{t:'stat',k:'walk',n:3000,txt:'Walk 3,000m (total)'}]},
 {id:'drive1',icon:'🚗',name:'Road Tripper',giver:'auto',req:'errand_run',stars:2,stick:'🚗',
  brief:'Eyes on the road, boss!',steps:[{t:'stat',k:'drive',n:3000,txt:'Drive 3,000m (total)'}]},
 {id:'drive2',icon:'🛣️',name:'Highway Star',giver:'auto',req:'drive1',stars:3,stick:'🛣️',
  brief:'Professional wheels status.',steps:[{t:'stat',k:'drive',n:8000,txt:'Drive 8,000m (total)'}]},
 {id:'jump1',icon:'🐸',name:'Hop Star',giver:'auto',req:'hello_town',stars:2,stick:'🐸',
  brief:'Boing boing boing!',steps:[{t:'stat',k:'jump',n:50,txt:'Jump 50 times (total)'}]},
 {id:'jump2',icon:'🦘',name:'Super Hopper',giver:'auto',req:'jump1',stars:3,stick:'🦘',
  brief:'Are you part kangaroo?!',steps:[{t:'stat',k:'jump',n:200,txt:'Jump 200 times (total)'}]},
 {id:'coins1',icon:'🗝️',name:'Treasure Eyes',giver:'auto',req:'hello_town',stars:2,stick:'🗝️',
  brief:'Shiny coins hide all over town...',steps:[{t:'stat',k:'coins',n:10,txt:'Find 10 hidden coins'}]},
 {id:'coins2',icon:'💎',name:'Treasure Master',giver:'auto',req:'coins1',stars:4,stick:'💎',badge:'treasure',
  brief:'Every. Single. Coin.',steps:[{t:'stat',k:'coins',n:30,txt:'Find all 30 coins'}]},
 {id:'wheels_all',icon:'🔑',name:'Test Driver',giver:'auto',req:'errand_run',stars:2,stick:'🔑',
  brief:'Try every ride in the driveway!',
  steps:[
   {t:'ev',ev:'drive:tesla',n:1,txt:'Drive the Tesla'},
   {t:'ev',ev:'drive:cyber',n:1,txt:'Drive the Cybertruck'},
   {t:'ev',ev:'drive:tahoe',n:1,txt:'Drive the Tahoe'},
   {t:'ev',ev:'drive:bike',n:1,txt:'Ride your bike'}]},
 {id:'charge_up',icon:'🔋',name:'Power Up',giver:'auto',req:'errand_run',stars:1,stick:'🔋',
  brief:'Keep those batteries happy!',steps:[{t:'stat',k:'fuel',n:3,txt:'Charge or fill up 3 times'}]},
 /* ============ TOWN EXPANSION WAVE (Oak Lane + Maple Drive) ============ */
 {id:'oak1',icon:'🌳',name:'Welcome to Oak Lane',giver:'auto',req:'errand_run',stars:2,stick:'🌳',
  brief:'A whole new street opened up!',
  steps:[
   {t:'goto',x:-72,z:-60,r:11,txt:'Explore Oak Lane'},
   {t:'ev',ev:'greet:Mr. Chen',n:1,txt:'Say hi to Mr. Chen',tgt:()=>npcPos('Mr. Chen')},
   {t:'ev',ev:'greet:Nora',n:1,txt:'Say hi to Nora',tgt:()=>npcPos('Nora')},
   {t:'ev',ev:'greet:Sam',n:1,txt:'Say hi to Sam',tgt:()=>npcPos('Sam')}]},
 {id:'oak2',icon:'🏘️',name:'Oak Lane Crew',giver:'auto',req:'oak1',stars:2,stick:'🏘️',
  brief:'Meet the rest of the block!',
  steps:[
   {t:'ev',ev:'greet:Marcus',n:1,txt:'Say hi to Marcus',tgt:()=>npcPos('Marcus')},
   {t:'ev',ev:'greet:Bella',n:1,txt:'Say hi to Bella',tgt:()=>npcPos('Bella')},
   {t:'ev',ev:'greet:Ruby',n:1,txt:'Say hi to Ruby',tgt:()=>npcPos('Ruby')},
   {t:'ev',ev:'greet:Jax',n:1,txt:'Say hi to Jax',tgt:()=>npcPos('Jax')}]},
 {id:'maple1',icon:'🍁',name:'Maple Drive Meet-Up',giver:'auto',req:'oak2',stars:2,stick:'🍁',
  brief:'One more street of new friends!',
  steps:[
   {t:'goto',x:36,z:60,r:11,txt:'Explore Maple Drive'},
   {t:'ev',ev:'greet:Mia',n:1,txt:'Say hi to Mia',tgt:()=>npcPos('Mia')},
   {t:'ev',ev:'greet:Ava',n:1,txt:'Say hi to Ava',tgt:()=>npcPos('Ava')},
   {t:'ev',ev:'greet:Ben',n:1,txt:'Say hi to Ben',tgt:()=>npcPos('Ben')}]},
 {id:'maple2',icon:'🤝',name:'The Whole Gang',giver:'auto',req:'maple1',stars:3,stick:'🎊',
  brief:'Now you know EVERYBODY!',
  steps:[
   {t:'ev',ev:'greet:Leo',n:1,txt:'Say hi to Leo',tgt:()=>npcPos('Leo')},
   {t:'ev',ev:'greet:Eli',n:1,txt:'Say hi to Eli',tgt:()=>npcPos('Eli')},
   {t:'ev',ev:'greet:Miss Rosa',n:1,txt:'Say hi to Miss Rosa',tgt:()=>npcPos('Miss Rosa')},
   {t:'ev',ev:'greet:Dr. Kim',n:1,txt:'Say hi to Dr. Kim',tgt:()=>npcPos('Dr. Kim')},
   {t:'ev',ev:'greet:Coach Danny',n:1,txt:'Say hi to Coach Danny',tgt:()=>npcPos('Coach Danny')}]},
 {id:'mayor',icon:'🎖️',name:'Mayor of Carter Town',giver:'auto',req:'maple2',stars:4,stick:'🎖️',badge:'mayor',
  brief:'Everyone in town waves back!',
  steps:[{t:'stat',k:'greet',n:60,txt:'Say hi 60 times (total)'}]},
 {id:'lemon1',icon:'🍋',name:'Lemonade Legend',giver:'Zoe',req:'oak1',stars:2,stick:'🍋',
  brief:'Zoe runs the best stand in town!',
  steps:[
   {t:'goto',x:-72,z:-56.5,r:5,txt:'Visit the lemonade stand'},
   {t:'ev',ev:'greet:Zoe',n:3,txt:'Chat with Zoe 3 times',tgt:()=>npcPos('Zoe')},
   {t:'linger',x:-72,z:-56.5,r:6,secs:15,txt:'Hang out at the stand 15s'}]},
 {id:'lemon2',icon:'🧊',name:'Best Customer',giver:'Zoe',req:'lemon1',stars:2,stick:'🧊',
  brief:'Regulars get extra ice!',
  steps:[{t:'ev',ev:'visit:lemon',n:3,txt:'Visit the stand 3 times'}]},
 {id:'feathers1',icon:'🪶',name:'Feather Finder',giver:'board',req:'oak1',stars:2,stick:'🪶',
  brief:'Soft feathers drift around town...',
  steps:[{t:'count',get:()=>Object.keys((save.townc||{}).feathers||{}).length,n:4,txt:'Find 4 soft feathers'}]},
 {id:'feathers2',icon:'🪽',name:'Feather Collector',giver:'board',req:'feathers1',stars:3,stick:'🪽',badge:'feather_friend',
  brief:'Find every last floaty feather!',
  steps:[{t:'count',get:()=>Object.keys((save.townc||{}).feathers||{}).length,n:10,txt:'Find all 10 feathers'}]},
 {id:'chalk1',icon:'⭐',name:'Star Stomper',giver:'Nora',req:'oak1',stars:2,stick:'✏️',
  brief:'Nora drew magic chalk stars!',
  steps:[{t:'count',get:()=>Object.keys((save.townc||{}).chalk||{}).length,n:4,txt:'Stomp 4 chalk stars'}]},
 {id:'chalk2',icon:'💫',name:'Star Sweeper',giver:'Nora',req:'chalk1',stars:3,stick:'💫',badge:'chalk_champ',
  brief:'Get them ALL, sidewalk hero!',
  steps:[{t:'count',get:()=>Object.keys((save.townc||{}).chalk||{}).length,n:8,txt:'Stomp all 8 stars'}]},
 {id:'splash1',icon:'💦',name:'Sprinkler Splash',giver:'auto',req:'oak1',stars:1,stick:'💦',
  brief:'Nothing beats sprinkler season!',
  steps:[{t:'ev',ev:'sprinkler',n:3,txt:'Run through the sprinkler 3 times'}]},
 {id:'hops1',icon:'🦿',name:'Hopscotch Hero',giver:'Nora',req:'oak1',stars:2,stick:'🎯',badge:'hop_master',
  brief:'Hop the whole board, no misses!',
  steps:[{t:'ev',ev:'hopscotch',n:8,txt:'Bounce on the hopscotch 8 times'}]},
 {id:'kite1',icon:'🪁',name:'Rocket the Kite',giver:'Sam',req:'oak1',stars:2,stick:'🪁',
  brief:'Sam flies the coolest kite ever.',
  steps:[
   {t:'goto',x:-6,z:-56,r:6,txt:'Find Sam and Rocket'},
   {t:'linger',x:-6,z:-56,r:7,secs:15,txt:'Watch Rocket fly for 15s'}]},
 {id:'soccer1',icon:'⚽',name:'Goal Getter',giver:'Coach Danny',req:'maple1',stars:2,stick:'⚽',
  brief:'Coach Danny needs a striker!',
  steps:[
   {t:'goto',x:116,z:38,r:12,txt:'Visit Carter Stadium'},
   {t:'linger',x:116,z:38,r:13,secs:20,txt:'Practice with Coach 20s'}]},
 {id:'soccer2',icon:'🥅',name:'Hat Trick!',giver:'Coach Danny',req:'soccer1',stars:3,stick:'🥅',
  brief:'Three goals. One legend. GO!',
  steps:[{t:'ev',ev:'goal',n:3,txt:'Score 3 goals at Carter Stadium'}]},
 {id:'soccer3',icon:'🌟',name:'Golden Boot',giver:'Coach Danny',req:'soccer2',stars:4,stick:'👞',badge:'golden_boot',
  brief:'Coach says you might go pro!',
  steps:[{t:'ev',ev:'goal',n:10,txt:'Score 10 more goals'}]},
 {id:'match1',icon:'🏟️',name:'Match Day!',giver:'Coach Danny',req:'soccer1',stars:3,stick:'🏟️',
  brief:'Khoa and Michael picked YOU. Beat Chippy’s crew!',
  steps:[{t:'ev',ev:'match_win',n:1,txt:'Win a 3v3 match at Carter Stadium'}]},
 {id:'match2',icon:'🥇',name:'Champions!',giver:'Coach Danny',req:'match1',stars:4,stick:'🥇',badge:'champs',
  brief:'Three wins. A dynasty begins!',
  steps:[{t:'ev',ev:'match_win',n:3,txt:'Win 3 matches (total while active)'}]},
 {id:'bday1',icon:'🎈',name:'Balloon Party',giver:'Ben',req:'maple1',stars:2,stick:'🎈',
  brief:'Ben celebrates every single day!',
  steps:[
   {t:'linger',x:33,z:53,r:6,secs:10,txt:'Party at the balloon house 10s'},
   {t:'ev',ev:'photo:balloon',n:1,txt:'Snap a balloon picture',tgt:()=>({x:33.5,z:54})}]},
 {id:'cookies1',icon:'🍪',name:'Cookie Drop',giver:'board',req:'maple1',stars:2,stick:'🍪',
  brief:'Deliver welcome cookies to 3 new homes!',
  steps:[
   {t:'goto',x:-84,z:-53,r:4,txt:'Cookie stop: Oak Lane west'},
   {t:'goto',x:12,z:-75,r:4,txt:'Cookie stop: Oak Lane south'},
   {t:'goto',x:36,z:53,r:4,txt:'Cookie stop: Maple Drive'}]},
 {id:'cookies2',icon:'🧁',name:'Muffin Run',giver:'board',req:'cookies1',stars:2,stick:'🧁',
  brief:'Fresh muffins, priority delivery!',
  steps:[
   {t:'goto',x:-120,z:-53,r:4,txt:'Muffin stop: far Oak Lane'},
   {t:'goto',x:60,z:-75,r:4,txt:'Muffin stop: Oak south side'},
   {t:'goto',x:-60,z:75,r:4,txt:'Muffin stop: Maple south side'}]},
 {id:'cookies3',icon:'🚚',name:'Snack Express',giver:'board',req:'cookies2',stars:3,stick:'🚚',badge:'delivery_pro',
  brief:'The whole town knows your knock!',
  steps:[
   {t:'goto',x:-132,z:-75,r:5,txt:'Express stop 1'},
   {t:'goto',x:120,z:-75,r:5,txt:'Express stop 2'},
   {t:'goto',x:-132,z:53,r:5,txt:'Express stop 3'},
   {t:'goto',x:132,z:75,r:5,txt:'Express stop 4'}]},
 {id:'regular1',icon:'🧾',name:'Regular Customer',giver:'auto',req:'errand_run',stars:2,stick:'🛍️',
  brief:'The cashier knows your order!',
  steps:[{t:'stat',k:'orders',n:3,txt:'Place 3 snack orders (total)'}]},
 {id:'regular2',icon:'👜',name:'VIP Shopper',giver:'auto',req:'regular1',stars:3,stick:'👜',badge:'vip_shopper',
  brief:'THE boss of the snack aisle.',
  steps:[{t:'stat',k:'orders',n:6,txt:'Place 6 snack orders (total)'}]},
 {id:'pump_pro',icon:'⛽',name:'Pump Patrol',giver:'auto',req:'charge_up',stars:2,stick:'⛽',
  brief:'Every ride stays topped up!',
  steps:[{t:'stat',k:'fuel',n:8,txt:'Fill up or charge 8 times (total)'}]},
 {id:'tour1',icon:'🧭',name:'Township Tour',giver:'board',req:'maple1',stars:3,stick:'🧭',
  brief:'Corner to corner, you know it all!',
  steps:[
   {t:'goto',x:-130,z:-64,r:10,txt:'Oak Lane west end'},
   {t:'goto',x:130,z:-64,r:10,txt:'Oak Lane east end'},
   {t:'goto',x:-130,z:64,r:10,txt:'Maple Drive west end'},
   {t:'goto',x:130,z:64,r:10,txt:'Maple Drive east end'}]},
 {id:'gnomes4',icon:'🍄',name:'Gnomes Move In',giver:'board',req:'gnomes3',stars:3,stick:'🏡',
  brief:'New streets, new hiding spots!',
  steps:[{t:'count',get:()=>Object.keys(Q.gnome||{}).length,n:15,txt:'Find all 15 gnomes'}]},
 {id:'photo3',icon:'📸',name:'New Town Photographer',giver:'board',req:'photo2',stars:3,stick:'🖼️',badge:'photos12',
  brief:'Fresh spots for your album!',
  steps:[{t:'stat',k:'photoSpots',n:12,txt:'Photograph all 12 spots'}]},
 {id:'litter2',icon:'🧹',name:'Sparkling Streets',giver:'board',req:'maple1',stars:2,stick:'✨',
  brief:'New streets deserve to shine!',
  steps:[{t:'ev',ev:'litter',n:4,txt:'Pick up 4 pieces of litter'}]},
 {id:'race_oak',icon:'🚲',name:'Oak Lane Sprint',giver:'Jax',req:'race_hero',stars:3,stick:'🚲',
  brief:'Jax thinks he is the fastest. Prove him wrong!',
  steps:[{t:'race',race:'race_oak',txt:'Bike: stop sign to Oak west under 60s'}]},
 {id:'race_maple',icon:'🚗',name:'Maple Dash',giver:'Jax',req:'race_oak',stars:3,stick:'🏎️',
  brief:'Through the intersection, pedal down!',
  steps:[{t:'race',race:'race_maple',txt:'Car: QuikTrip to Maple east under 42s'}]},
 {id:'race_tour',icon:'🏆',name:'The Grand Tour',giver:'Jax',req:'race_maple',stars:4,stick:'🌍',badge:'grand_tourist',
  brief:'The whole town in one giant lap!',
  steps:[{t:'race',race:'race_tour',txt:'Car: home to Maple west under 85s'}]},
 {id:'skill_bike1',icon:'🚴',name:'Bike Skill I',giver:'auto',req:'oak1',stars:1,stick:'🚲',
  brief:'Training wheels? Never heard of them.',
  steps:[{t:'ev',ev:'bikem',n:800,txt:'Ride your bike 800m'}]},
 {id:'skill_bike2',icon:'🚵',name:'Bike Skill II',giver:'auto',req:'skill_bike1',stars:2,stick:'🚵',
  brief:'Pedal power rising!',
  steps:[{t:'ev',ev:'bikem',n:2500,txt:'Ride your bike 2,500m'}]},
 {id:'skill_bike3',icon:'🏅',name:'Bike Skill III',giver:'auto',req:'skill_bike2',stars:3,stick:'🛞',badge:'bike_master',
  brief:'Legendary legs of steel!',
  steps:[{t:'ev',ev:'bikem',n:6000,txt:'Ride your bike 6,000m'}]},
 {id:'skill_drive1',icon:'🚘',name:'Driver Skill I',giver:'auto',req:'oak1',stars:1,stick:'🚘',
  brief:'Smooth and steady wins.',
  steps:[{t:'ev',ev:'drivem',n:2000,txt:'Drive 2,000m'}]},
 {id:'skill_drive2',icon:'🚙',name:'Driver Skill II',giver:'auto',req:'skill_drive1',stars:2,stick:'🚙',
  brief:'Are you even old enough for this?!',
  steps:[{t:'ev',ev:'drivem',n:6000,txt:'Drive 6,000m'}]},
 {id:'skill_drive3',icon:'🏎️',name:'Driver Skill III',giver:'auto',req:'skill_drive2',stars:3,stick:'🗺️',badge:'drive_master',
  brief:'Boss of every road in town.',
  steps:[{t:'ev',ev:'drivem',n:15000,txt:'Drive 15,000m'}]},
 {id:'skill_walk1',icon:'👟',name:'Walker Skill I',giver:'auto',req:'oak1',stars:1,stick:'👣',
  brief:'Step by step by step!',
  steps:[{t:'ev',ev:'walkm',n:800,txt:'Walk 800m'}]},
 {id:'skill_walk2',icon:'🧦',name:'Walker Skill II',giver:'auto',req:'skill_walk1',stars:2,stick:'🧦',
  brief:'Those shoes are earning it.',
  steps:[{t:'ev',ev:'walkm',n:2500,txt:'Walk 2,500m'}]},
 {id:'skill_walk3',icon:'🏔️',name:'Walker Skill III',giver:'auto',req:'skill_walk2',stars:3,stick:'🏔️',badge:'walk_master',
  brief:'You could hike a mountain!',
  steps:[{t:'ev',ev:'walkm',n:6000,txt:'Walk 6,000m'}]},
 {id:'skill_hop1',icon:'🐸',name:'Bounce Skill I',giver:'auto',req:'oak1',stars:1,stick:'🟢',
  brief:'Boing is a lifestyle.',
  steps:[{t:'ev',ev:'jump',n:40,txt:'Jump 40 times'}]},
 {id:'skill_hop2',icon:'🦘',name:'Bounce Skill II',giver:'auto',req:'skill_hop1',stars:2,stick:'🪀',
  brief:'Higher! HIGHER!',
  steps:[{t:'ev',ev:'jump',n:120,txt:'Jump 120 times'}]},
 {id:'skill_hop3',icon:'🚀',name:'Bounce Skill III',giver:'auto',req:'skill_hop2',stars:3,stick:'🚀',badge:'hop_legend',
  brief:'Basically zero gravity now.',
  steps:[{t:'ev',ev:'jump',n:300,txt:'Jump 300 times'}]},
];
const QBYID={};QUESTS.forEach(q=>QBYID[q.id]=q);
/* chain "next" links for auto-offer flow */
QUESTS.forEach(q=>{if(q.req&&QBYID[q.req])QBYID[q.req].next=QBYID[q.req].next||q.id;});

/* ---------------- dailies ---------------- */
const DAILIES=[
 {id:'d_jump',  icon:'🐸',txt:'Do 15 jumps',            ev:'jump',  n:15},
 {id:'d_greet', icon:'👋',txt:'Say hi to 3 friends',    ev:'greet', n:3},
 {id:'d_pet',   icon:'🐶',txt:'Pet Tiny 2 times',       ev:'pet',   n:2},
 {id:'d_bike',  icon:'🚲',txt:'Ride your bike 300m',    ev:'bikem', n:300},
 {id:'d_drive', icon:'🚗',txt:'Drive 500m',             ev:'drivem',n:500},
 {id:'d_park',  icon:'🛝',txt:'Visit the park',         ev:'visit:park',n:1},
 {id:'d_boing', icon:'🤸',txt:'3 trampoline bounces',   ev:'boing', n:3},
 {id:'d_mail',  icon:'📬',txt:'Check the mail',         ev:'mail',  n:1},
 {id:'d_photo', icon:'📸',txt:'Take 1 photo',           ev:'photo', n:1},
 {id:'d_qt',    icon:'🏪',txt:'Visit QuikTrip',         ev:'visit:qt',n:1},
 {id:'d_knock', icon:'🚪',txt:'Knock on your door',     ev:'knock', n:1},
 {id:'d_stop',  icon:'🛑',txt:'Touch the stop sign',    ev:'visit:stop',n:1},
 {id:'d_walk',  icon:'👟',txt:'Walk 400m',              ev:'walkm', n:400},
 {id:'d_shiny', icon:'🔮',txt:'Find the Shiny Pebble!', ev:'shiny', n:1},
 {id:'d_pond',  icon:'🦆',txt:'Visit the duck pond',    ev:'visit:pond',n:1},
 {id:'d_speed', icon:'💨',txt:'Zoom at top speed for 8s',ev:'speed', n:8},
 {id:'d_sprk',  icon:'💦',txt:'Run through the sprinkler',ev:'sprinkler',n:1},
 {id:'d_hops',  icon:'🦿',txt:'5 hopscotch bounces',    ev:'hopscotch',n:5},
 {id:'d_lemon', icon:'🍋',txt:'Visit the lemonade stand',ev:'visit:lemon',n:1},
 {id:'d_oak',   icon:'🌳',txt:'Visit Oak Lane',         ev:'visit:oak',n:1},
 {id:'d_maple', icon:'🍁',txt:'Visit Maple Drive',      ev:'visit:maple',n:1},
 {id:'d_kite',  icon:'🪁',txt:'Watch Rocket the kite',  ev:'visit:kite',n:1},
 {id:'d_hi5',   icon:'🖐️',txt:'Say hi to 5 friends',ev:'greet',n:5},
 {id:'d_boing10',icon:'🤸',txt:'10 trampoline bounces', ev:'boing',n:10},
 {id:'d_bike8', icon:'🚴',txt:'Ride your bike 800m',    ev:'bikem',n:800},
 {id:'d_soccer',icon:'⚽',txt:'Visit Carter Stadium',     ev:'visit:soccer',n:1},
 {id:'d_goal',  icon:'🥅',txt:'Score a goal!',           ev:'goal',n:1},
];
const DBYID={};DAILIES.forEach(d=>DBYID[d.id]=d);
function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return(h>>>0);}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function rollDaily(){
  const t=todayStr();
  if(Q.daily.date===t)return;
  let h=hashStr(t);const pool=DAILIES.map(d=>d.id),ids=[];
  while(ids.length<3&&pool.length){h=Math.imul(h^61,2654435761)>>>0;ids.push(pool.splice(h%pool.length,1)[0]);}
  Q.daily={date:t,ids:ids,done:{},prog:{},bonus:false};
  Q.days[t]=1;mark();
  shinyRespawn();
}

/* ---------------- badges ---------------- */
const BADGES=[
 {id:'first_quest',icon:'📜',name:'Quest Starter', t:()=>doneCount()>=1},
 {id:'quests5',   icon:'🎖️',name:'Quest Kid',     t:()=>doneCount()>=5},
 {id:'quests15',  icon:'🏵️',name:'Quest Hero',    t:()=>doneCount()>=15},
 {id:'quests30',  icon:'🏆',name:'Quest Legend',  t:()=>doneCount()>=30},
 {id:'stars10',   icon:'⭐',name:'Star Catcher',  t:()=>Q.stars>=10},
 {id:'stars25',   icon:'🌟',name:'Star Collector',t:()=>Q.stars>=25},
 {id:'stars50',   icon:'💫',name:'Star Champion', t:()=>Q.stars>=50},
 {id:'walk1k',    icon:'👟',name:'Walker 1km',    t:()=>ST.walk>=1000},
 {id:'walk3k',    icon:'🥾',name:'Hiker 3km',     t:()=>ST.walk>=3000},
 {id:'walk8k',    icon:'🏅',name:'Marathoner 8km',t:()=>ST.walk>=8000},
 {id:'drive3k',   icon:'🚗',name:'Driver 3km',    t:()=>ST.drive>=3000},
 {id:'drive8k',   icon:'🛣️',name:'Roadie 8km',    t:()=>ST.drive>=8000},
 {id:'drive20k',  icon:'🏎️',name:'Pro Driver 20km',t:()=>ST.drive>=20000},
 {id:'jump50',    icon:'🐸',name:'Hopper 50',     t:()=>ST.jump>=50},
 {id:'jump200',   icon:'🦘',name:'Bouncer 200',   t:()=>ST.jump>=200},
 {id:'jump500',   icon:'🚀',name:'Sky Kid 500',   t:()=>ST.jump>=500},
 {id:'boing25',   icon:'🤸',name:'Tramp Champ 25',t:()=>ST.boing>=25},
 {id:'boing100',  icon:'🎪',name:'Flip Master 100',t:()=>ST.boing>=100},
 {id:'greet15',   icon:'👋',name:'Friendly 15',   t:()=>ST.greet>=15},
 {id:'greet50',   icon:'🫂',name:'Super Friendly 50',t:()=>ST.greet>=50},
 {id:'pets10',    icon:'🐶',name:'Dog Pal 10',    t:()=>ST.pet>=10},
 {id:'pets40',    icon:'❤️',name:'Tiny Forever 40',t:()=>ST.pet>=40},
 {id:'mail10',    icon:'📬',name:'Mail Checker 10',t:()=>ST.mail>=10},
 {id:'fuel10',    icon:'⛽',name:'Pump Pro 10',   t:()=>ST.fuel>=10},
 {id:'photos8',   icon:'📸',name:'Shutterbug',    t:()=>ST.photoSpots>=8},
 {id:'orders3',   icon:'🧾',name:'Shopper 3',     t:()=>ST.orders>=3},
 {id:'races3',    icon:'🏁',name:'Racer 3 Wins',  t:()=>ST.races>=3},
 {id:'races9',    icon:'🏎️',name:'Race Ace 9 Wins',t:()=>ST.races>=9},
 {id:'days3',     icon:'📅',name:'3 Days of Fun', t:()=>Object.keys(Q.days).length>=3},
 {id:'days7',     icon:'🗓️',name:'One Week Boss', t:()=>Object.keys(Q.days).length>=7},
 {id:'days14',    icon:'🎂',name:'Two Week Legend',t:()=>Object.keys(Q.days).length>=14},
 {id:'dailies10', icon:'✅',name:'Daily Do-er 10',t:()=>ST.dailies>=10},
 {id:'dailies30', icon:'📋',name:'Daily Master 30',t:()=>ST.dailies>=30},
 {id:'town_hero', icon:'🦸',name:'Town Hero',     t:()=>!!Q.done.town_hero},
 {id:'gnome_king',icon:'👑',name:'Gnome King',    t:()=>!!Q.done.gnomes3},
 {id:'speed_legend',icon:'🏆',name:'Speed Legend',t:()=>!!Q.done.race_hero},
 {id:'best_friend',icon:'🦴',name:'Best Friend',  t:()=>!!Q.done.tiny3},
 {id:'shutterbug',icon:'🌇',name:'Photo Pro',     t:()=>!!Q.done.photo2},
 {id:'treasure',  icon:'💎',name:'Treasure Master',t:()=>ST.coins>=30},
 {id:'mayor',       icon:'🎖️',name:'Mayor',        t:()=>!!Q.done.mayor},
 {id:'feather_friend',icon:'🪶',name:'Feather Friend', t:()=>!!Q.done.feathers2},
 {id:'chalk_champ', icon:'💫',name:'Chalk Champ',      t:()=>!!Q.done.chalk2},
 {id:'hop_master',  icon:'🎯',name:'Hopscotch Hero',   t:()=>!!Q.done.hops1},
 {id:'delivery_pro',icon:'🚚',name:'Delivery Pro',     t:()=>!!Q.done.cookies3},
 {id:'vip_shopper', icon:'👜',name:'VIP Shopper',      t:()=>!!Q.done.regular2},
 {id:'grand_tourist',icon:'🏆',name:'Grand Tourist',   t:()=>!!Q.done.race_tour},
 {id:'bike_master', icon:'🏅',name:'Bike Master',      t:()=>!!Q.done.skill_bike3},
 {id:'drive_master',icon:'🏁',name:'Drive Master',     t:()=>!!Q.done.skill_drive3},
 {id:'walk_master', icon:'🏔️',name:'Walk Master',t:()=>!!Q.done.skill_walk3},
 {id:'hop_legend',  icon:'🚀',name:'Bounce Legend',    t:()=>!!Q.done.skill_hop3},
 {id:'photos12',    icon:'📷',name:'Town Photographer',t:()=>ST.photoSpots>=12},
 {id:'golden_boot', icon:'🥅',name:'Golden Boot',      t:()=>!!Q.done.soccer3},
 {id:'champs',      icon:'🥇',name:'Stadium Champs',   t:()=>!!Q.done.match2},
];
const TITLES=[[0,'🌱 Rookie'],[6,'🧭 Explorer'],[14,'🤝 Helper'],
              [24,'🌟 Super Helper'],[36,'🦸 Town Hero'],[55,'👑 Legend of Carter Town'],
              [85,'🌠 Mythic Kid'],[120,'🐉 Ultimate Legend']];
function titleFor(s){let t=TITLES[0][1];for(const[m,n]of TITLES)if(s>=m)t=n;return t;}
function nextTitle(s){for(const[m,n]of TITLES)if(s<m)return{need:m,name:n};return null;}
function doneCount(){return Object.keys(Q.done).length;}

/* ---------------- helpers ---------------- */
function npcPos(name){
  try{for(const n of NPCS)if(n.name===name)return{x:n.mesh.position.x,z:n.mesh.position.z};}catch(e){}
  return null;
}
function dogPos(){try{return{x:dog.position.x,z:dog.position.z};}catch(e){return null;}}
function playerXZ(){return driving?{x:carX,z:carZ}:{x:px,z:pz};}
function near(x,z,r){const p=playerXZ();return dist2(p.x,p.z,x,z)<r*r;}
function pop(x,z,n){try{burst(x,1.2,z,n||12);}catch(e){}}
function snd(n){try{sfx(n);}catch(e){}}

/* ---------------- 3D bits (all my own meshes) ---------------- */
const qGroup=new THREE.Group();scene.add(qGroup);
function qMat(c){const m=new THREE.MeshLambertMaterial({color:c});
  try{if(m.color&&m.color.convertSRGBToLinear)m.color.convertSRGBToLinear();}catch(e){} return m;}
function makeGnome(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,0.34,10),qMat(0x3b6fd1));
  body.position.y=0.17;g.add(body);
  const face=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),qMat(0xf2c9a0));
  face.position.y=0.4;g.add(face);
  const hat=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.34,10),qMat(0xd93f34));
  hat.position.y=0.62;g.add(hat);
  const beard=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,6),qMat(0xf5f2ec));
  beard.scale.set(1,0.7,0.7);beard.position.set(0,0.31,0.08);g.add(beard);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return g;
}
const gnomeMeshes={};
function spawnGnomes(){
  GNOME_SPOTS.forEach((s,i)=>{
    if(Q.gnome[i])return;
    const m=makeGnome();m.position.set(s[0],0,s[1]);m.rotation.y=(i*1.7)%6.28;
    qGroup.add(m);gnomeMeshes[i]=m;
  });
}
function spawnGnomeBuddy(){
  if(!Q.flags.gnomeBuddy||qGroup.userData.buddy)return;
  const m=makeGnome();m.position.set(-60.5,0,-12.5);m.rotation.y=0.8;m.scale.set(1.3,1.3,1.3);
  qGroup.add(m);qGroup.userData.buddy=m;
}
let shinyMesh=null,shinySpot=null;
function shinyRespawn(){
  if(shinyMesh){qGroup.remove(shinyMesh);shinyMesh=null;}
  shinySpot=SHINY_SPOTS[hashStr('pip'+Q.daily.date)%SHINY_SPOTS.length];
  if(Q.daily.done.d_shiny||!(Q.daily.ids||[]).includes('d_shiny'))return;
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.32,0),
    new THREE.MeshPhongMaterial({color:0x8F6FC7,emissive:0x5a3fa0,shininess:90}));
  try{m.material.color.convertSRGBToLinear();m.material.emissive.convertSRGBToLinear();}catch(e){}
  m.position.set(shinySpot[0],0.8,shinySpot[1]);m.castShadow=true;
  qGroup.add(m);shinyMesh=m;
}
const photoMeshes={};
function spawnPhotoSpots(){
  PHOTO_SPOTS.forEach(s=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.07,8,24),
      new THREE.MeshBasicMaterial({color:0xffd75e,transparent:true,opacity:0.85}));
    ring.rotation.x=-Math.PI/2;ring.position.set(s.x,0.06,s.z);
    qGroup.add(ring);photoMeshes[s.id]=ring;
  });
}
const litterMeshes={};
function refreshLitter(){
  const active=!!Q.act.clean_town&&!Q.done.clean_town;
  LITTER_SPOTS.forEach((s,i)=>{
    const have=!!litterMeshes[i];
    const want=active&&!Q.litter[i];
    if(want&&!have){
      const m=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,5),qMat(0xc9c9bf));
      m.scale.set(1,0.55,0.8);m.position.set(s[0],0.12,s[1]);qGroup.add(m);litterMeshes[i]=m;
    }else if(!want&&have){qGroup.remove(litterMeshes[i]);delete litterMeshes[i];}
  });
}
const fetchMeshes={};
function refreshFetch(){
  const items={rake:{q:'bob_rake',x:-30,z:-28},glasses:{q:'sue_glasses',x:-104,z:33.2}};
  for(const k in items){
    const it=items[k],q=QBYID[it.q];
    const want=Q.act[it.q]&&!Q.done[it.q]&&stepIdx(q)===0;
    const have=!!fetchMeshes[k];
    if(want&&!have){
      let m;
      if(k==='rake'){m=new THREE.Group();
        const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.4,6),qMat(0x8a5a2b));
        stick.rotation.z=1.2;stick.position.y=0.32;m.add(stick);
        const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,0.14),qMat(0x777777));
        head.position.set(0.62,0.08,0);m.add(head);
      }else{m=new THREE.Group();
        const l1=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.03,6,14),qMat(0x222222));
        const l2=l1.clone();l1.position.x=-0.14;l2.position.x=0.14;
        l1.rotation.x=l2.rotation.x=Math.PI/2;m.add(l1);m.add(l2);m.position.y=0.1;
      }
      m.position.set(it.x,m.position.y,it.z);qGroup.add(m);fetchMeshes[k]=m;
    }else if(!want&&have){qGroup.remove(fetchMeshes[k]);delete fetchMeshes[k];}
  }
}
/* job board */
(function makeBoard(){
  const g=new THREE.Group();g.position.set(BOARD.x,0,BOARD.z);g.rotation.y=-0.5;
  const p1=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.9,8),qMat(0x7a5230));
  const p2=p1.clone();p1.position.set(-0.85,0.95,0);p2.position.set(0.85,0.95,0);
  g.add(p1);g.add(p2);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(2,1.15,0.08),qMat(0x9a6b3f));
  panel.position.y=1.45;g.add(panel);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.1,0.5),qMat(0x6e4a28));
  roof.position.y=2.1;g.add(roof);
  for(let i=0;i<3;i++){
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.55),
      new THREE.MeshBasicMaterial({color:[0xfff7d9,0xd9f0ff,0xffe3ef][i]}));
    paper.position.set(-0.62+i*0.62,1.45,0.05);paper.rotation.z=(i-1)*0.08;g.add(paper);
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  qGroup.add(g);
})();
/* beacon */
const beacon=new THREE.Group();
const bCol=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,26,12,1,true),
  new THREE.MeshBasicMaterial({color:0xffd75e,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false}));
bCol.position.y=13;beacon.add(bCol);
const bStarTex=(function(){const c=document.createElement('canvas');c.width=c.height=96;
  const x=c.getContext('2d');x.font='72px serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('⭐',48,52);const t=new THREE.CanvasTexture(c);return t;})();
const bStar=new THREE.Sprite(new THREE.SpriteMaterial({map:bStarTex,transparent:true,depthWrite:false}));
bStar.scale.set(1.6,1.6,1);bStar.position.y=3.2;beacon.add(bStar);
beacon.visible=false;scene.add(beacon);
/* ❗ sprites over quest givers + board */
const exclTex=(function(){const c=document.createElement('canvas');c.width=c.height=96;
  const x=c.getContext('2d');x.font='bold 78px Arial';x.textAlign='center';x.textBaseline='middle';
  x.fillStyle='#ff9d1c';x.strokeStyle='#7a4a00';x.lineWidth=5;
  x.strokeText('!',48,50);x.fillText('!',48,50);
  return new THREE.CanvasTexture(c);})();
const giverMarks={};
function giverMark(name,parent,y){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:exclTex,transparent:true,depthWrite:false}));
  s.scale.set(0.8,0.8,1);s.position.y=y;s.visible=false;parent.add(s);giverMarks[name]=s;
  return s;
}
let boardMark=null;
function initMarks(){
  try{for(const n of NPCS)if(['Mr. Bob','Max','Lily','Miss Sue','Zoe','Nora','Sam','Jax','Ben','Coach Danny'].includes(n.name))giverMark(n.name,n.mesh,2.5);}catch(e){}
  const bg=new THREE.Group();bg.position.set(BOARD.x,2.7,BOARD.z);scene.add(bg);
  boardMark=giverMark('__board',bg,0);
}

/* ---------------- quest engine ---------------- */
function prereqOk(q){return !q.req||!!Q.done[q.req];}
function isAvail(q){return !Q.done[q.id]&&!Q.act[q.id]&&prereqOk(q);}
function availFor(giver){return QUESTS.filter(q=>q.giver===giver&&isAvail(q));}
function stepIdx(q){
  const p=Q.p[q.id]||[];
  for(let i=0;i<q.steps.length;i++){
    const s=q.steps[i],need=stepNeed(s);
    if((p[i]||0)<need)return i;
  }
  return q.steps.length;
}
function stepNeed(s){
  if(s.t==='ev')return s.n||1;
  if(s.t==='stat')return s.n;
  if(s.t==='linger')return s.secs;
  if(s.t==='days')return s.n;
  return 1; /* goto, race */
}
function stepProg(q,i){
  const s=q.steps[i];
  if(s.t==='stat')return Math.min(stepNeed(s),Math.floor(ST[s.k]||0));
  if(s.t==='count')return Math.min(stepNeed(s),(s.get?s.get():0)||0);
  if(s.t==='days')return Math.min(stepNeed(s),Object.keys(Q[s.k]||{}).length);
  return Math.min(stepNeed(s),(Q.p[q.id]||[])[i]||0);
}
function bump(q,i,amt){
  if(!Q.p[q.id])Q.p[q.id]=[];
  Q.p[q.id][i]=((Q.p[q.id][i]||0)+(amt||1));
  mark();
}
function accept(id,quiet){
  const q=QBYID[id];if(!q||Q.act[id]||Q.done[id])return;
  Q.act[id]=1;if(!Q.p[id])Q.p[id]=[];
  if(!Q.track)Q.track=id;
  mark();flushSave();
  refreshLitter();refreshFetch();
  if(!quiet){snd('pop');toast(q.icon+' Quest started: '+q.name+'!');}
  uiRefresh();
}
function complete(q){
  const availBefore=QUESTS.filter(isAvail).length;
  delete Q.act[q.id];Q.done[q.id]=1;
  Q.stars+=(q.stars||1);
  if(q.stick)Q.stick[q.stick]=1;
  ST.questsDone=(ST.questsDone||0)+1;
  if(Q.track===q.id)Q.track=null;
  mark();flushSave();
  snd('stage');
  const p=playerXZ();pop(p.x,p.z,26);
  toast('🎉 QUEST COMPLETE: '+q.name+'  +'+(q.stars||1)+'⭐');
  if(q.stick)setTimeout(()=>toast('✨ New sticker: '+q.stick+'  (check your Quest Book!)'),900);
  try{if(q.onDone)q.onDone();}catch(e){}
  /* chain flow: auto-accept 'auto' successors, announce others */
  if(q.next){
    const nx=QBYID[q.next];
    if(nx&&isAvail(nx)){
      if(nx.giver==='auto')setTimeout(()=>accept(nx.id),1600);
      else setTimeout(()=>toast('📜 New quest ready: '+nx.icon+' '+nx.name+'!'),1600);
    }
  }
  if(!Q.track){const a=Object.keys(Q.act)[0];if(a)Q.track=a;}
  const availAfter=QUESTS.filter(isAvail).length;
  if(availAfter>availBefore+1)setTimeout(()=>toast('📜 '+(availAfter-availBefore)+' new quests in your Quest Book!'),2400);
  checkTitle();checkBadges();uiRefresh();
}
let lastTitle=null;
function checkTitle(){
  const t=titleFor(Q.stars);
  if(lastTitle===null){lastTitle=Q.seen.title||t;}
  if(t!==lastTitle&&t!==Q.seen.title){
    Q.seen.title=t;lastTitle=t;mark();
    setTimeout(()=>{snd('stage');toast('🏅 NEW RANK: '+t+'!');const p=playerXZ();pop(p.x,p.z,30);},1400);
  }
}
function checkBadges(){
  for(const b of BADGES){
    if(Q.badge[b.id])continue;
    let ok=false;try{ok=b.t();}catch(e){}
    if(ok){Q.badge[b.id]=1;mark();
      setTimeout(()=>{snd('stage');toast('🎖️ Badge earned: '+b.icon+' '+b.name+'!');},600);
    }
  }
}
/* event fan-out */
function ev(name,amt){
  amt=amt||1;
  /* actives: only the CURRENT step listens (chains feel like stories) */
  for(const id in Q.act){
    const q=QBYID[id];if(!q)continue;
    const i=stepIdx(q);if(i>=q.steps.length)continue;
    const s=q.steps[i];
    if(s.t==='ev'&&(s.ev===name||(s.ev==='greet'&&name.indexOf('greet:')===0))){
      bump(q,i,amt);
      const need=stepNeed(s),have=stepProg(q,i);
      if(have>=need){
        if(stepIdx(q)>=q.steps.length)complete(q);
        else{snd('pop');toast('✅ '+s.txt+' — next: '+q.steps[stepIdx(q)].txt);}
      }
    }
  }
  /* dailies */
  rollDaily();
  for(const did of Q.daily.ids){
    if(Q.daily.done[did])continue;
    const d=DBYID[did];if(!d)continue;
    const hit=(d.ev===name)||(d.ev==='greet'&&name.indexOf('greet:')===0);
    if(!hit)continue;
    Q.daily.prog=Q.daily.prog||{};
    Q.daily.prog[did]=(Q.daily.prog[did]||0)+amt;
    if(Q.daily.prog[did]>=d.n){
      Q.daily.done[did]=1;Q.stars+=1;ST.dailies++;mark();
      snd('stage');toast('✅ Daily done: '+d.icon+' '+d.txt+'  +1⭐');
      if(!Q.daily.bonus&&Q.daily.ids.every(x=>Q.daily.done[x])){
        Q.daily.bonus=true;Q.stars+=1;mark();
        setTimeout(()=>toast('🌟 ALL dailies done! Bonus +1⭐'),900);
      }
      checkTitle();checkBadges();uiRefresh();
    }
    mark();
  }
  uiBadgeDot();
}

/* ---------------- race engine ---------------- */
let race=null; /* {id,t} */
function raceStepActive(){
  for(const id in Q.act){
    const q=QBYID[id],i=stepIdx(q);
    if(i<q.steps.length&&q.steps[i].t==='race')return{q:q,step:q.steps[i],r:RACES[q.steps[i].race],rid:q.steps[i].race};
  }
  return null;
}
function raceVehicleOk(r){
  if(!driving||!activeV)return false;
  if(r.veh==='bike')return !!activeV.bike;
  if(r.veh==='car')return !activeV.bike;
  return activeV.key===r.veh;
}
function raceStart(rid){
  const r=RACES[rid];
  race={id:rid,t:r.limit};
  snd('stage');toast('🏁 GO! Reach '+r.name.split('→')[1].trim()+' in '+r.limit+'s!');
  qRaceEl.classList.remove('hidden');
}
function raceTick(dt){
  if(!race)return;
  const r=RACES[race.id];
  race.t-=dt;
  qRaceEl.textContent='🏁 '+Math.max(0,race.t).toFixed(1)+'s';
  qRaceEl.style.color=race.t<6?'#ff5f4b':'#fff';
  if(near(r.to.x,r.to.z,r.to.r)){
    const used=r.limit-race.t;
    const best=Q.best[race.id];
    if(best===undefined||used<best)Q.best[race.id]=Math.round(used*10)/10;
    ST.races++;mark();
    qRaceEl.classList.add('hidden');
    const rid=race.id;race=null;
    snd('stage');toast('🏆 WON in '+used.toFixed(1)+'s! Best: '+Q.best[rid]+'s');
    const p=playerXZ();pop(p.x,p.z,30);
    ev('race:'+rid);
    /* the race step itself */
    for(const id in Q.act){
      const q=QBYID[id],i=stepIdx(q);
      if(i<q.steps.length&&q.steps[i].t==='race'&&q.steps[i].race===rid){
        bump(q,i,1);
        if(stepIdx(q)>=q.steps.length)complete(q);
      }
    }
    checkBadges();
    return;
  }
  if(race.t<=0){
    qRaceEl.classList.add('hidden');
    race=null;
    toast('⏰ So close! Ride back to the start to try again!');
  }
}

/* ---------------- per-frame detectors ---------------- */
let lastPX=null,lastPZ=null,lastCarX=null,lastCarZ=null,airborne=false,
    wasDriving=false,lastOrders=-1,lastCoins=-1,speedT=0,
    visitIn={},secTimer=0,introT=0,qTime=0;
const qClock=new THREE.Clock(); /* same clock source as tick() — the repo's
  deterministic test stepper (stub THREE.Clock.prototype.getDelta) drives this layer too */
function questTick(){
  let dt=qClock.getDelta();
  if(!(dt>0)||dt>0.25)dt=0.05;
  qTime+=dt;const now=qTime*1000;
  if(!playing)return;
  rollDaily();

  /* --- distance + movement stats --- */
  if(!driving){
    if(lastPX!==null){
      const d=Math.sqrt(dist2(px,pz,lastPX,lastPZ));
      if(d<3){ST.walk+=d;if(d>0.01){ev('walkm',d);mark();}}
    }
    lastPX=px;lastPZ=pz;lastCarX=null;
    /* jump detect (rising edge off the ground) */
    if(py>0.35&&!airborne){airborne=true;ST.jump++;mark();ev('jump');
      if(near(TRAMP_P.x,TRAMP_P.z,4.2)&&py>1.05){ST.boing++;ev('boing');}
    }
    if(py<0.08)airborne=false;
  }else{
    if(lastCarX!==null){
      const d=Math.sqrt(dist2(carX,carZ,lastCarX,lastCarZ));
      if(d<6){ST.drive+=d;ev('drivem',d);
        if(activeV){ST.driveV[activeV.key]=(ST.driveV[activeV.key]||0)+d;
          if(activeV.bike)ev('bikem',d);}
        mark();}
    }
    lastCarX=carX;lastCarZ=carZ;lastPX=null;
    /* top-speed streak */
    if(activeV&&Math.abs(carSpd)>activeV.max*0.88){speedT+=dt;if(speedT>=1){ev('speed',speedT);speedT=0;}}
    else speedT=0;
  }
  /* vehicle enter events */
  if(driving&&!wasDriving&&activeV){ev('drive:'+activeV.key);}
  wasDriving=driving;

  /* --- POI visit edge triggers --- */
  for(const k in POIS){
    const p=POIS[k],inNow=near(p.x,p.z,p.r);
    if(inNow&&!visitIn[k]){visitIn[k]=true;ev('visit:'+k);
      if(k==='pond'){const t=todayStr();if(!Q.pondDays[t]){Q.pondDays[t]=1;mark();}}
    }else if(!inNow)visitIn[k]=false;
  }

  /* --- goto / linger steps on actives --- */
  for(const id in Q.act){
    const q=QBYID[id];if(!q)continue;
    const i=stepIdx(q);if(i>=q.steps.length){complete(q);continue;}
    const s=q.steps[i];
    if(s.t==='goto'&&near(s.x,s.z,s.r)){
      bump(q,i,1);snd('pop');
      if(stepIdx(q)>=q.steps.length)complete(q);
      else toast('✅ '+s.txt+' — next: '+q.steps[stepIdx(q)].txt);
    }else if(s.t==='linger'){
      if(!Q.p[id])Q.p[id]=[];
      if(near(s.x,s.z,s.r)){
        Q.p[id][i]=(Q.p[id][i]||0)+dt;mark();
        if(Q.p[id][i]>=s.secs){Q.p[id][i]=s.secs;
          if(stepIdx(q)>=q.steps.length)complete(q);
          else{snd('pop');toast('✅ '+s.txt);}
        }
      }else if(Q.p[id][i])Q.p[id][i]=0; /* per-quest timer; leaving the zone resets */
    }else if(s.t==='stat'||s.t==='days'){
      if(stepProg(q,i)>=stepNeed(s)){
        bumpToNeed(q,i);
        if(stepIdx(q)>=q.steps.length)complete(q);
      }
    }
  }

  /* --- watchers: orders + coins --- */
  try{
    const oc=save.orders?save.orders.length:0;
    if(lastOrders===-1)lastOrders=oc;
    if(oc>lastOrders){ST.orders+=oc-lastOrders;ev('order',oc-lastOrders);mark();}
    lastOrders=oc;
  }catch(e){}
  try{
    const cc=save.got?save.got.length:0;
    if(lastCoins===-1)lastCoins=cc;
    if(cc>lastCoins){ST.coins=cc;ev('coin',cc-lastCoins);mark();}
    lastCoins=cc;
  }catch(e){}

  raceTick(dt);

  /* --- 1s housekeeping --- */
  secTimer+=dt;
  if(secTimer>1){
    secTimer=0;
    checkBadges();checkTitle();
    refreshLitter();refreshFetch();
    spawnGnomeBuddy();
    updateMarks();
    flushSave();
  }

  /* --- intro nudge --- */
  if(!Q.seen.intro){
    introT+=dt;
    if(introT>12){Q.seen.intro=1;mark();
      toast('📜 NEW! Quests came to town — tap the scroll!');
      qBtn.classList.add('qpulse');
      if(isAvail(QBYID.hello_town))accept('hello_town',true);
      uiRefresh();
    }
  }

  /* --- beacon + tracker + spinny bits --- */
  updateBeacon(now);
  if(shinyMesh){shinyMesh.rotation.y+=dt*2;shinyMesh.position.y=0.8+Math.sin(now/300)*0.15;}
  for(const k in photoMeshes){const m=photoMeshes[k];m.rotation.z+=dt*0.8;}
}
function bumpToNeed(q,i){if(!Q.p[q.id])Q.p[q.id]=[];Q.p[q.id][i]=stepNeed(q.steps[i]);mark();}
function updateMarks(){
  for(const name in giverMarks){
    if(name==='__board')continue;
    giverMarks[name].visible=availFor(name).length>0;
  }
  if(boardMark){
    const bAvail=availFor('board').length>0;
    const dLeft=Q.daily.ids.some(id=>!Q.daily.done[id]);
    boardMark.visible=bAvail||dLeft;
  }
}
function trackTarget(){
  const id=Q.track;if(!id||!Q.act[id])return null;
  const q=QBYID[id],i=stepIdx(q);
  if(i>=q.steps.length)return null;
  const s=q.steps[i];
  if(s.t==='goto'||s.t==='linger')return{x:s.x,z:s.z};
  if(s.t==='race'){const r=RACES[s.race];return race?{x:r.to.x,z:r.to.z}:{x:r.from.x,z:r.from.z};}
  if(s.tgt){try{return s.tgt();}catch(e){}}
  return null;
}
function updateBeacon(now){
  /* 3D marker (only when the step has a map target) */
  const t=trackTarget();
  if(!t){beacon.visible=false;}
  else{
    beacon.visible=true;
    beacon.position.x+=(t.x-beacon.position.x)*0.2;
    beacon.position.z+=(t.z-beacon.position.z)*0.2;
    bStar.position.y=3.2+Math.sin(now/350)*0.4;
    bCol.material.opacity=0.16+0.08*Math.sin(now/300);
  }
  /* tracker pill text (always shows the tracked step, even with no target) */
  const id=Q.track,q=id&&QBYID[id];
  if(q&&Q.act[id]){
    const i=stepIdx(q);
    if(i<q.steps.length){
      const s=q.steps[i],need=stepNeed(s),have=Math.floor(stepProg(q,i));
      qTrackTxt.textContent=q.icon+' '+s.txt+(need>1?('  '+have+'/'+need):'');
      qTrack.classList.remove('hidden');
      return;
    }
  }
  qTrack.classList.add('hidden');
}

/* ---------------- interaction layer ---------------- */
function myCandidates(){
  const c=[];
  if(driving){
    /* race start while riding/driving */
    const ra=raceStepActive();
    if(ra&&!race&&raceVehicleOk(ra.r)&&near(ra.r.from.x,ra.r.from.z,ra.r.from.r)){
      c.push({d:0.5,label:'🏁 Start the race! ('+ra.r.name+')',fn:()=>raceStart(ra.rid)});
    }
    return c;
  }
  /* gnomes */
  for(const i in gnomeMeshes){
    const m=gnomeMeshes[i];
    const d=dist2(px,pz,m.position.x,m.position.z);
    if(d<1.9*1.9)c.push({d:d,label:'🍄 A tiny gnome! Pick it up!',fn:()=>{
      Q.gnome[i]=1;qGroup.remove(m);delete gnomeMeshes[i];mark();
      snd('pop');pop(m.position.x,m.position.z,14);
      const found=Object.keys(Q.gnome).length;
      toast('🍄 Gnome found '+GNOME_SPOTS[i][2]+'! ('+found+'/'+GNOME_SPOTS.length+')');
      ev('gnome');
    }});
  }
  /* shiny pebble */
  if(shinyMesh){
    const d=dist2(px,pz,shinyMesh.position.x,shinyMesh.position.z);
    if(d<2*2)c.push({d:d,label:'🔮 The Shiny Pebble!',fn:()=>{
      qGroup.remove(shinyMesh);shinyMesh=null;ST.shiny++;mark();
      snd('pop');pop(px,pz,18);
      toast('🔮 You found the Shiny Pebble!');
      ev('shiny');
    }});
  }
  /* photo spots */
  for(const s of PHOTO_SPOTS){
    const d=dist2(px,pz,s.x,s.z);
    if(d<3.4*3.4)c.push({d:d+0.4,label:'📸 Take a picture! ('+s.name+')',fn:()=>{
      photoFlash();snd('pop');
      const first=!Q.photo[s.id];
      Q.photo[s.id]=1;ST.photo++;
      ST.photoSpots=Object.keys(Q.photo).length;mark();
      toast(first?('📸 New photo: '+s.em+' '+s.name+'!'):'📸 Nice shot!');
      ev('photo');ev('photo:'+s.id);
    }});
  }
  /* litter */
  for(const i in litterMeshes){
    const m=litterMeshes[i];
    const d=dist2(px,pz,m.position.x,m.position.z);
    if(d<1.9*1.9)c.push({d:d,label:'🧹 Pick up the litter',fn:()=>{
      Q.litter[i]=1;qGroup.remove(m);delete litterMeshes[i];mark();
      snd('pop');toast('🧹 Got it! Carter Town sparkles!');
      ev('litter');
    }});
  }
  /* fetch items */
  for(const k in fetchMeshes){
    const m=fetchMeshes[k];
    const d=dist2(px,pz,m.position.x,m.position.z);
    const label=k==='rake'?'🧰 Grab the rake!':'🕶️ Pick up the glasses!';
    if(d<2*2)c.push({d:d,label:label,fn:()=>{
      qGroup.remove(m);delete fetchMeshes[k];
      snd('pop');toast(k==='rake'?'🧰 Got the rake!':'🕶️ Found the glasses!');
      ev('item:'+k);
    }});
  }
  /* job board */
  {
    const d=dist2(px,pz,BOARD.x,BOARD.z);
    if(d<3*3)c.push({d:d,label:'📋 Read the Job Board',fn:()=>{openQuestBook('daily');}});
  }
  /* race start on foot? (bike race needs the bike, hint) */
  const ra=raceStepActive();
  if(ra&&!race&&near(ra.r.from.x,ra.r.from.z,ra.r.from.r)&&!driving){
    c.push({d:2.5,label:'🏁 Race start — bring '+(ra.r.veh==='bike'?'your bike!':'a car!'),fn:()=>{
      toast('🏁 Come back '+(ra.r.veh==='bike'?'ON YOUR BIKE':'IN A CAR')+' to start!');}});
  }
  return c;
}
function photoFlash(){
  qFlash.style.opacity='0.9';
  setTimeout(()=>{qFlash.style.opacity='0';},120);
}

/* ---------------- wrap the base game (load-time install) ---------------- */
const _objUpdate=objUpdate;
objUpdate=function(){_objUpdate();try{questTick();}catch(e){}};
const _scanInteract=scanInteract;
scanInteract=function(){
  _scanInteract();
  try{
    const mine=myCandidates();
    if(!mine.length)return;
    mine.sort((a,b)=>a.d-b.d);
    const m=mine[0];
    /* base wins unless it found nothing, or we are basically standing on ours */
    if(!curInteract||m.d<1.8*1.8){
      curInteract={label:m.label,fn:m.fn};
      const p=$('prompt');p.textContent=m.label;p.classList.remove('hidden');
    }
  }catch(e){}
};
const _doInteract=doInteract;
doInteract=function(){
  const ci=curInteract;
  _doInteract();
  try{
    if(!ci||!ci.label)return;
    const L=ci.label;
    if(L.indexOf('👋')===0){
      const name=L.replace('👋 Say hi to ','').trim();
      ST.greet++;ST.greetN[name]=(ST.greetN[name]||0)+1;mark();
      ev('greet:'+name); /* generic 'greet' listeners match via the greet: prefix rule */
      /* quest giver offer */
      const offers=availFor(name);
      if(offers.length)setTimeout(()=>openOffer(offers[0],name),350);
    }
    else if(L.indexOf('🐶')===0){ST.pet++;mark();ev('pet');}
    else if(L.indexOf('📬')===0){ST.mail++;mark();ev('mail');}
    else if(L.indexOf('🚪')===0){ST.knock++;mark();ev('knock');}
    else if(L.indexOf('⛽')===0||L.indexOf('⚡')===0){ST.fuel++;mark();ev('fuel');}
  }catch(e){}
};
const _anyModal=anyModal;
anyModal=function(){return _anyModal()||qModalOpen();};
const _closeModals=closeModals;
closeModals=function(){_closeModals();try{qCloseAll();}catch(e){}};

/* ---------------- UI ---------------- */
const css=document.createElement('style');
css.textContent=`
#qBtn{position:absolute;top:calc(max(10px,env(safe-area-inset-top)) + 46px);left:max(12px,env(safe-area-inset-left));
  background:linear-gradient(160deg,#8F6FC7,#4A3575);color:#fff;border:2px solid #ffffff55;border-radius:22px;
  padding:7px 14px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 3px 10px #0004;user-select:none;}
#qBtn.qpulse{animation:qpulse 1s ease infinite;}
@keyframes qpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
#qTrack{position:absolute;top:calc(max(10px,env(safe-area-inset-top)) + 88px);left:max(12px,env(safe-area-inset-left));
  background:#000000a8;color:#ffe9a8;border-radius:14px;padding:5px 12px;font-size:13px;font-weight:700;
  max-width:62vw;cursor:pointer;}
#qRace{position:absolute;top:calc(max(10px,env(safe-area-inset-top)) + 52px);left:50%;transform:translateX(-50%);
  background:#000000c9;color:#fff;font-size:26px;font-weight:900;border-radius:16px;padding:6px 18px;letter-spacing:1px;}
#qFlash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s;z-index:95;}
#qModal,#qOffer{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;
  background:#0008;backdrop-filter:blur(3px);}
#qModal.hidden,#qOffer.hidden,#qTrack.hidden,#qRace.hidden{display:none;}
.qCard{background:#fffdf6;color:#2b2340;border-radius:20px;width:min(560px,94vw);max-height:86vh;
  display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 60px #0007;
  font-family:inherit;}
.qHead{background:linear-gradient(160deg,#8F6FC7,#4A3575);color:#fff;padding:14px 18px;}
.qHead h2{margin:0;font-size:20px;}
.qRank{font-size:13px;opacity:.95;margin-top:3px;}
.qBar{height:8px;background:#ffffff33;border-radius:6px;margin-top:6px;overflow:hidden;}
.qBar>div{height:100%;background:#ffd75e;border-radius:6px;}
.qTabs{display:flex;gap:6px;padding:10px 12px 0;}
.qTab{flex:1;border:none;border-radius:12px 12px 0 0;padding:9px 4px;font-weight:800;font-size:14px;
  background:#e8e2f2;color:#5a4a80;cursor:pointer;}
.qTab.on{background:#fff;color:#37285c;box-shadow:0 -2px 8px #0001;}
.qBody{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px 18px;background:#fff;flex:1;}
.qItem{border:2px solid #eee6f7;border-radius:14px;padding:10px 12px;margin-bottom:10px;}
.qItem.done{opacity:.55;}
.qItem h3{margin:0 0 3px;font-size:16px;}
.qItem p{margin:2px 0;font-size:13px;color:#6b6280;}
.qStep{font-size:13px;margin:3px 0;color:#37285c;font-weight:600;}
.qStep.sdone{color:#2ea363;}
.qMini{height:7px;background:#eee6f7;border-radius:5px;overflow:hidden;margin-top:6px;}
.qMini>div{height:100%;background:linear-gradient(90deg,#8F6FC7,#ffd75e);}
.qAct{display:flex;gap:8px;margin-top:8px;}
.qAct button{border:none;border-radius:10px;padding:7px 14px;font-weight:800;cursor:pointer;font-size:13px;}
.qGo{background:#8F6FC7;color:#fff;}
.qTrackB{background:#ffd75e;color:#5a4300;}
.qX{position:absolute;top:10px;right:14px;background:#ffffff2e;border:none;color:#fff;font-size:20px;
  border-radius:10px;width:34px;height:34px;cursor:pointer;font-weight:900;}
.qGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px;}
.qStickerC{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:#f6f2fd;border-radius:14px;font-size:28px;border:2px solid #eee6f7;}
.qStickerC.lock{filter:grayscale(1);opacity:.4;}
.qStickerC small{font-size:9px;color:#6b6280;margin-top:2px;text-align:center;line-height:1.1;}
.qOfferCard{background:#fffdf6;border-radius:20px;width:min(430px,92vw);padding:20px 20px 16px;
  box-shadow:0 18px 60px #0007;text-align:center;position:relative;}
.qOfferCard h3{margin:4px 0 6px;font-size:20px;color:#37285c;}
.qOfferCard .qWho{font-size:13px;color:#8F6FC7;font-weight:800;text-transform:uppercase;letter-spacing:.08em;}
.qOfferCard p{color:#5c5374;font-size:14px;margin:6px 0 12px;}
.qOfferCard ul{text-align:left;margin:0 0 14px;padding-left:22px;color:#37285c;font-size:13px;font-weight:600;}
@media (max-height:430px){.qCard{max-height:96vh}#qBtn{top:calc(max(6px,env(safe-area-inset-top)) + 40px)}}
`;
document.head.appendChild(css);

const hud=$('hud');
const qBtn=document.createElement('button');qBtn.id='qBtn';qBtn.textContent='📜 ⭐0';
hud.appendChild(qBtn);
const qTrack=document.createElement('div');qTrack.id='qTrack';qTrack.className='hidden';
const qTrackTxt=document.createElement('span');qTrack.appendChild(qTrackTxt);
hud.appendChild(qTrack);
const qRaceEl=document.createElement('div');qRaceEl.id='qRace';qRaceEl.className='hidden';
hud.appendChild(qRaceEl);
const qFlash=document.createElement('div');qFlash.id='qFlash';document.body.appendChild(qFlash);

const qModal=document.createElement('div');qModal.id='qModal';qModal.className='hidden';
qModal.innerHTML=`
 <div class="qCard" style="position:relative">
  <div class="qHead">
    <button class="qX" id="qClose">✕</button>
    <h2>📜 Carter's Quest Book</h2>
    <div class="qRank" id="qRankLine"></div>
    <div class="qBar"><div id="qRankBar" style="width:0%"></div></div>
  </div>
  <div class="qTabs">
    <button class="qTab on" data-tab="quests">Quests</button>
    <button class="qTab" data-tab="daily">Daily</button>
    <button class="qTab" data-tab="stickers">Stickers</button>
    <button class="qTab" data-tab="badges">Badges</button>
  </div>
  <div class="qBody" id="qBody"></div>
 </div>`;
document.body.appendChild(qModal);
const qOffer=document.createElement('div');qOffer.id='qOffer';qOffer.className='hidden';
document.body.appendChild(qOffer);

let qTab='quests';
function qModalOpen(){return !qModal.classList.contains('hidden')||!qOffer.classList.contains('hidden');}
function qCloseAll(){qModal.classList.add('hidden');qOffer.classList.add('hidden');}
function openQuestBook(tab){
  if(tab)qTab=tab;
  qBtn.classList.remove('qpulse');
  renderBook();
  qModal.classList.remove('hidden');
  snd('pop');
}
qBtn.addEventListener('click',()=>{if(!qModalOpen())openQuestBook();else qCloseAll();});
qTrack.addEventListener('click',()=>openQuestBook('quests'));
qModal.addEventListener('click',e=>{
  if(e.target.id==='qClose'||e.target===qModal)qCloseAll();
  const tb=e.target.closest('.qTab');
  if(tb){qTab=tb.dataset.tab;renderBook();}
  const act=e.target.closest('[data-accept]');
  if(act){accept(act.dataset.accept);renderBook();}
  const tr=e.target.closest('[data-track]');
  if(tr){Q.track=tr.dataset.track;mark();snd('pop');renderBook();uiRefresh();}
});
function openOffer(q,who){
  if(qModalOpen())return;
  const steps=q.steps.map(s=>'<li>'+s.txt+'</li>').join('');
  qOffer.innerHTML=`
   <div class="qOfferCard">
     <div class="qWho">${who==='board'?'📋 Job Board':who} has a quest!</div>
     <h3>${q.icon} ${q.name}</h3>
     <p>${q.brief}</p>
     <ul>${steps}</ul>
     <div style="font-weight:800;color:#b8860b;margin-bottom:12px">Reward: ${'⭐'.repeat(q.stars||1)}${q.stick?(' + sticker '+q.stick):''}</div>
     <div class="qAct" style="justify-content:center">
       <button class="qGo" id="qYes" style="font-size:16px;padding:10px 22px">✅ Let's go!</button>
       <button class="qTrackB" id="qNo" style="font-size:16px;padding:10px 22px">⏰ Later</button>
     </div>
   </div>`;
  qOffer.classList.remove('hidden');
  snd('pop');
  qOffer.querySelector('#qYes').addEventListener('click',()=>{qOffer.classList.add('hidden');accept(q.id);Q.track=q.id;mark();uiRefresh();});
  qOffer.querySelector('#qNo').addEventListener('click',()=>{qOffer.classList.add('hidden');toast('📜 Saved in your Quest Book!');});
}
function qBar(have,need){const w=Math.min(100,Math.round(have/need*100));
  return '<div class="qMini"><div style="width:'+w+'%"></div></div>';}
function renderBook(){
  document.querySelectorAll('.qTab').forEach(t=>t.classList.toggle('on',t.dataset.tab===qTab));
  const nt=nextTitle(Q.stars);
  qModal.querySelector('#qRankLine').textContent=
    titleFor(Q.stars)+' · '+Q.stars+'⭐'+(nt?('  →  '+nt.name+' at '+nt.need+'⭐'):'  · TOP RANK!');
  qModal.querySelector('#qRankBar').style.width=
    nt?Math.min(100,Math.round(Q.stars/nt.need*100))+'%':'100%';
  const B=qModal.querySelector('#qBody');
  if(qTab==='quests'){
    let h='';
    const act=QUESTS.filter(q=>Q.act[q.id]);
    const avail=QUESTS.filter(q=>isAvail(q));
    const done=QUESTS.filter(q=>Q.done[q.id]);
    if(act.length){h+='<p style="font-weight:900;color:#8F6FC7;margin:2px 0 8px">🔥 DOING NOW</p>';
      for(const q of act){
        const i=stepIdx(q);
        h+='<div class="qItem"><h3>'+q.icon+' '+q.name+'</h3><p>'+q.brief+'</p>';
        q.steps.forEach((s,si)=>{
          const done=si<i,cur=si===i;
          const need=stepNeed(s),have=Math.floor(stepProg(q,si));
          h+='<div class="qStep '+(done?'sdone':'')+'">'+(done?'✅':cur?'👉':'▫️')+' '+s.txt+
             (cur&&need>1?(' — '+have+'/'+need):'')+'</div>';
          if(cur&&need>1)h+=qBar(have,need);
        });
        h+='<div class="qAct"><button class="qTrackB" data-track="'+q.id+'">'+(Q.track===q.id?'🎯 Tracking':'🎯 Track')+'</button></div></div>';
      }}
    if(avail.length){h+='<p style="font-weight:900;color:#2ea363;margin:12px 0 8px">✨ READY TO START</p>';
      for(const q of avail){
        h+='<div class="qItem"><h3>'+q.icon+' '+q.name+'</h3><p>'+q.brief+'</p>'+
           '<p>Reward: '+'⭐'.repeat(q.stars||1)+(q.stick?(' + '+q.stick):'')+
           (q.giver&&q.giver!=='auto'&&q.giver!=='board'?(' · from '+q.giver):q.giver==='board'?' · Job Board':'')+'</p>'+
           '<div class="qAct"><button class="qGo" data-accept="'+q.id+'">✅ Start quest</button></div></div>';
      }}
    if(done.length){h+='<p style="font-weight:900;color:#9a92ab;margin:12px 0 8px">✅ DONE ('+done.length+')</p>';
      for(const q of done)h+='<div class="qItem done"><h3>'+q.icon+' '+q.name+' ✅</h3></div>';}
    if(!h)h='<p>Explore town — quests are coming!</p>';
    B.innerHTML=h;
  }else if(qTab==='daily'){
    rollDaily();
    let h='<p style="font-weight:900;color:#8F6FC7;margin:2px 0 8px">📋 TODAY\'S JOBS (new ones every day!)</p>';
    for(const did of Q.daily.ids){
      const d=DBYID[did],doneD=!!Q.daily.done[did];
      const have=Math.floor((Q.daily.prog&&Q.daily.prog[did])||0);
      h+='<div class="qItem'+(doneD?' done':'')+'"><h3>'+d.icon+' '+d.txt+(doneD?' ✅':'')+'</h3>'+
         (!doneD&&d.n>1?('<p>'+Math.min(have,d.n)+'/'+d.n+'</p>'+qBar(have,d.n)):'')+
         '<p>Reward: ⭐</p></div>';
    }
    h+='<p style="font-size:13px;color:#6b6280">Finish all 3 for a bonus ⭐!</p>';
    B.innerHTML=h;
  }else if(qTab==='stickers'){
    let h='<div class="qGrid">';
    const all=[];
    QUESTS.forEach(q=>{if(q.stick)all.push({em:q.stick,name:q.name});});
    PHOTO_SPOTS.forEach(s=>all.push({em:s.em,name:s.name,photo:s.id}));
    for(const s of all){
      const got=s.photo?!!Q.photo[s.photo]:!!Q.stick[s.em];
      h+='<div class="qStickerC'+(got?'':' lock')+'">'+(got?s.em:'❓')+'<small>'+(got?s.name:'???')+'</small></div>';
    }
    h+='</div>';
    B.innerHTML=h;
  }else{
    let h='<div class="qGrid">';
    for(const b of BADGES){
      const got=!!Q.badge[b.id];
      h+='<div class="qStickerC'+(got?'':' lock')+'">'+(got?b.icon:'🔒')+'<small>'+b.name+'</small></div>';
    }
    h+='</div>';
    B.innerHTML=h;
  }
}
function uiRefresh(){qBtn.textContent='📜 ⭐'+Q.stars;uiBadgeDot();}
function uiBadgeDot(){
  const anyAvail=QUESTS.some(q=>isAvail(q)&&(q.giver==='auto'));
  if(anyAvail&&doneCount()>0)qBtn.classList.add('qpulse');
}

window.QUEST_EV=ev;   // bridge: town-layer collectibles emit quest events

/* ---------------- boot ---------------- */
try{
  rollDaily();
  spawnGnomes();
  spawnPhotoSpots();
  spawnGnomeBuddy();
  initMarks();
  refreshLitter();
  refreshFetch();
  uiRefresh();
  lastTitle=titleFor(Q.stars);
  mark();flushSave();
}catch(e){}
})();
