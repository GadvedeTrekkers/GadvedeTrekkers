import{j as u,v as n,w as d,t as h,C as y,x as g}from"./main-ssMQpn5-.js";import{M as m}from"./ManagePage-Cg7lVuku.js";import"./useAdminData-D4SZ_EsQ.js";import"./activityLogStorage-iRw8ezig.js";import"./InfoTooltip-D-ZbWhaY.js";const l=["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80","https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1400&q=80","https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=80"];l[0],JSON.stringify(l);const D=["LOYALTY500|Old Customers Enjoy Flat 500 Off","GROUP1000|Group Booking Offer","EARLYBIRD|Early Bird Savings"],b=["3AC Train Tickets","Volvo Bus Transfer","3 Star Hotel Stay","Breakfast","Dinner","Sightseeing","Trip Captain","Toll Taxes","Driver Allowances"],k=["5% GST","Rohtang Pass","Extra Meals","Personal Expenses","Travel Insurance","Paid Activities","Entry Fees","Late Checkout"],T=["Day Backpack","Jacket","Thermals","Outdoor Shoes","Poncho","Water Bottle","Power Bank","ID Proof","Medical Kit","Sunscreen"],P={himachal:"himachal",uttarakhand:"uttarakhand",rajasthan:"rajasthan",kerala:"kerala-south"},v=[{key:"name",label:"Tour Name",required:!0,col:8},{key:"region",label:"Region",required:!0,type:"select",col:4,options:["himachal","kashmir","northeast","rajasthan","kerala","uttarakhand","goa","maharashtra","karnataka"]},{key:"hubSlug",label:"Catalog hub",type:"select",col:4,options:y.map(e=>({value:e.slug,label:e.name}))},{key:"destination",label:"Destination",col:4,placeholder:"Solang Valley, Himachal Pradesh"},{key:"category",label:"Category label",col:4,placeholder:"Himachal"},{key:"state",label:"State",col:4,placeholder:"Himachal Pradesh"},{key:"duration",label:"Duration",required:!0,col:4,placeholder:"7 Nights 8 Days"},{key:"destinationLine",label:"Destinations Covered",col:4,placeholder:"Manali, Kullu, Kasol, Manikaran"},{key:"heroBadge",label:"Hero Badge",col:4,placeholder:"Himalayan Group Tour"},{key:"subtitle",label:"Subtitle",col:8,placeholder:"Scenic mountain escape with adventure and culture"},{key:"price",label:"Starting Price (₹)",required:!0,type:"number",col:4,placeholder:"9999"},{key:"originalPrice",label:"Original Price (₹)",type:"number",col:4,placeholder:"14999"},{key:"taxPercent",label:"GST %",type:"number",col:4,placeholder:"5"},{key:"rating",label:"Rating",col:3,placeholder:"4.8"},{key:"reviews",label:"Review Count",col:3,placeholder:"187"},{key:"happyCustomers",label:"Happy Customers Label",col:6,placeholder:"Only use a figure you can prove"},{key:"pickupPointLabel",label:"Pickup Point Label",col:6,placeholder:"Himachal Pradesh, India"},{key:"pickupPointMapLabel",label:"Pickup Map CTA",col:6,placeholder:"View on Map"},{key:"filters",label:"Bottom Filters / Tags",type:"textarea",col:12,placeholder:"Weekend Trips | 5 to 8 Days | Group Tours"},{key:"imageGallery",label:"Tour Banner Images",type:"imageGallery",col:12},{key:"itineraryPdfUrl",label:"Itinerary PDF URL",placeholder:"/itineraries/tour-name.pdf or https://...",col:12},{key:"tourDateBatches",label:"Tour Dates & WhatsApp Group Links",type:"trekDates",col:12},{key:"overview",label:"Tour Overview",type:"textarea",col:12,placeholder:"Add the full overview and attraction text here.",aiPrompt:e=>`Write a detailed, engaging 150–200 word overview for the tour: "${e.name||"[Tour Name]"}".

Tour details:
- Duration: ${e.duration||"[Duration]"}
- Destinations: ${e.destinationLine||"[Destinations]"}
- Region: ${e.region||"[Region]"}
- Starting Price: ₹${e.price||"[Price]"}

Cover:
1. What makes this tour special
2. Key destinations and their highlights
3. Who this tour is ideal for (families, couples, college groups, etc.)
4. Type of experience (cultural, adventure, spiritual, scenic)
5. An engaging opening hook

Format: flowing paragraphs (no bullet points). Output only the overview text.`},{key:"keyHighlights",label:"Key Highlights (Section|Items, one per line)",type:"textarea",col:12,placeholder:"Manali|Hidimba Devi Temple, Mall Road, Solang Valley",aiPrompt:e=>`Generate key highlights for the tour: "${e.name||"[Tour Name]"}" covering ${e.destinationLine||"[Destinations]"} (${e.duration||"[Duration]"}).

Format exactly as: DestinationName|Attraction 1, Attraction 2, Attraction 3
One destination per line.

Example:
Manali|Hidimba Devi Temple, Mall Road, Solang Valley, Atal Tunnel
Kasol|Parvati River, Kheerganga Trek, Israeli Cafes
Amritsar|Golden Temple, Jallianwala Bagh, Wagah Border Ceremony

List 4–6 destinations with 3–5 attractions each. Output only the lines, nothing else.`},{key:"briefItinerary",label:"Brief Itinerary (Day|Summary, one per line)",type:"textarea",col:12,placeholder:"Day 01|Mumbai/Pune to Delhi overnight train journey",helpText:`FORMAT: Day 01|One-line summary of the day's activity
Example:
Day 01|Departure from Mumbai/Pune — overnight train to Delhi
Day 02|Delhi sightseeing — India Gate, Qutub Minar, Lotus Temple
Day 03|Delhi to Manali by overnight Volvo bus`},{key:"departureDatesDelhi",label:"Departure Dates from Delhi (Month|Dates, one per line)",type:"textarea",col:6},{key:"departureDatesHometown",label:"Departure Dates from Mumbai/Pune/etc (Month|Dates, one per line)",type:"textarea",col:6},{key:"pricingOptions",label:"Pricing Options (Label|Price|Description, one per line)",type:"textarea",col:6,placeholder:"Delhi to Delhi|9999|Base package per person"},{key:"addOns",label:"Add-ons (Label|Price, one per line)",type:"textarea",col:6,placeholder:"Triple Sharing|499"},{key:"bookingNote",label:"Booking Note",type:"textarea",col:12,placeholder:"You can book your seat at 60% now..."},{key:"included",label:"What's Included",type:"checklistTextarea",col:6,options:b,placeholder:"Add custom included lines, one per line"},{key:"notIncluded",label:"What's Not Included",type:"checklistTextarea",col:6,options:k,placeholder:"Add custom excluded lines, one per line"},{key:"offerCodes",label:"Tour Offers",type:"discountCodes",col:12,options:D,toggleKey:"discountEnabled"},{key:"detailedItinerary",label:"Detailed Itinerary (Day|Time|Description, one per line)",type:"textarea",col:12,placeholder:"Day 01|11:25 AM|Board Paschim Express",helpText:`FORMAT: Day Title|Time|Activity description — one event per line
Example:
Day 01|11:25 PM|Board Paschim Express from Mumbai CST
Day 01|05:30 AM|Arrive New Delhi Railway Station
Day 02|09:00 AM|Breakfast at hotel — freshen up
Day 02|10:00 AM|India Gate, Rajpath sightseeing
Day 02|01:00 PM|Lunch at local restaurant
Day 02|03:00 PM|Qutub Minar, Lotus Temple visit`,aiPrompt:e=>`Write a detailed day-by-day itinerary for the tour: "${e.name||"[Tour Name]"}" — ${e.duration||"[Duration]"} covering ${e.destinationLine||"[Destinations]"}.

FORMAT STRICTLY (one event per line):
Day Title|Time|Activity description

Example:
Day 01|11:25 PM|Board Paschim Express from Mumbai CST — Platform 1
Day 02|05:30 AM|Arrive New Delhi Railway Station — freshen up at hotel
Day 02|09:00 AM|Hotel breakfast
Day 02|10:00 AM|India Gate and Rajpath sightseeing
Day 02|01:00 PM|Lunch at local restaurant
Day 02|03:00 PM|Qutub Minar and Lotus Temple visit
Day 02|07:00 PM|Dinner and overnight stay at Delhi hotel

Write a complete realistic itinerary for all ${e.duration||"days"} of this tour. Include travel, meals, sightseeing, and overnight stays. Output only the lines in the exact format above — no headings, no extra text.`},{key:"thingsToCarry",label:"Things to Carry",type:"checklistTextarea",col:12,options:T,placeholder:"Add custom carry items, one per line"},{key:"travelInfo",label:"Travel Information (Title|Description, one per line)",type:"textarea",col:12,placeholder:"Ticket Booking Process|IRCTC-certified agents..."},{key:"paymentDetails",label:"Payment Details (Label|Value, one per line)",type:"textarea",col:12,placeholder:"Booking|WhatsApp +91 98561 12727"},{key:"cancellationPolicy",label:"Cancellation Policy",type:"textarea",col:12},{key:"policyNotes",label:"Policy Notes",type:"textarea",col:12},{key:"faq",label:"FAQ (Question|Answer, one per line)",type:"textarea",col:12,placeholder:"What is the best time to visit?|October to March is ideal.",aiPrompt:e=>`Write 6–8 frequently asked questions and answers for the tour: "${e.name||"[Tour Name]"}" — ${e.duration||"[Duration]"} to ${e.destinationLine||"[Destinations]"}.

FORMAT strictly (one Q&A per line):
Question text|Answer text (concise, 1–2 sentences)

Example:
What is the best time to visit Manali?|October to March is ideal for snow, while June to September offers lush greenery and adventure activities.
Is this tour suitable for senior citizens?|Yes, the itinerary is designed to be comfortable for all age groups with adequate rest stops.
What type of accommodation is provided?|3-star hotel stays with twin/triple sharing, daily breakfast and dinner included.

Cover topics: best time, accommodation, food, safety, group size, travel mode, included activities, cancellation policy, things to carry, fitness requirements.

Output only the lines in the exact format — no headings or extra text.`}],f={name:"",slug:"",region:"himachal",hubSlug:"",destination:"",category:"",state:"",duration:"",destinationLine:"",heroBadge:"",subtitle:"",price:"",originalPrice:"",taxPercent:5,nextDate:"",image:"",imageGallery:"[]",instantConfirmation:!0,bestPriceGuaranteed:!0,happyCustomers:"",rating:"",reviews:"",pickupPointLabel:"",pickupPointMapLabel:"View on Map",filters:"",overview:"",keyHighlights:"",briefItinerary:"",departureDatesDelhi:"",departureDatesHometown:"",pricingOptions:"",addOns:"",bookingNote:"",included:"",notIncluded:"",discountEnabled:!0,offerCodes:"",detailedItinerary:"",thingsToCarry:"",travelInfo:"",paymentDetails:"",cancellationPolicy:"",policyNotes:"",faq:"",tourDateBatches:"[]",active:!0},s=(e="")=>String(e).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""),x=e=>{const a=g(e)[0];if(!a)return"";const[t,i]=a.split("|"),r=String(i||"").split(",")[0]?.trim();return t&&r?`${r} ${t} 2026`:""};function c(e){const a=n(e.imageGallery,[]).filter(Boolean),t=n(e.tourDateBatches,[]).filter(o=>o?.date).sort((o,p)=>new Date(o.date)-new Date(p.date)),i=e.hubSlug||P[e.region]||"",r=h(i);return{...e,hubSlug:i,destination:e.destination||e.destinationLine||e.state||e.location||"",category:e.category||r?.name||"",slug:e.slug||s(e.name),imageGallery:JSON.stringify(a),image:a[0]||e.image||"",nextDate:t[0]?.date?new Date(`${t[0].date}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):e.nextDate||x(e.departureDatesHometown||e.departureDatesDelhi),tourDateBatches:JSON.stringify(t),price:Number(e.price||0),originalPrice:Number(e.originalPrice||0),taxPercent:Number(e.taxPercent||0)}}function M(e){const a=e.slug||s(e.name||""),t=n(e.tourDateBatches,[]);d(a,e.name,t)}function w(e){const a=c(e);sessionStorage.setItem("gt_tour_preview",JSON.stringify(a)),window.open(`/tours/${a.slug}?preview=1`,"_blank")}function C(){return u.jsx(m,{title:"Tours",icon:"🗺",storageKey:"gt_tours",fields:v,defaultForm:f,seedData:[],transformForm:c,afterSubmit:M,onPreview:w})}export{C as default};
