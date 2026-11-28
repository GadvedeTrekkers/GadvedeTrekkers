import{j as d,s as l,q as u,t as p,C as h}from"./main-ssMQpn5-.js";import{M as y}from"./ManagePage-Cg7lVuku.js";import"./useAdminData-D4SZ_EsQ.js";import"./activityLogStorage-iRw8ezig.js";import"./InfoTooltip-D-ZbWhaY.js";const g=e=>{if(!e)return"";const a=new Date(e);return Number.isNaN(a.getTime())?new Date(`${e} GMT+0530`):a},m=e=>{const a=g(e);return a&&!Number.isNaN(a.getTime())?a.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):e},k=["Guide charges","Breakfast","Lunch","Dinner","Tea","Travel from Pune","Travel from Mumbai","Travel from Kasara","Tent stay","Forest entry fees","First aid","E-certificate","WhatsApp group coordination"],b=["Personal expenses","Travel till pickup point","Mineral water","Soft drinks","Extra meals","Medical expenses","Emergency evacuation","Anything not mentioned in inclusions"],f=["2 litres water","Trekking shoes","Rainwear","Torch","Extra clothes","Cap","Jacket","Personal medicines","Energy snacks","Identity proof","Haversack","Sunscreen"],T=["GD75|Save on group of 7 and more","GD50|Save on group of 5 and more","EARLY75|Early Booking Discount"],v=[{key:"sortOrder",label:"Display Order",type:"number",col:4,placeholder:"1 = first on page"},{key:"name",label:"Trek Name",required:!0,col:8},{key:"subtitle",label:"Subtitle / Tagline",col:12,placeholder:"Medieval Hill Fort — 4650 Ft | Konkan Kada | Kedareshwar Cave"},{key:"fortType",label:"Fort / Trek Type",col:4,placeholder:"Ancient Hill Fort"},{key:"region",label:"Region",required:!0,type:"select",options:["mumbai","pune"],col:4},{key:"hubSlug",label:"Catalog hub",type:"select",options:h.map(e=>({value:e.slug,label:e.name})),col:4},{key:"destination",label:"Destination",placeholder:"Lonavala, Maharashtra",col:4},{key:"category",label:"Category label",placeholder:"Pune Weekend",col:4},{key:"location",label:"Location",required:!0,placeholder:"Pune, Maharashtra",col:4},{key:"difficulty",label:"Difficulty",required:!0,type:"select",options:["Easy","Medium","Hard"],col:4},{key:"enduranceLevel",label:"Endurance Level",type:"select",options:["Easy","Medium","Hard"],col:4},{key:"duration",label:"Duration",required:!0,placeholder:"1 Night 1 Day",col:4},{key:"altitude",label:"Altitude",placeholder:"1424m",col:4},{key:"price",label:"Price (₹)",required:!0,type:"number",placeholder:"1449",col:4},{key:"originalPrice",label:"Original Price (₹)",type:"number",placeholder:"1899",col:4},{key:"rating",label:"Rating (1-5)",type:"number",placeholder:"4.9",col:4},{key:"reviews",label:"Review Count",type:"number",placeholder:"190",col:4},{key:"imageGallery",label:"Trek Banner Images",type:"imageGallery",col:12},{key:"itineraryPdfUrl",label:"Itinerary PDF URL",placeholder:"/itineraries/trek-name.pdf or https://...",col:12},{key:"trekDateBatches",label:"Trek Dates & WhatsApp Group Links",type:"trekDates",col:12},{key:"baseVillage",label:"Base Village",placeholder:"Pachnai Village",col:4},{key:"regionArea",label:"Region / Area",placeholder:"Igatpuri, Ahmednagar, Junnar",col:4},{key:"climbTime",label:"Climb Time (one way)",placeholder:"3 hours uphill",col:4},{key:"distance",label:"Distance (one way)",placeholder:"5 km from Pachnai",col:4},{key:"drivePune",label:"Drive from Pune",placeholder:"170 km one way",col:4},{key:"wildlifeSanctuary",label:"Wildlife Sanctuary",placeholder:"Kalsubai Harishchandragad WS",col:4},{key:"about",label:"About (Overview)",type:"textarea",col:12,aiPrompt:e=>`Write a detailed, SEO-friendly overview for ${e.name||"[Trek Name]"}, a ${e.difficulty||"Medium"} difficulty trek in ${e.location||"[Location]"}, Maharashtra, India.

Trek details:
- Duration: ${e.duration||"[Duration]"}
- Altitude: ${e.altitude||"[Altitude]"}
- Base Village: ${e.baseVillage||"[Base Village]"}
- Region: ${e.regionArea||e.location||"[Region]"}

Write 150–200 words covering:
1. What makes this trek special and unique
2. Landscape, terrain, and key features along the trail
3. Best season to visit
4. Who should do this trek (beginner/intermediate/expert)
5. An engaging opening hook

Reference style (Kalsubai Trek):
"Kalsubai Peak (1646 m / 5400 ft) is the highest peak in Maharashtra, nestled in the Sahyadri range inside the Kalsubai Harishchandragad Wildlife Sanctuary. Steel railings, chains, and ladders at difficult sections make this trek accessible for beginners and thrilling for veterans alike."

Output only the paragraph text, no headings or bullet points.`},{key:"history",label:"History & Significance",type:"textarea",col:12,aiPrompt:e=>`Write the historical background and cultural significance of ${e.name||"[Trek Name]"} located in ${e.location||"[Location]"}, Maharashtra.

Trek type: ${e.fortType||"Hill Trek"}
Region: ${e.regionArea||e.location||"[Region]"}

Cover in 100–150 words:
1. Historical usage (fort, vantage point, trade route, etc.)
2. Mythological legends or local stories
3. Connection to Maratha history or tribal communities
4. Any temples, ruins, or heritage elements

Reference style (Kalsubai):
"Kalsubai is named after a local woman named Kalsu who is believed to have lived on the peak and the goddess Kalsubai who is worshipped at the small temple at the summit. Legends say Kalsu was a devoted woman whose spirit guards the mountain..."

Output only the paragraph, no headings.`},{key:"mainAttractions",label:"Main Attractions",type:"textarea",col:12,aiPrompt:e=>`List and describe the main attractions of ${e.name||"[Trek Name]"} trek in ${e.location||"[Location]"}, Maharashtra.

Trek details: ${e.difficulty||"Medium"} difficulty, ${e.altitude||"[Altitude]"} altitude, ${e.duration||"[Duration]"}

Write 4–6 main attractions as short paragraphs (2–3 sentences each). Cover:
- Key viewpoints or summits
- Temples, caves, or heritage structures
- Wildlife, forests, or waterfalls
- Unique trail features (ladders, rocky patches, etc.)
- Sunrise or stargazing opportunities

Format each attraction as:
[Attraction Name]: [2–3 sentence description]

Output only the list, no extra commentary.`},{key:"detailedHistory",label:"Detailed History",type:"textarea",col:12,aiPrompt:e=>`Write a detailed historical and cultural essay about ${e.name||"[Trek Name]"} in ${e.location||"[Location]"}, Maharashtra.

Fort/Trek type: ${e.fortType||"Hill Fort / Peak"}
Region: ${e.regionArea||e.location||"[Region]"}
Altitude: ${e.altitude||"[Altitude]"}

Write 250–350 words covering:
1. Pre-medieval and medieval history
2. Maratha empire connection (Shivaji Maharaj / Peshwas)
3. Architectural details if a fort (bastions, gates, water cisterns, temples)
4. Legends and folklore
5. Ecological and wildlife significance
6. Current condition and trekking heritage

Reference style: Detailed, evocative, Wikipedia-quality historical writing with a travel-friendly tone.

Output only the essay text, no headings.`},{key:"highlights",label:"Trek Highlights (one per line, e.g. 🏔 4650 Ft High)",type:"textarea",col:12,aiPrompt:e=>`Generate exactly 8 trek highlight bullet points for ${e.name||"[Trek Name]"} — a ${e.difficulty||"Medium"} trek at ${e.altitude||"[Altitude]"} in ${e.location||"[Location]"}, Maharashtra.

Format each line as: [emoji] [Short highlight text]

Reference (Kalsubai Trek highlights):
🏔 Highest Peak in Maharashtra — 1646m / 5400 ft
🌟 Walk under the Milky Way on a Night Trek
🌅 Witness Breathtaking Sahyadri Sunrise
⛩️ Seek Blessings at the Kalsubai Temple
🦅 Inside Kalsubai Harishchandragad Wildlife Sanctuary
🪜 3 Iron Ladders — Safe for Beginners
🎖️ E-Certificates on Successful Completion
🍱 Veg Thali + Jain Food Available at Base

Include highlights about: altitude/distance, unique terrain features, viewpoints, temples/heritage, wildlife, difficulty level, food/certificates. Keep each line under 10 words.

Output only the 8 lines, one per line, no numbering.`},{key:"whyJoin",label:"Why Join (Icon|Title|Description, one per line — shown on the trek page)",type:"textarea",col:12},{key:"bookingSteps",label:"How to Book steps (one per line — shown on the trek page)",type:"textarea",col:12},{key:"placesToVisit",label:"Places to Visit (Name|Description, one per line)",type:"textarea",col:12,aiPrompt:e=>`List 5–6 places to visit at or near ${e.name||"[Trek Name]"} in ${e.location||"[Location]"}, Maharashtra.

Format each line exactly as: PlaceName|Brief description (1–2 sentences)

Example format:
Konkan Kada|A dramatic overhanging cliff offering a breathtaking view of the Konkan coast far below. Best visited early morning to catch the mist rolling in.
Kedareshwar Cave|An ancient Shiva temple inside a water-filled cave with a large Shivalinga at its centre. Considered one of the most sacred spots on this trail.

Include:
- Summit/peak viewpoints
- Temples or caves
- Water bodies (lake, waterfall, dam)
- Nearby forts or heritage spots
- Unique geological formations

Output only the lines in the specified format, nothing else.`},{key:"included",label:"What's Included",type:"checklistTextarea",col:6,options:k,placeholder:"Add custom included items, one per line"},{key:"notIncluded",label:"Not Included",type:"checklistTextarea",col:6,options:b,placeholder:"Add custom excluded items, one per line"},{key:"thingsToCarry",label:"Things to Carry",type:"checklistTextarea",col:12,options:f,placeholder:"Add custom carry items, one per line"},{key:"discountCodes",label:"Discount Coupons",type:"discountCodes",col:12,options:T,toggleKey:"discountEnabled"},{key:"departurePlans",label:"Departure Cities, Pricing, Pickup Points & Itinerary",type:"departurePlans",col:12,cityOptions:["Mumbai","Pune","Kasara","Base Village"],helpText:`HOW TO ADD ITINERARY — Click "+ Add City" for each departure point (e.g. Mumbai, Pune, Kasara).

For each city tab:
• Price: Enter per-person price from that city (e.g. 1449)
• Pickup Points: Add each stop with time and location (click "+ Add Pickup Point")
  Example: 10:30 PM → Kasara Railway Station, Platform 1
• Itinerary: One event per line in format → Day Title|Time|Description
  Example:
  Day 01|10:30 PM|Depart from Kasara Station by private vehicle
  Day 01|11:45 PM|Arrive at Base Village — settle in and rest
  Day 02|04:30 AM|Wake up call — light snacks served
  Day 02|05:00 AM|Begin trek to Kalsubai Peak
  Day 02|08:00 AM|Reach summit — sunrise views and temple darshan
  Day 02|10:30 AM|Descend to base village
  Day 02|12:30 PM|Lunch at base — depart for home`}],D={sortOrder:"",name:"",subtitle:"",fortType:"",region:"mumbai",hubSlug:"",destination:"",category:"",location:"",difficulty:"Medium",enduranceLevel:"Medium",duration:"",altitude:"",price:"",originalPrice:"",nextDate:"",rating:"",reviews:"",image:"",imageGallery:"[]",baseVillage:"",regionArea:"",climbTime:"",distance:"",drivePune:"",wildlifeSanctuary:"",pricingLabel:"",about:"",history:"",mainAttractions:"",detailedHistory:"",highlights:"",placesToVisit:"",itinerary:"",included:"",notIncluded:"",thingsToCarry:"",discountCodes:"",discountEnabled:!1,trekDateBatches:"[]",departurePlans:"{}",pickupPoints:"{}"};function r(e,a){try{return JSON.parse(e||JSON.stringify(a))}catch{return a}}function P(e){return JSON.stringify(Object.fromEntries(Object.entries(e).map(([a,t])=>[a,t.pickupPoints||[]])))}function w(e){return Object.entries(e).flatMap(([a,t])=>String(t.itinerary||"").split(`
`).map(i=>i.trim()).filter(Boolean).map(i=>`${a}|${i}`)).join(`
`)}function S(e){return Object.entries(e).filter(([,a])=>a.price!==""&&a.price!=null).map(([a,t])=>`${a}: ₹${t.price}`).join(" | ")}function o(e){const a=r(e.trekDateBatches,[]).filter(n=>n?.date).sort((n,c)=>new Date(n.date)-new Date(c.date)),t=r(e.departurePlans,{}),i=r(e.imageGallery,[]).filter(Boolean),s=p(e.hubSlug);return{...e,category:e.category||s?.name||"",destination:e.destination||e.location||"",trekDateBatches:JSON.stringify(a),departurePlans:JSON.stringify(t),imageGallery:JSON.stringify(i),image:i[0]||e.image||"",nextDate:a[0]?.date?m(a[0].date):"",pickupPoints:P(t),itinerary:w(t)||e.itinerary,pricingLabel:S(t)}}function M(e){const a=l(e.name||e.slug||""),t=r(e.trekDateBatches,[]);u(a,e.name,t)}function A(e){const a=o(e),t=l(a.name||"trek-preview");sessionStorage.setItem("gt_trek_preview",JSON.stringify(a)),window.open(`/treks/${t}?preview=1`,"_blank")}function $(){return d.jsx(y,{title:"Treks",icon:"🥾",storageKey:"gt_treks",fields:v,defaultForm:D,seedData:[],transformForm:o,afterSubmit:M,onPreview:A})}export{$ as default};
