import{j as t}from"./main-ssMQpn5-.js";import{M as i}from"./ManagePage-Cg7lVuku.js";import"./useAdminData-D4SZ_EsQ.js";import"./activityLogStorage-iRw8ezig.js";import"./InfoTooltip-D-ZbWhaY.js";const a=[{key:"sortOrder",label:"Display Order",type:"number",col:3,placeholder:"1 = first"},{key:"icon",label:"Icon (Emoji)",col:2,placeholder:"🏔️"},{key:"title",label:"Destination Title",required:!0,col:7,placeholder:"Delhi – Manali – Amritsar – Agra"},{key:"subtitle",label:"Subtitle / Tag",col:8,placeholder:"9-Day College Tour — Culture, Spirituality & Adventure"},{key:"duration",label:"Duration",col:4,placeholder:"9 Days"},{key:"bestFor",label:"Best For (colleges/stream)",col:8,placeholder:"Engineering, Management & Arts Colleges"},{key:"imageGallery",label:"Destination Images",type:"imageGallery",col:12},{key:"highlights",label:"Trip Highlights (one per line)",type:"textarea",col:12,placeholder:`Delhi's heritage landmarks — Qutub Minar, Lotus Temple, India Gate
Amritsar's Golden Temple & Wagah Border ceremony`,aiPrompt:e=>`Write 5–7 trip highlight bullet points for an industrial visit / college tour to: "${e.title||"[Destination]"}" (${e.duration||"[Duration]"}).

Best for: ${e.bestFor||"college students"}

Format: one highlight per line (no bullets or numbering), each 10–15 words.
Focus on: industry exposure, famous landmarks, unique experiences, learning outcomes.

Output only the lines, nothing else.`},{key:"industries",label:"Industry Sectors Covered (one per line)",type:"textarea",col:6,placeholder:`Heritage & Cultural Tourism
Adventure & Eco-Tourism
Hospitality`,aiPrompt:e=>`List 4–6 industry sectors that students would be exposed to on a college tour to: "${e.title||"[Destination]"}".

Best for: ${e.bestFor||"college students"}

Format: one sector per line, 3–5 words each.
Example: Heritage & Cultural Tourism

Output only the sector names, nothing else.`},{key:"pricingSlabs",label:"Pricing Slabs (GroupRange|Price|Note, one per line)",type:"textarea",col:6,placeholder:`20 – 29|14500|Smaller groups
30 – 39|13500|Standard group
40 – 49|13000|Better saving
50+||Custom pricing — contact us`,helpText:`FORMAT: GroupRange|PricePerHead|Note
Leave price blank for 'Contact us' pricing.
Example:
20 – 29|14500|Smaller groups
30 – 39|13500|Standard group
50+||Custom pricing — contact us`},{key:"includes",label:"What's Included (one per line)",type:"textarea",col:6,placeholder:`Round-trip train travel (Pune → Delhi → Pune)
Bus travel between cities
Hotel stays
Daily breakfast & dinner`,aiPrompt:e=>`List 5–7 items included in a college tour package to: "${e.title||"[Destination]"}" (${e.duration||"[Duration]"}).

Format: one item per line.
Cover: transport, accommodation, meals, guide, activities, certificates.

Output only the list items, no bullets or numbering.`},{key:"excludes",label:"What's NOT Included (one per line)",type:"textarea",col:6,placeholder:`Meals during travel
Adventure activities (paid)
Entry fees at monuments
Personal expenses`},{key:"itinerary",label:"Day-wise Itinerary (Day|Title|Activity, one per line)",type:"textarea",col:12,placeholder:`Day 1|Pune → Delhi by train|Depart Pune by pre-booked train
Day 1||Overnight journey towards Delhi`,helpText:"FORMAT: Day N|Day title|Activity on the first line of each day. More activities for that day: Day N||Activity",aiPrompt:e=>`Write a day-by-day itinerary for a college tour to: "${e.title||"[Destination]"}" — ${e.duration||"[Duration]"}.

FORMAT (one activity per line):
Day N|Day title|First activity
Day N||Next activity

Example:
Day 1|Pune → Delhi by train|Depart Pune by pre-booked train
Day 1||Overnight journey towards Delhi
Day 1||Meals: none (train journey)

Write a complete realistic itinerary covering: ${e.title||"[Destination]"}. Include transport, meals, sightseeing, and overnight stays. Output only the lines in the exact format — no headings, no extra text.`}],r={sortOrder:"",icon:"🏛️",title:"",subtitle:"",duration:"",bestFor:"",imageGallery:"[]",highlights:"",industries:"",pricingSlabs:"",includes:"",excludes:"",itinerary:"",active:!0};function c(){return t.jsx(i,{title:"Industrial Visits",icon:"🎓",storageKey:"gt_iv",fields:a,defaultForm:r,seedData:[]})}export{c as default};
