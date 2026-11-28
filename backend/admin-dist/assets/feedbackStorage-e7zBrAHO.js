const d="gt_feedback",g="gt_feedback_settings",i={enabled:!0,googleReviewLink:"https://g.page/r/gadvedetrekkers/review",emailTemplate:`Dear {name},

Thank you for trekking with Gadvede Trekkers!

We'd love to hear about your experience on {trek}.
Your feedback helps us improve and inspires other adventurers.

Please take 2 minutes to share your thoughts.

Warm regards,
Team Gadvede Trekkers`,questions:["How was your overall trek experience?","How would you rate the guide's assistance?","Was the route difficulty communicated clearly?","How was the pick-up and transport service?","Would you recommend Gadvede Trekkers to friends?"]};function k(){try{const e=localStorage.getItem(g);return e?{...i,...JSON.parse(e)}:{...i}}catch{return{...i}}}function f(e){localStorage.setItem(g,JSON.stringify(e))}function c(){try{return JSON.parse(localStorage.getItem(d)||"[]")}catch{return[]}}function l(e){localStorage.setItem(d,JSON.stringify(e))}function b({bookingId:e,customerId:a,customerName:s,trekName:o,rating:t,comments:r,answers:n}){const m=c(),u={id:`FB-${Date.now()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,bookingId:e||"",customerId:a||"",customerName:s||"Anonymous",trekName:o||"Unknown Trek",rating:Number(t),comments:r||"",answers:n||[],submittedAt:new Date().toISOString()};return l([u,...m]),u}function w(e){l(c().filter(a=>a.id!==e))}function S({rating:e,trekName:a,fromDate:s,toDate:o}={}){let t=c();if(e&&(t=t.filter(r=>String(r.rating)===String(e))),a&&(t=t.filter(r=>r.trekName===a)),s){const r=new Date(s).getTime();t=t.filter(n=>new Date(n.submittedAt).getTime()>=r)}if(o){const r=new Date(o).getTime()+864e5;t=t.filter(n=>new Date(n.submittedAt).getTime()<=r)}return t.sort((r,n)=>new Date(n.submittedAt)-new Date(r.submittedAt))}export{c as a,b,w as d,k as g,S as q,f as s};
