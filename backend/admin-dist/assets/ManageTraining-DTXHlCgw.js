import{B as I,D as A,r as h,j as e}from"./main-ssMQpn5-.js";import{D as N,a as w,g as T,b as z,s as O,r as U}from"./trainingData-CbQ4A3b9.js";import{g as C}from"./errorMessage-DlKwBbdg.js";function V(s){return`${s}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function L(){return{id:V("module"),title:"New Training Module",icon:"🎓",color:"#166534",description:"",estimatedTime:"30 min",sections:[],videos:[]}}function Y(){return{heading:"New Section",content:""}}function F(){return{title:"New Video",youtubeId:"",url:"",searchQuery:"",description:""}}function j(){return{text:"",weight:0}}function B(s){return{id:Date.now(),module:s||"",scenario:"",question:"",explanation:"",options:[j(),j(),j(),j()]}}function G({section:s,index:x,onChange:r,onRemove:u}){return e.jsxs("div",{className:"gt-training-nested-card",children:[e.jsxs("div",{className:"gt-training-nested-head",children:[e.jsxs("strong",{children:["Section ",x+1]}),e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:u,children:"Delete"})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Heading"}),e.jsx("input",{className:"form-control form-control-sm",value:s.heading||"",onChange:a=>r({...s,heading:a.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Content"}),e.jsx("textarea",{className:"form-control form-control-sm",rows:8,value:s.content||"",onChange:a=>r({...s,content:a.target.value})})]})]})]})}function H({video:s,index:x,onChange:r,onRemove:u}){return e.jsxs("div",{className:"gt-training-nested-card",children:[e.jsxs("div",{className:"gt-training-nested-head",children:[e.jsxs("strong",{children:["Video ",x+1]}),e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:u,children:"Delete"})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Title"}),e.jsx("input",{className:"form-control form-control-sm",value:s.title||"",onChange:a=>r({...s,title:a.target.value})})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"YouTube ID"}),e.jsx("input",{className:"form-control form-control-sm",placeholder:"11 character id",value:s.youtubeId||"",onChange:a=>r({...s,youtubeId:a.target.value})})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Direct URL"}),e.jsx("input",{className:"form-control form-control-sm",placeholder:"https://youtube.com/watch?v=...",value:s.url||"",onChange:a=>r({...s,url:a.target.value})})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Fallback Search Query"}),e.jsx("input",{className:"form-control form-control-sm",placeholder:"Used when embed is not available",value:s.searchQuery||"",onChange:a=>r({...s,searchQuery:a.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Description"}),e.jsx("textarea",{className:"form-control form-control-sm",rows:3,value:s.description||"",onChange:a=>r({...s,description:a.target.value})})]})]})]})}function q({question:s,modules:x,onChange:r,onRemove:u}){const a=(l,d)=>{const m=[...s.options||[]];m[l]=d,r({...s,options:m})},f=()=>{r({...s,options:[...s.options||[],j()]})},p=l=>{const d=(s.options||[]).filter((m,y)=>y!==l);r({...s,options:d.length>0?d:[j()]})};return e.jsxs("div",{className:"gt-training-nested-card",children:[e.jsxs("div",{className:"gt-training-nested-head",children:[e.jsxs("strong",{children:["Question #",s.id]}),e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:u,children:"Delete"})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-md-4",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Module"}),e.jsxs("select",{className:"form-select form-select-sm",value:s.module||"",onChange:l=>r({...s,module:l.target.value}),children:[e.jsx("option",{value:"",children:"Select module"}),x.map(l=>e.jsx("option",{value:l.id,children:l.title},l.id))]})]}),e.jsxs("div",{className:"col-md-8",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Scenario"}),e.jsx("input",{className:"form-control form-control-sm",value:s.scenario||"",onChange:l=>r({...s,scenario:l.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Question"}),e.jsx("textarea",{className:"form-control form-control-sm",rows:3,value:s.question||"",onChange:l=>r({...s,question:l.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Explanation"}),e.jsx("textarea",{className:"form-control form-control-sm",rows:2,value:s.explanation||"",onChange:l=>r({...s,explanation:l.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsxs("div",{className:"d-flex justify-content-between align-items-center mb-2",children:[e.jsx("label",{className:"form-label small fw-semibold mb-0",children:"Options"}),e.jsx("button",{type:"button",className:"btn btn-outline-success btn-sm",onClick:f,children:"+ Add Option"})]}),e.jsx("div",{className:"gt-training-options",children:(s.options||[]).map((l,d)=>e.jsxs("div",{className:"gt-training-option-row",children:[e.jsx("input",{className:"form-control form-control-sm",placeholder:`Option ${d+1}`,value:l.text||"",onChange:m=>a(d,{...l,text:m.target.value})}),e.jsx("input",{className:"form-control form-control-sm gt-training-weight",type:"number",min:"0",step:"1",value:l.weight??0,onChange:m=>a(d,{...l,weight:Number(m.target.value)||0})}),e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>p(d),children:"Del"})]},`${s.id}_${d}`))})]})]})]})}function W(){const s=I(),x=A(),[r,u]=h.useState("modules"),[a,f]=h.useState(N),[p,l]=h.useState(w),[d,m]=h.useState(N[0]?.id||""),[y,v]=h.useState(w[0]?.id||null);h.useEffect(()=>{const t=()=>{const o=T(N,w);f(o.modules),l(o.questions),m(c=>c||o.modules[0]?.id||""),v(c=>c??o.questions[0]?.id??null)};t();const n=z();return window.addEventListener(n,t),()=>window.removeEventListener(n,t)},[]);const i=h.useMemo(()=>a.find(t=>t.id===d)||a[0]||null,[a,d]),k=h.useMemo(()=>p.find(t=>t.id===y)||p[0]||null,[p,y]),g=t=>{f(n=>n.map(o=>o.id===t.id?t:o))},M=t=>{l(n=>n.map(o=>o.id===t.id?t:o))},S=()=>{try{O({modules:a,questions:p},N,w),s.success("Training content updated.")}catch(t){s.error(C(t,"Could not save training content."))}},D=async()=>{if(await x({title:"Reset training content?",message:"This will restore the original training modules and questions. Your custom CRM changes will be removed.",confirmText:"Reset Training",type:"warning"}))try{U();const n=T(N,w);f(n.modules),l(n.questions),m(n.modules[0]?.id||""),v(n.questions[0]?.id||null),s.success("Training content reset to default.")}catch(n){s.error(C(n,"Could not reset training content."))}},Q=()=>{const t=L();f(n=>[...n,t]),m(t.id),u("modules")},E=async t=>{const n=a.find(b=>b.id===t);if(!await x({title:`Delete ${n?.title||"this module"}?`,message:"The module will also disappear from the employee training portal after save.",confirmText:"Delete Module",type:"danger"}))return;const c=a.filter(b=>b.id!==t);f(c),l(b=>b.filter(R=>R.module!==t)),m(c[0]?.id||"")},$=()=>{const t=B(i?.id);l(n=>[...n,t]),v(t.id),u("questions")},_=async t=>{if(!await x({title:"Delete this question?",message:"This removes it from the certification test after save.",confirmText:"Delete Question",type:"danger"}))return;const o=p.filter(c=>c.id!==t);l(o),v(o[0]?.id??null)};return e.jsxs("div",{className:"adm-page",children:[e.jsxs("div",{className:"adm-page-header",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"adm-page-title",children:"🎓 Training"}),e.jsx("p",{className:"text-muted mb-0",style:{fontSize:13},children:"Manage leader training modules, section content, YouTube links, and certification questions from CRM."})]}),e.jsxs("div",{className:"d-flex gap-2 flex-wrap",children:[e.jsx("button",{type:"button",className:"btn btn-outline-secondary btn-sm",onClick:D,children:"Reset Default"}),e.jsx("button",{type:"button",className:"btn btn-success btn-sm px-3",onClick:S,children:"Save Training"})]})]}),e.jsxs("div",{className:"gt-training-stats",children:[e.jsxs("div",{className:"gt-training-stat-card",children:[e.jsx("div",{className:"gt-training-stat-value",children:a.length}),e.jsx("div",{className:"gt-training-stat-label",children:"Modules"})]}),e.jsxs("div",{className:"gt-training-stat-card",children:[e.jsx("div",{className:"gt-training-stat-value",children:a.reduce((t,n)=>t+(n.sections?.length||0),0)}),e.jsx("div",{className:"gt-training-stat-label",children:"Sections"})]}),e.jsxs("div",{className:"gt-training-stat-card",children:[e.jsx("div",{className:"gt-training-stat-value",children:a.reduce((t,n)=>t+(n.videos?.length||0),0)}),e.jsx("div",{className:"gt-training-stat-label",children:"Videos"})]}),e.jsxs("div",{className:"gt-training-stat-card",children:[e.jsx("div",{className:"gt-training-stat-value",children:p.length}),e.jsx("div",{className:"gt-training-stat-label",children:"Test Questions"})]})]}),e.jsxs("div",{className:"gt-training-tabbar",children:[e.jsx("button",{type:"button",className:`gt-training-tab ${r==="modules"?"active":""}`,onClick:()=>u("modules"),children:"Modules"}),e.jsx("button",{type:"button",className:`gt-training-tab ${r==="questions"?"active":""}`,onClick:()=>u("questions"),children:"Questions"})]}),r==="modules"&&e.jsxs("div",{className:"gt-training-shell",children:[e.jsxs("aside",{className:"gt-training-sidebar",children:[e.jsxs("div",{className:"gt-training-sidebar-head",children:[e.jsx("strong",{children:"Modules"}),e.jsx("button",{type:"button",className:"btn btn-success btn-sm",onClick:Q,children:"+ Add"})]}),e.jsx("div",{className:"gt-training-list",children:a.map(t=>e.jsxs("button",{type:"button",onClick:()=>m(t.id),className:`gt-training-list-item ${i?.id===t.id?"active":""}`,children:[e.jsx("span",{className:"gt-training-list-icon",style:{background:`${t.color}18`,color:t.color},children:t.icon||"🎓"}),e.jsxs("span",{className:"gt-training-list-copy",children:[e.jsx("strong",{children:t.title}),e.jsxs("small",{children:[t.sections?.length||0," sections · ",t.videos?.length||0," videos"]})]})]},t.id))})]}),e.jsx("section",{className:"gt-training-editor",children:i?e.jsxs("div",{className:"adm-form-card",children:[e.jsxs("div",{className:"d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"mb-1 fw-bold",children:i.title}),e.jsxs("div",{className:"text-muted",style:{fontSize:12},children:["Module ID: ",e.jsx("code",{children:i.id})]})]}),e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>E(i.id),children:"Delete Module"})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-md-4",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Title"}),e.jsx("input",{className:"form-control form-control-sm",value:i.title||"",onChange:t=>g({...i,title:t.target.value})})]}),e.jsxs("div",{className:"col-md-2",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Icon"}),e.jsx("input",{className:"form-control form-control-sm",value:i.icon||"",onChange:t=>g({...i,icon:t.target.value})})]}),e.jsxs("div",{className:"col-md-3",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Color"}),e.jsx("input",{className:"form-control form-control-sm",value:i.color||"",onChange:t=>g({...i,color:t.target.value})})]}),e.jsxs("div",{className:"col-md-3",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Estimated Time"}),e.jsx("input",{className:"form-control form-control-sm",value:i.estimatedTime||"",onChange:t=>g({...i,estimatedTime:t.target.value})})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label small fw-semibold mb-1",children:"Description"}),e.jsx("textarea",{className:"form-control form-control-sm",rows:2,value:i.description||"",onChange:t=>g({...i,description:t.target.value})})]})]}),e.jsxs("div",{className:"gt-training-block",children:[e.jsxs("div",{className:"gt-training-block-head",children:[e.jsx("h6",{className:"fw-bold mb-0",children:"Module Sections"}),e.jsx("button",{type:"button",className:"btn btn-outline-success btn-sm",onClick:()=>g({...i,sections:[...i.sections||[],Y()]}),children:"+ Add Section"})]}),(i.sections||[]).length===0?e.jsx("div",{className:"gt-training-empty",children:"No sections yet."}):i.sections.map((t,n)=>e.jsx(G,{section:t,index:n,onChange:o=>{const c=[...i.sections||[]];c[n]=o,g({...i,sections:c})},onRemove:()=>{const o=(i.sections||[]).filter((c,b)=>b!==n);g({...i,sections:o})}},`${i.id}_section_${n}`))]}),e.jsxs("div",{className:"gt-training-block",children:[e.jsxs("div",{className:"gt-training-block-head",children:[e.jsx("h6",{className:"fw-bold mb-0",children:"YouTube Videos"}),e.jsx("button",{type:"button",className:"btn btn-outline-success btn-sm",onClick:()=>g({...i,videos:[...i.videos||[],F()]}),children:"+ Add Video"})]}),(i.videos||[]).length===0?e.jsx("div",{className:"gt-training-empty",children:"No videos yet."}):i.videos.map((t,n)=>e.jsx(H,{video:t,index:n,onChange:o=>{const c=[...i.videos||[]];c[n]=o,g({...i,videos:c})},onRemove:()=>{const o=(i.videos||[]).filter((c,b)=>b!==n);g({...i,videos:o})}},`${i.id}_video_${n}`))]})]}):e.jsxs("div",{className:"adm-empty",children:[e.jsx("div",{className:"adm-empty-icon",children:"🎓"}),e.jsx("p",{className:"adm-empty-text",children:"Create your first training module to get started."})]})})]}),r==="questions"&&e.jsxs("div",{className:"gt-training-shell",children:[e.jsxs("aside",{className:"gt-training-sidebar",children:[e.jsxs("div",{className:"gt-training-sidebar-head",children:[e.jsx("strong",{children:"Questions"}),e.jsx("button",{type:"button",className:"btn btn-success btn-sm",onClick:$,children:"+ Add"})]}),e.jsx("div",{className:"gt-training-list",children:p.map((t,n)=>{const o=a.find(c=>c.id===t.module)?.title||"No module";return e.jsxs("button",{type:"button",onClick:()=>v(t.id),className:`gt-training-list-item ${k?.id===t.id?"active":""}`,children:[e.jsx("span",{className:"gt-training-list-icon question",children:n+1}),e.jsxs("span",{className:"gt-training-list-copy",children:[e.jsx("strong",{children:t.question||"Untitled question"}),e.jsx("small",{children:o})]})]},t.id)})})]}),e.jsx("section",{className:"gt-training-editor",children:k?e.jsx("div",{className:"adm-form-card",children:e.jsx(q,{question:k,modules:a,onChange:M,onRemove:()=>_(k.id)})}):e.jsxs("div",{className:"adm-empty",children:[e.jsx("div",{className:"adm-empty-icon",children:"📝"}),e.jsx("p",{className:"adm-empty-text",children:"Add a question to build the certification test."})]})})]}),e.jsx("style",{children:`
        .gt-training-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }
        .gt-training-stat-card {
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }
        .gt-training-stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #166534;
          line-height: 1;
          margin-bottom: 6px;
        }
        .gt-training-stat-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .gt-training-tabbar {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .gt-training-tab {
          border: 1px solid #dbe3ef;
          background: #fff;
          color: #475569;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .gt-training-tab.active {
          background: linear-gradient(135deg, #166534, #15803d);
          color: #fff;
          border-color: #166534;
          box-shadow: 0 10px 24px rgba(22, 101, 52, 0.18);
        }
        .gt-training-shell {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .gt-training-sidebar {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          position: sticky;
          top: 16px;
        }
        .gt-training-sidebar-head,
        .gt-training-block-head,
        .gt-training-nested-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .gt-training-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 72vh;
          overflow: auto;
          padding-right: 2px;
        }
        .gt-training-list-item {
          display: flex;
          gap: 12px;
          align-items: center;
          width: 100%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .gt-training-list-item:hover,
        .gt-training-list-item.active {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          border-color: #86efac;
          background: #fff;
        }
        .gt-training-list-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .gt-training-list-icon.question {
          background: #dcfce7;
          color: #166534;
        }
        .gt-training-list-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .gt-training-list-copy strong,
        .gt-training-list-copy small {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gt-training-list-copy strong {
          font-size: 13px;
          color: #0f172a;
        }
        .gt-training-list-copy small {
          font-size: 11px;
          color: #64748b;
        }
        .gt-training-editor {
          min-width: 0;
        }
        .gt-training-block {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
        }
        .gt-training-nested-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          background: #f8fafc;
          margin-bottom: 12px;
        }
        .gt-training-empty {
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          color: #64748b;
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          font-size: 13px;
        }
        .gt-training-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gt-training-option-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 90px auto;
          gap: 8px;
          align-items: center;
        }
        .gt-training-weight {
          text-align: center;
        }
        @media (max-width: 991px) {
          .gt-training-shell {
            grid-template-columns: 1fr;
          }
          .gt-training-sidebar {
            position: static;
          }
        }
      `})]})}export{W as default};
