import{r as h,j as d}from"./main-ssMQpn5-.js";function m(n,e){const o=URL.createObjectURL(n),t=document.createElement("a");t.href=o,t.download=e,document.body.appendChild(t),t.click(),t.remove(),URL.revokeObjectURL(o)}function p(n){const e={};for(const[o,t]of Object.entries(n))t==null?e[o]="":Array.isArray(t)?e[o]=t.length?`[${t.length} items]`:"":typeof t=="object"?e[o]=JSON.stringify(t):e[o]=t;return e}function x(n,e="export"){if(!n?.length)return;const o=n.map(p),t=Object.keys(o[0]),c=s=>`"${String(s).replace(/"/g,'""')}"`,l=[t.map(c).join(","),...o.map(s=>t.map(a=>c(s[a])).join(","))].join(`\r
`);m(new Blob([l],{type:"text/csv;charset=utf-8;"}),`${e}.csv`)}function b(n,e="export"){if(!n?.length)return;const o=n.map(p),t=Object.keys(o[0]),c=t.map(a=>`<th style="background:#198754;color:#fff;padding:6px 10px;">${a}</th>`).join(""),l=o.map(a=>`<tr>${t.map(r=>`<td style="padding:5px 10px;border:1px solid #ddd;">${a[r]}</td>`).join("")}</tr>`).join(""),s=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><table><thead><tr>${c}</tr></thead><tbody>${l}</tbody></table></body></html>`;m(new Blob([s],{type:"application/vnd.ms-excel;charset=utf-8;"}),`${e}.xls`)}function u(n,e="export",o=""){if(!n?.length)return;const t=n.map(p),c=Object.keys(t[0]),l=c.map(i=>`<th>${i}</th>`).join(""),s=t.map(i=>`<tr>${c.map(f=>`<td>${i[f]}</td>`).join("")}</tr>`).join(""),a=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${o||e}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
  h2   { color: #198754; margin-bottom: 6px; }
  p    { color: #64748b; margin-bottom: 16px; font-size: 10px; }
  table { border-collapse: collapse; width: 100%; }
  th   { background: #198754; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; }
  td   { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print { @page { margin: 1cm; } }
</style></head><body>
<h2>${o||e}</h2>
<p>Exported on ${new Date().toLocaleString("en-IN")} · ${n.length} record${n.length!==1?"s":""}</p>
<table><thead><tr>${l}</tr></thead><tbody>${s}</tbody></table>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`,r=window.open("","_blank");r&&(r.document.write(a),r.document.close())}function g({getData:n,filename:e="export",title:o}){const[t,c]=h.useState(!1),l=s=>{c(!1);const a=n();if(!a?.length)return alert("No data to download.");s==="csv"&&x(a,e),s==="excel"&&b(a,e),s==="pdf"&&u(a,e,o||e)};return d.jsxs("div",{className:"adm-dl-wrap",onBlur:()=>setTimeout(()=>c(!1),150),children:[d.jsx("button",{className:"btn btn-outline-secondary btn-sm adm-dl-btn",onClick:()=>c(s=>!s),title:"Download data",children:"⬇ Download"}),t&&d.jsxs("div",{className:"adm-dl-dropdown",children:[d.jsxs("button",{className:"adm-dl-item",onClick:()=>l("csv"),children:[d.jsx("span",{children:"📄"})," CSV"]}),d.jsxs("button",{className:"adm-dl-item",onClick:()=>l("excel"),children:[d.jsx("span",{children:"📊"})," Excel (.xls)"]}),d.jsxs("button",{className:"adm-dl-item",onClick:()=>l("pdf"),children:[d.jsx("span",{children:"🖨"})," PDF (Print)"]})]})]})}export{g as D};
