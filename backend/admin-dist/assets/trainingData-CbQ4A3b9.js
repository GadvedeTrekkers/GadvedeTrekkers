const r="gt_training_content",g="gt_training_overrides",a="gt:training-updated";function p(){return typeof window<"u"}function s(){p()&&window.dispatchEvent(new Event(a))}function l(e,t){try{return JSON.parse(localStorage.getItem(e)||"null")??t}catch{return t}}function m(e,t){localStorage.setItem(e,JSON.stringify(t))}function n(e){return JSON.parse(JSON.stringify(e))}function w(e){const t=l(g,{});return!t||typeof t!="object"?e:e.map(i=>{const o=t[i.id];return o?.videos?{...i,videos:n(o.videos)}:i})}function h(e,t,i){const o=Array.isArray(e?.modules)&&e.modules.length>0?n(e.modules):w(n(t)),c=Array.isArray(e?.questions)&&e.questions.length>0?n(e.questions):n(i);return{modules:o,questions:c}}function T(){return a}function d(e=[],t=[]){const i=l(r,null);return h(i,e,t)}function f(e=[]){return d(e,[]).modules}function y(e=[]){return d([],e).questions}function S(e,t=[],i=[]){const o=h(e,t,i);return m(r,o),s(),o}function E(){localStorage.removeItem(r),s()}const k=[{id:"safety",title:"Safety Manual",icon:"🛡️",color:"#dc2626",description:"Fundamental safety protocols every trek leader must know.",estimatedTime:"45 min",sections:[{heading:"Pre-Trek Safety Checklist",content:`Before every trek, the leader must verify:
• Headcount confirmation matches registration list
• All participants carry a valid ID
• Emergency contact numbers collected for every trekker
• Weather forecast checked within 12 hours of departure
• Route briefing completed with all participants
• Medical conditions and allergies documented
• Group fitness level assessed — separate groups if needed
• Communication devices tested (phone + walkie-talkie if available)
• Rescue route identified and communicated to base`},{heading:"Route Safety Protocols",content:`During the trek:
• Leader walks at the FRONT, sweep volunteer walks at the REAR
• No trekker walks ahead of the leader at any point
• Group must stay within visible range (50 m maximum gap)
• Mandatory rest stops every 45–60 minutes or 2 km
• Flash-flood protocol: immediately move to high ground, never cross flowing streams
• Wildlife encounter: stay calm, do not run, back away slowly
• Night trekking: permitted only with minimum 1 headlamp per person + group torches
• Cliff edges: maintain 3 m clearance, no selfies near edges`},{heading:"Emergency Evacuation SOP",content:`If a participant is injured or unwell:
1. STOP the group immediately — do not continue the trek
2. Assess the severity — use the ABCDE protocol (Airway, Breathing, Circulation, Disability, Exposure)
3. Call emergency contacts: local hospital, base camp, and family
4. Do NOT move a suspected spinal/head injury patient
5. For conscious patients: keep warm, provide water (if no abdominal injury suspected)
6. Assign 2 trekkers to stay with the patient; send 2 to call for help
7. Document: time of incident, symptoms, actions taken
8. Initiate evacuation via the pre-identified rescue route`},{heading:"🎒 Leader Gear Checklist",content:`MANDATORY PERSONAL GEAR (leader must carry):
Navigation & Communication:
• Fully charged mobile phone + portable power bank (20,000 mAh)
• Offline maps downloaded (Google Maps / Maps.me)
• Emergency whistle (3 short blasts = distress signal)
• Walkie-talkie (if group > 20 or signal-dead zone route)

Safety & Shelter:
• Space/emergency thermal blanket × 2
• Headlamp + spare batteries
• Multi-tool or Swiss army knife
• Waterproof matches or lighter
• 15 m of 7 mm nylon rope (minimum)
• Rain poncho or rain jacket

Navigation & Documentation:
• Printed route map + key landmark list
• List of all participant names + emergency contacts
• First aid kit (see Medical module)
• Pen + small waterproof notebook

Food & Water:
• Personal water: minimum 2.5 litres + water purification tablets
• High-energy snacks: dry fruits, energy bars, glucose biscuits
• Extra rations for 1 additional meal (for group emergencies)

Clothing:
• Moisture-wicking base layer
• Warm mid-layer (fleece/insulated jacket)
• Waterproof outer shell
• Trekking shoes with ankle support (mandatory)
• Gloves and cap (even in summer at higher altitudes)`},{heading:"🧠 Leader Mindset",content:`Being a trek leader is a responsibility, not a title. The following mindset principles separate great leaders from average ones:

DECISION-MAKING UNDER PRESSURE:
• Slow down to speed up — in emergencies, breathe and assess before acting
• The group looks to you for calm — panic is contagious; so is composure
• When in doubt, the safest option is ALWAYS the right option
• Never let peer pressure or itinerary pressure override safety judgment

RESPONSIBILITY & AUTHORITY:
• You have the authority to turn back at any point — exercise it without hesitation
• You are responsible for every person from departure to return
• Never delegate safety decisions to participants, no matter their experience level
• Brief, clear, and repeated communication prevents 80% of incidents

HUMILITY & LEARNING:
• Admit what you don't know — guessing in the field costs lives
• Learn the route before leading it — recce walks are not optional
• Debrief after every trek: what went right, what could improve
• Listen to your sweep — they see the group from behind and notice who struggles

PEOPLE SKILLS:
• Know your group before departure — fitness level, fears, medical conditions
• Observe non-verbal cues: a quiet person may be struggling more than a complaining one
• Never embarrass a trekker in front of the group
• Celebrate small wins — a tough section completed deserves acknowledgement

LEADER'S MANTRA:
"Safety first. Summit second. Group always."`},{heading:"❌ What NOT To Do",content:`BEFORE THE TREK — NEVER:
✗ Start a trek without checking weather in the last 12 hours
✗ Accept participants without knowing their fitness level
✗ Skip the route briefing — even if the group has done the trek before
✗ Assume someone else is tracking headcount
✗ Share confidential participant data on public WhatsApp groups

DURING THE TREK — NEVER:
✗ Allow any trekker to go ahead of the leader
✗ Cross a flowing stream above knee height
✗ Ignore a trekker who says they feel unwell — stop immediately
✗ Let the group split into unsupervised sub-groups
✗ Take selfies or reels at cliff edges — ever
✗ Argue with a participant in front of the group
✗ Continue the trek if you are unsure of the route
✗ Allow trekkers to eat or drink unknown plants/berries
✗ Ignore thunder — the 30-second rule is absolute

IN AN EMERGENCY — NEVER:
✗ Panic visibly — you set the emotional tone
✗ Move a head/spine injury patient without immobilisation
✗ Cut or suck a snake bite
✗ Apply a tourniquet except for arterial bleeding
✗ Leave an injured trekker alone
✗ Continue the trek after a serious incident — the trek is over
✗ Lie to a participant or family member about the severity of a situation`}],videos:[{title:"Trek Safety Basics — Group Leadership",searchQuery:"trek group leader safety basics outdoor",description:"Core safety principles for outdoor group leaders."},{title:"Flash Flood Survival Guide",searchQuery:"flash flood survival trekking wilderness",description:"What to do when flash floods hit during a trek."},{title:"How to Read a Trail & Stay Found",searchQuery:"wilderness navigation stay found trekking",description:"Navigating without phone signal using terrain features."}]},{id:"medical",title:"Medical Kit & First Aid",icon:"🏥",color:"#0891b2",description:"What to carry and how to use it in the field.",estimatedTime:"40 min",sections:[{heading:"Mandatory Medical Kit Contents",content:`Every leader must carry the following:
WOUND CARE:
• Sterile gauze pads (10×10 cm) — 6 pieces
• Elastic bandage (crepe bandage) — 2 rolls
• Adhesive bandages (plasters) — assorted sizes ×20
• Antiseptic solution (Betadine / Savlon) — 100 ml
• Alcohol swabs — 10 pieces
• Sterile gloves — 2 pairs

MEDICATIONS (consult physician for prescription items):
• ORS packets — 10 sachets
• Paracetamol 500 mg — 10 tablets
• Antacid (Gelusil / Digene) — 10 tablets
• Antihistamine (Cetirizine) — 5 tablets
• Ibuprofen / Diclofenac — 6 tablets
• Eye drops (saline) — 1 bottle

TOOLS:
• Digital thermometer
• Scissors and tweezers
• Emergency whistle
• Space/emergency blanket — 2 pieces
• Torch with spare batteries`},{heading:"Snake Bite Protocol",content:`IMMEDIATE ACTIONS:
1. Keep the patient CALM and STILL — movement accelerates venom spread
2. Immobilise the bitten limb — keep it at or below heart level
3. Remove rings, watches, tight clothing near bite site
4. DO NOT cut, suck, or apply tourniquet
5. Clean the wound gently with water only
6. Mark the edge of swelling with a pen and note the time
7. Transport to hospital IMMEDIATELY — carry the patient, do not let them walk
8. If possible, photograph the snake (from a safe distance) for identification

AT HOSPITAL: inform doctors about bite time, snake description, symptoms`},{heading:"Altitude Sickness (AMS) Management",content:`Acute Mountain Sickness affects treks above 2,500 m.

MILD SYMPTOMS: headache, fatigue, dizziness, nausea
• Do NOT ascend further
• Rest at current altitude for 24 hours
• Hydrate: 3–4 litres of water per day
• Administer Paracetamol for headache

MODERATE/SEVERE SYMPTOMS: confusion, loss of coordination, breathlessness at rest
• DESCEND IMMEDIATELY — minimum 500 m descent
• Supplemental oxygen if available
• Evacuate to medical facility

PREVENTION: ascend slowly (300–500 m/day above 3,000 m), acclimatisation rest days`},{heading:"Fracture & Sprain Management",content:`FRACTURE (suspected or confirmed):
• Immobilise the limb using improvised splint (trekking pole + clothing)
• Apply padding around the splint for comfort
• Check circulation below fracture (warmth, pulse, colour)
• Do NOT attempt to realign bones
• Evacuate on a stretcher or improvised carry

SPRAIN:
Apply RICE protocol:
• Rest — stop activity immediately
• Ice — cold water or wet cloth (15–20 min)
• Compression — crepe bandage firmly (not tight)
• Elevation — raise the limb above heart level

• If weight-bearing is impossible, treat as fracture until X-ray confirms`}],videos:[{title:"Snake Bite First Aid — What To Do",searchQuery:"snake bite first aid wilderness treatment",description:"Step-by-step snake bite response in the field."},{title:"Improvised Splinting for Fractures",searchQuery:"improvised splinting fracture trekking pole wilderness",description:"Improvised splinting with trekking poles and clothing."},{title:"Wilderness First Aid — ABCDE Protocol",searchQuery:"wilderness first aid ABCDE primary survey",description:"Primary survey and patient assessment in the field."},{title:"Box Breathing — Calm a Panic Attack",searchQuery:"box breathing panic attack calm technique",description:"Box breathing and grounding techniques for panicking trekkers."}]},{id:"rope",title:"Rope & Knot Skills",icon:"🪢",color:"#7c3aed",description:"Essential knots, rope rescue, and anchoring techniques.",estimatedTime:"60 min",videos:[{title:"Figure-8 Knot",youtubeId:"Q-2LzFHu7vM"},{title:"Bowline Knot",youtubeId:"aO85gKmhbZ4"},{title:"Clove Hitch",youtubeId:"q4gkqCpkfNs"},{title:"Rope Rescue Technique",youtubeId:"zVtb-5tO7J4"}],sections:[{heading:"The Four Essential Knots",content:`FIGURE-8 FOLLOW-THROUGH (Stopper Knot)
• Use: Attaching rope to harness or anchor; most secure end knot
• Steps: Form a figure-8 loop → pass the tail through the harness → retrace the 8 exactly
• Load bearing: Yes — rated for body weight
• Check: Both strands run parallel with no crossings

BOWLINE (Fixed Loop Knot)
• Use: Rescue loops, attaching rope to fixed points, life-saving in emergency
• Steps: Form a small loop → rabbit comes up through the hole → goes around the tree → back down the hole
• Strength: ~75% of rope tensile strength
• Remember: "Rabbit up the hole, around the tree, back down the hole"

CLOVE HITCH (Quick Adjustable Knot)
• Use: Tying rope to trees, poles, anchors quickly
• Steps: Two half-hitches around a pole
• Advantage: Easily adjustable under load; self-tightening
• Limitation: Can slip if load direction changes frequently

SQUARE (REEF) KNOT (Joining Two Ropes)
• Use: Joining two ropes of equal diameter; bandage tying
• Steps: Right over left → left over right
• WARNING: Not load-bearing for rescue — use double fisherman's knot instead
• Mnemonic: "Right over left, left over right — makes the knot tidy and tight"`},{heading:"Rope Rescue Techniques",content:`SIMPLE LOWER (Lowering an injured trekker):
1. Anchor rope securely to a tree or rock (double anchor preferred)
2. Tie Figure-8 loop around trekker's chest/harness
3. Create friction: wrap rope 3× around tree or use carabiner
4. Lower slowly with one person controlling rope tension
5. Rescuer spotting from below guides the patient

IMPROVISED HARNESS (when no harness available):
• Use 3–4 m of rope
• Create a loop around waist and two leg loops
• Connect all loops at the front with a separate rope and carabiner
• Never use this for falls — only for controlled lowering

HAULING SYSTEM (extracting someone from a gorge/hole):
• Use a 3:1 Z-pulley system
• Requires: 2 carabiners, 1 pulley or smooth rope pass
• Three people pulling = lifts weight equal to one person

SAFETY RULES:
• Never use rope older than 5 years for rescue
• Inspect rope before every trek: check for cuts, fraying, stiffness
• Retire rope after any shock load (fall)`}]},{id:"tent",title:"Tent Pitching & Camp Setup",icon:"⛺",color:"#059669",description:"Setting up camp correctly in all weather conditions.",estimatedTime:"30 min",videos:[{title:"Tent Setup — Step by Step",youtubeId:"4JBfADMCOI0"},{title:"Camping in Rain & Wind",youtubeId:"Bg_JcW0R7pY"}],sections:[{heading:"Site Selection",content:`Choose your campsite carefully:
✅ GOOD SITES:
• Flat or gently sloping ground (slight slope for drainage)
• Natural windbreak (boulders, tree line) on windward side
• At least 60 m from water sources (rivers, streams, lakes)
• Away from animal tracks and dry streambeds
• Protected from direct lightning exposure (avoid hilltops, lone trees)

❌ AVOID:
• Dry riverbeds (flash flood risk)
• Hilltops and ridges (lightning, wind exposure)
• Directly under large dead trees (falling branch risk)
• Depressions where cold air pools overnight`},{heading:"Standard Tent Setup (2-Person Dome Tent)",content:`SETUP STEPS:
1. Lay groundsheet first — shiny side up if waterproof
2. Unpack and lay inner tent flat — check orientation (door away from prevailing wind)
3. Assemble poles — slot into sleeves or clips without forcing
4. Raise the tent — lift from centre, insert pole ends into grommets
5. Stake out — drive pegs at 45° outward angle, starting from corners
6. Attach fly sheet — ensure it does NOT touch the inner tent
7. Tension guy ropes — taut but not so tight they pull pegs
8. Check: ground sheet tucked under tent (not poking out to channel water in)

INTERIOR SETUP:
• Sleeping bags: foot toward door (easy exit in emergency)
• Wet gear: in porch/vestibule, never in sleeping area
• Torch: within arm's reach of sleeping position`},{heading:"Wind & Rain Management",content:`HIGH WIND PROTOCOL:
• Add extra guy ropes — minimum 6 anchor points for dome tent
• Lower the tent profile if possible
• Weight ground-level corners with rocks inside corners of groundsheet
• If wind exceeds 60 km/h: evacuate tent, shelter in rock outcrop or tree line

HEAVY RAIN PROTOCOL:
• Dig a shallow drainage trench (5 cm deep) around tent perimeter
• Ensure fly sheet is fully deployed and tensioned
• Never open tent zips facing the rain — always turn tent opening away from rain direction
• Check guy ropes every 2 hours in sustained rain (ropes shrink when wet, tighten them)
• If pooling begins inside: move to higher ground immediately

MORNING TENT CARE:
• Shake out condensation before packing
• Never pack a wet tent into its bag for more than 12 hours — dry at next opportunity`}]},{id:"scenarios",title:"Worst-Case Scenarios",icon:"⚠️",color:"#ea580c",description:"How to handle the most dangerous situations on a trek.",estimatedTime:"50 min",sections:[{heading:"Lost Trekker Protocol",content:`IMMEDIATELY when someone goes missing:
1. STOP the entire group — do not continue the trek
2. Last seen point: note the exact location and time
3. Call out loudly — use whistle signal: 3 short blasts = distress signal
4. Send a search party of 2 (never 1 alone) to check 200 m radius
5. Keep 4 trekkers at the last known point as anchor
6. After 20 minutes: call local forest/mountain rescue and police
7. Share GPS coordinates or landmark description with rescue services

STAY FOUND PROTOCOL (teach to all trekkers before departure):
• If lost: STOP, THINK, OBSERVE, PLAN (S.T.O.P.)
• Stay in one place and blow whistle every 5 minutes
• Do not wander further — rescuers search systematically from last known point`},{heading:"Panic Attack / Psychological Distress",content:`Signs of panic attack: rapid breathing, inability to move, crying, irrational behaviour

IMMEDIATE RESPONSE:
1. Separate from the group (gently) — crowds worsen panic
2. Kneel to their eye level — calm, low, steady voice only
3. Box breathing: "Breathe in for 4 counts... hold 4... out for 4... hold 4"
4. Physical anchor: place their hands on a solid surface (ground, rock)
5. Avoid: "calm down", "it's nothing", false promises
6. Do NOT leave them alone — assign one calm trekker as companion

IF PANIC DOES NOT SUBSIDE IN 10 MINUTES:
• Begin assisted descent immediately
• Contact family/emergency contact
• Do not continue with the group trek

ACROPHOBIA (Fear of Heights):
• Never force a trekker — acknowledge the fear as valid
• Offer route alternative if possible
• If unavoidable: face trekker toward the cliff, not away; focus on each step`},{heading:"Lightning & Thunderstorm Protocol",content:`When you hear thunder or see lightning:
RULE: 30-30 RULE — If thunder follows lightning in under 30 seconds, seek shelter immediately.

IMMEDIATE ACTIONS:
1. Descend below the treeline immediately
2. Move away from summits, ridges, open fields
3. Avoid lone trees, tall trees, metal poles, wire fences
4. Separate group members — space 10 m apart (lightning can jump between people)
5. Lightning crouch: feet together, crouch low, arms around knees — do NOT lie flat
6. Remove trekking poles (metal) and keep 3 m away from group
7. Stay off mobile phones except for emergency calls

Wait 30 minutes after last thunder/lightning before resuming.`},{heading:"Dehydration & Heat Exhaustion",content:`DEHYDRATION WARNING SIGNS:
• Dark yellow urine, infrequent urination
• Headache, dizziness, cramps
• Confusion (severe dehydration)

TREATMENT:
• Stop activity and rest in shade
• Administer ORS solution: 1 sachet in 1 litre water, sip slowly
• Cool the body: wet cloth on neck, wrists, head
• Severe: evacuate to medical facility if confusion persists

HEAT EXHAUSTION vs HEAT STROKE:
• Heat exhaustion: heavy sweating, pale skin, cool/clammy — treat as above
• Heat stroke (EMERGENCY): NO sweating, hot/red/dry skin, confusion, loss of consciousness
  → Heat stroke: CALL EMERGENCY SERVICES IMMEDIATELY
  → Cool rapidly: pour water over skin, fan vigorously, ice packs under arms and groin
  → This is life-threatening — evacuate in 30 minutes or less`}]}],u=[{id:1,module:"safety",question:"A trekker slips near a cliff edge but is uninjured. What is your FIRST action?",options:[{text:"Continue the trek — no injury occurred",weight:0},{text:"Stop the group, assess the area for safety, conduct a safety briefing before continuing",weight:5},{text:"Ask the trekker if they want to continue",weight:2},{text:"Note the incident and continue",weight:1}]},{id:2,module:"safety",question:"Your group is 2 km from the summit when a flash flood warning siren sounds in the valley below. You should:",options:[{text:"Rush to the summit before the water rises",weight:0},{text:"Immediately move the group to higher ground and away from all drainage channels",weight:5},{text:"Wait 10 minutes to observe the situation",weight:1},{text:"Split the group — faster members go summit, slower members wait",weight:0}]},{id:3,module:"safety",question:"What is the maximum gap permitted between any two trekkers in your group?",options:[{text:"As long as everyone reaches camp by dark",weight:0},{text:"100 metres",weight:2},{text:"50 metres — within visible range",weight:5},{text:"10 metres",weight:3}]},{id:4,module:"safety",question:"A trekker wants to take a selfie leaning over a cliff edge for a better angle. You:",options:[{text:"Allow it if they look confident",weight:0},{text:"Firmly prohibit it and explain the 3 m clearance rule",weight:5},{text:"Ask them to be careful",weight:1},{text:"Take the photo yourself from a safe distance",weight:3}]},{id:5,module:"safety",question:"During a night trek, three trekkers don't have headlamps. What do you do?",options:[{text:"Continue — moonlight is sufficient",weight:0},{text:"Halt the night section; proceed only in daylight or when proper lights are sourced",weight:5},{text:"Share your headlamp by taking turns",weight:2},{text:"Tie them together with a rope and lead them",weight:1}]},{id:6,module:"medical",question:"A trekker is bitten by a snake. They are conscious and the bite is on the forearm. First action?",options:[{text:"Cut the bite mark and suck out the venom",weight:0},{text:"Apply a tight tourniquet above the bite",weight:0},{text:"Immobilise the arm, keep it below heart level, calm the patient, and begin evacuation to hospital",weight:5},{text:"Wash the wound with antiseptic and continue the trek",weight:0}]},{id:7,module:"medical",question:"A trekker at 3,200 m has a throbbing headache, nausea, and mild dizziness. This is most likely:",options:[{text:"Dehydration — give ORS and continue ascending",weight:2},{text:"Acute Mountain Sickness (AMS) — do NOT ascend further, rest for 24 hours",weight:5},{text:"Vertigo — unrelated to altitude, continue normally",weight:0},{text:"Hunger — feed them and continue",weight:1}]},{id:8,module:"medical",question:"A trekker's ankle is swollen after a fall. They can put some weight on it. You should:",options:[{text:"Apply RICE (Rest, Ice, Compression, Elevation) and descend if needed",weight:5},{text:"Massage the joint vigorously to restore circulation",weight:0},{text:"Continue the trek — if they can walk, it's just a sprain",weight:1},{text:"Apply a tourniquet",weight:0}]},{id:9,module:"medical",question:"A trekker is NOT sweating despite extreme heat, has hot dry red skin, and is confused. This is:",options:[{text:"Heat exhaustion — give ORS and rest",weight:1},{text:"Heat stroke — LIFE-THREATENING emergency requiring immediate cooling and evacuation",weight:5},{text:"Dehydration — not serious at this stage",weight:0},{text:"Sunburn reaction — apply sunscreen",weight:0}]},{id:10,module:"medical",question:"What is the correct ORS preparation ratio?",options:[{text:"1 sachet per 500 ml water",weight:2},{text:"1 sachet per 1 litre water",weight:5},{text:"2 sachets per 1 litre water",weight:1},{text:"Dissolve in any amount of water to taste",weight:0}]},{id:11,module:"rope",question:"Which knot is BEST for attaching a rope to a trekker's harness for rescue lowering?",options:[{text:"Square knot",weight:0},{text:"Figure-8 follow-through",weight:5},{text:"Clove hitch",weight:2},{text:"Overhand knot",weight:1}]},{id:12,module:"rope",question:"A trekker is stranded in a 4 m deep gorge — uninjured but cannot climb. You should:",options:[{text:"Throw the rope and ask them to hold on while you pull",weight:2},{text:"Tie a bowline loop at the end, lower it to them, and set up a Z-pulley 3:1 hauling system",weight:5},{text:"Descend into the gorge and carry them on your back",weight:1},{text:"Wait for help — do not attempt rescue without professional team",weight:0}]},{id:13,module:"rope",question:"You need to quickly attach a rope to a tree as an anchor. The best knot is:",options:[{text:"Bowline",weight:3},{text:"Figure-8",weight:3},{text:"Clove hitch — quick and adjustable",weight:5},{text:"Square knot",weight:0}]},{id:14,module:"rope",question:"When should a rope be retired from rescue use?",options:[{text:"After 10 years",weight:1},{text:"After any shock load / fall, or after 5 years of use",weight:5},{text:"Only when it visibly snaps",weight:0},{text:"Every 2 years regardless of use",weight:3}]},{id:15,module:"rope",question:"What is the mnemonic for tying a bowline knot?",options:[{text:"Rabbit up the hole, around the tree, back down the hole",weight:5},{text:"Right over left, left over right",weight:0},{text:"Two half-hitches around a post",weight:0},{text:"Loop, twist, pull through",weight:2}]},{id:16,module:"tent",question:"You need to camp near a river in monsoon. The SAFEST campsite is:",options:[{text:"On the riverbank — easy water access",weight:0},{text:"In a depression near the river — protected from wind",weight:0},{text:"At least 60 m from the river on flat elevated ground",weight:5},{text:"On the hilltop above the river",weight:1}]},{id:17,module:"tent",question:"During heavy rain your tent is pooling water inside. You should:",options:[{text:"Place towels on the floor and continue sleeping",weight:0},{text:"Immediately dig a drainage trench around the tent and move to higher ground if pooling continues",weight:5},{text:"Open the tent zip to drain water out",weight:1},{text:"Zip the tent tighter",weight:0}]},{id:18,module:"tent",question:"You arrive at camp in high wind. Correct action for tent stakes is:",options:[{text:"Push stakes straight down vertically",weight:1},{text:"Drive stakes at 45° outward angle away from tent — increases pull-out resistance",weight:5},{text:"Place rocks on the stakes",weight:2},{text:"Skip staking — the tent body weight holds it down",weight:0}]},{id:19,module:"tent",question:"The fly sheet is touching the inner tent wall in light rain. This means:",options:[{text:"Normal — they should touch for warmth",weight:0},{text:"The tent will leak — re-tension the fly sheet so it does NOT touch the inner",weight:5},{text:"The fly sheet needs replacement",weight:2},{text:"It's fine as long as rain is light",weight:1}]},{id:20,module:"tent",question:"Where should sleeping bags be oriented inside a tent?",options:[{text:"Head toward door for ventilation",weight:1},{text:"Foot toward door — allows quick exit in emergency",weight:5},{text:"Perpendicular to the door",weight:0},{text:"It doesn't matter",weight:2}]},{id:21,module:"scenarios",question:"A trekker goes missing. The group last saw them 30 minutes ago. Your first action is:",options:[{text:"Continue to camp and report missing when you arrive",weight:0},{text:"Stop the group, note last seen location and time, send a pair to search 200 m radius, and call rescue if not found in 20 minutes",weight:5},{text:"Ask other trekkers to search alone in different directions",weight:1},{text:"Call the missing person's phone",weight:2}]},{id:22,module:"scenarios",question:"Teach the S.T.O.P. protocol to trekkers. What does it stand for?",options:[{text:"Safety, Trek, Observe, Plan",weight:2},{text:"Stop, Think, Observe, Plan",weight:5},{text:"Search, Track, Orient, Proceed",weight:1},{text:"Stay, Text, Observe, Proceed",weight:1}]},{id:23,module:"scenarios",question:"A trekker has a panic attack on a narrow ridge. The CORRECT response is:",options:[{text:"Tell them to calm down — it's just in their head",weight:0},{text:"Firmly guide them forward — momentum helps",weight:0},{text:"Separate from group, kneel at eye level, use box breathing, physical anchor, calm voice",weight:5},{text:"Leave them with another trekker and continue to get help",weight:1}]},{id:24,module:"scenarios",question:"Thunder follows lightning by 15 seconds. You are on an open ridge. You:",options:[{text:"Run to the nearest lone tree for shelter",weight:0},{text:"Continue trekking — storm is still far away",weight:0},{text:"Immediately descend below the treeline, separate the group 10 m apart, lightning crouch",weight:5},{text:"Shelter under a rock overhang",weight:3}]},{id:25,module:"scenarios",question:"The whistle distress signal in international trekking protocol is:",options:[{text:"1 long blast",weight:0},{text:"3 short blasts",weight:5},{text:"2 long blasts",weight:1},{text:"5 short blasts",weight:1}]},{id:26,module:"safety",question:"You discover a trekker has a severe penicillin allergy. They are showing signs of anaphylactic shock. You:",options:[{text:"Give them antihistamine tablets from your kit",weight:2},{text:"Lay them flat with legs elevated, keep airway clear, call emergency services immediately — epinephrine auto-injector if available",weight:5},{text:"Give them water and watch for improvement",weight:0},{text:"Help them walk slowly to the nearest road",weight:0}]},{id:27,module:"medical",question:"A trekker falls and is found unconscious. Using ABCDE, 'A' stands for:",options:[{text:"Altitude assessment",weight:0},{text:"Airway — ensure it is open and unobstructed",weight:5},{text:"Appearance",weight:0},{text:"Alertness",weight:2}]},{id:28,module:"rope",question:"The square knot is rated for which use in the field?",options:[{text:"Load-bearing rescue operations",weight:0},{text:"Tying two ropes of equal diameter and bandage binding ONLY",weight:5},{text:"Anchoring to trees",weight:1},{text:"Attaching to harness",weight:0}]},{id:29,module:"tent",question:"Your tent has been fully wet for 14+ hours. You should:",options:[{text:"Dry the tent at the next opportunity before extended storage",weight:5},{text:"Pack it immediately — wet storage prevents mould for up to a week",weight:0},{text:"It doesn't matter for modern tents",weight:0},{text:"Shake it out and pack normally",weight:2}]},{id:30,module:"scenarios",question:"At altitude, a trekker shows confusion, cannot walk in a straight line, and is breathless at rest. You:",options:[{text:"Give Paracetamol and rest overnight",weight:0},{text:"IMMEDIATE descent of minimum 500 m, administer supplemental oxygen if available, evacuate to hospital",weight:5},{text:"Increase water intake and monitor for 4 hours",weight:1},{text:"Administer Ibuprofen and continue next day if improved",weight:0}]},{id:31,module:"safety",question:"How often should you stop for mandatory rest on a standard trek?",options:[{text:"Every 2 hours or when someone asks",weight:1},{text:"Every 45–60 minutes or every 2 km",weight:5},{text:"Only at the halfway point",weight:1},{text:"Every 3 hours",weight:2}]},{id:32,module:"safety",question:"A trekker wants to cross a waist-deep stream after recent rainfall. You:",options:[{text:"Allow it if they are a strong swimmer",weight:0},{text:"Do not cross — wait for water to recede or find alternate route",weight:5},{text:"Cross one by one holding hands in a chain",weight:1},{text:"Allow the group to vote on whether to cross",weight:0}]},{id:33,module:"medical",question:"A trekker has a wound that is bleeding steadily. The correct first response is:",options:[{text:"Apply antiseptic directly",weight:2},{text:"Apply direct pressure with sterile gauze for 10–15 minutes, then bandage",weight:5},{text:"Elevate the limb above heart level and wait for bleeding to stop naturally",weight:3},{text:"Apply tourniquet immediately",weight:1}]},{id:34,module:"scenarios",question:"It is 4 PM and your group is still 3 hours from camp. The trail is unfamiliar at night. You:",options:[{text:"Push forward — camp before midnight",weight:0},{text:"Set up camp at a safe site nearby and continue in the morning",weight:5},{text:"Split the group — faster members go ahead to prepare camp",weight:0},{text:"Send a volunteer ahead to mark the trail with torch",weight:2}]},{id:35,module:"tent",question:"Minimum clearance from a lone tree during a thunderstorm is:",options:[{text:"1 metre",weight:0},{text:"5 metres",weight:1},{text:"Use your own judgment based on tree size",weight:0},{text:"Avoid lone trees entirely — seek forest/treeline instead",weight:5}]},{id:36,module:"medical",question:"How many sterile gauze pads should a leader's medical kit contain minimum?",options:[{text:"2 pieces",weight:1},{text:"6 pieces",weight:5},{text:"10 pieces",weight:4},{text:"1 roll",weight:2}]},{id:37,module:"rope",question:"The 3:1 Z-pulley system requires minimum how many carabiners?",options:[{text:"1",weight:0},{text:"2",weight:5},{text:"3",weight:3},{text:"4",weight:2}]},{id:38,module:"safety",question:"Who should walk at the REAR of the group on a trek?",options:[{text:"The weakest trekker",weight:1},{text:"A designated sweep volunteer who tracks everyone",weight:5},{text:"The leader",weight:0},{text:"Whoever wants to walk slowly",weight:0}]},{id:39,module:"scenarios",question:"The 30-30 rule for lightning states:",options:[{text:"Wait 30 minutes after rain and 30 minutes before resuming",weight:1},{text:"If thunder follows lightning in under 30 seconds, seek shelter; wait 30 minutes after last thunder before continuing",weight:5},{text:"30 metres from trees and 30 metres from water",weight:0},{text:"30 seconds warning for group to crouch, 30 seconds after lightning to stand",weight:1}]},{id:40,module:"medical",question:"For a suspected spinal injury after a fall, you should:",options:[{text:"Roll the patient to check for back wounds",weight:0},{text:"Sit them up slowly to assess pain level",weight:0},{text:"Do NOT move the patient; immobilise head and neck in position found; call emergency services",weight:5},{text:"Carry the patient on your back to the nearest road",weight:0}]},{id:41,module:"safety",question:"A wildlife animal (bear/leopard) is spotted 100 m away on the trail ahead. You:",options:[{text:"Make loud noise to scare it away and proceed",weight:1},{text:"Run in the opposite direction",weight:0},{text:"Stay calm, group together, back away slowly without making eye contact, do not run",weight:5},{text:"Stand still and wait for it to leave",weight:3}]},{id:42,module:"medical",question:"Dark yellow urine in a trekker indicates:",options:[{text:"Normal hydration — urine concentrates at altitude",weight:0},{text:"Dehydration — increase fluid intake immediately",weight:5},{text:"Vitamin B supplements in their system",weight:2},{text:"Kidney issue — no action needed on trek",weight:0}]},{id:43,module:"rope",question:"Before every trek, you should inspect the rescue rope for:",options:[{text:"Only check if it is dry",weight:0},{text:"Cuts, fraying, stiffness, and confirm age under 5 years",weight:5},{text:"Colour fading — faded ropes are weaker",weight:0},{text:"Weight — heavier ropes are stronger",weight:0}]},{id:44,module:"scenarios",question:"A trekker with acrophobia (fear of heights) refuses to cross a narrow ridge. You:",options:[{text:"Tell them it is safe and they must cross — no other option",weight:0},{text:"Leave them behind with another trekker while the group continues",weight:2},{text:"Acknowledge the fear as valid, check for alternate route, if unavoidable: face them toward the cliff and focus on each single step",weight:5},{text:"Distract them with conversation and walk them across quickly",weight:1}]},{id:45,module:"safety",question:"Pre-trek, you must collect emergency contacts for:",options:[{text:"Only solo trekkers",weight:0},{text:"Only first-time trekkers",weight:0},{text:"Every participant without exception",weight:5},{text:"Participants over 40 years old",weight:1}]},{id:46,module:"tent",question:"Guy ropes should be tensioned as:",options:[{text:"As tight as possible for maximum stability",weight:1},{text:"Taut but not pulling pegs — ropes shrink when wet and over-tensioning can pull pegs or tear tent",weight:5},{text:"Loose — tighter tension in wind",weight:2},{text:"Tension doesn't matter if stakes are deep",weight:0}]},{id:47,module:"scenarios",question:"A trekker receives a snake bite. You are 4 hours from hospital. What should you NOT do?",options:[{text:"Immobilise the bitten limb",weight:0},{text:"Keep the patient calm and still",weight:0},{text:"Mark the swelling edge and time",weight:0},{text:"Apply a tight tourniquet to stop venom spread",weight:5}]},{id:48,module:"medical",question:"The RICE protocol for sprains stands for:",options:[{text:"Rest, Ice, Compress, Elevate",weight:5},{text:"Reduce, Isolate, Cool, Elevate",weight:2},{text:"Rest, Immobilise, Cold pack, Evacuate",weight:2},{text:"Recover, Ice, Cover, Exercise",weight:0}]},{id:49,module:"safety",question:"The pre-trek weather forecast should be checked within:",options:[{text:"48 hours of departure",weight:2},{text:"12 hours of departure",weight:5},{text:"A week before — to plan alternatives",weight:1},{text:"At the trailhead on the day",weight:3}]},{id:50,module:"scenarios",question:"Box breathing for managing panic involves:",options:[{text:"Breathe in 4 counts, hold 4, out 4, hold 4 — repeat",weight:5},{text:"Breathe deeply 10 times as fast as possible",weight:0},{text:"Breathe in 2 counts, out 6 counts",weight:2},{text:"Hold breath for 30 seconds then breathe normally",weight:0}]}];u.reduce((e,t)=>e+Math.max(...t.options.map(i=>i.weight)),0);const b=k,x=u;function A(){return f(b)}function v(){return y(x)}function I(e=v()){return e.reduce((t,i)=>t+Math.max(...i.options.map(o=>o.weight)),0)}export{b as D,x as a,T as b,A as c,v as d,I as e,d as g,E as r,S as s};
