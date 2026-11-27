"use strict";
const fs = require("node:fs");
const path = require("node:path");
const replacement = "function getMultiFilterSelectedValues(inputs,mode){\n const controls=Array.from(inputs||[]);\n if(mode===\"none\")return [];\n if(mode===\"all\")return controls.map(input=>input.value);\n return controls.filter(input=>input.checked).map(input=>input.value);\n}\nfunction restoreMultiFilterScroll(key,scrollTop){\n const restore=()=>{\n  const group=Array.from(document.querySelectorAll(\"[data-multi-filter]\")).find(item=>item.dataset.multiFilter===key);\n  const list=group&&group.querySelector(\".multi-filter-list\");\n  if(list)list.scrollTop=scrollTop;\n };\n restore();\n if(typeof window!==\"undefined\"&&typeof window.requestAnimationFrame===\"function\")window.requestAnimationFrame(restore);\n}\nfunction updateMultiFilterFromContainer(container,mode){\n if(!container)return;\n const [scope,name]=String(container.dataset.multiFilter||\"\").split(\":\");\n if(![\"calendar\",\"reminder\"].includes(scope)||!name)return;\n const target=scope===\"calendar\"?state.calendarFilters:state.reminderFilters;\n const list=container.querySelector(\".multi-filter-list\");\n const scrollTop=list?list.scrollTop:0;\n const key=scope+\":\"+name;\n const values=getMultiFilterSelectedValues(container.querySelectorAll(\"input[data-filter-option]\"),mode);\n target[name]=safeFilterIds(values);\n if(name===\"universityIds\"){const validUnits=new Set(getUnitFilterOptions(getFutureFilterEvents(),target.universityIds).map(item=>item.value));target.unitIds=target.unitIds.filter(id=>validUnits.has(id));}\n state.openMultiFilter=key;\n persistPrefs();\n if(scope===\"calendar\")renderCalendar();else renderProfile();\n restoreMultiFilterScroll(key,scrollTop);\n}";
const listenerReplacement = "$(\"mainContent\").addEventListener(\"change\",e=>{\n if(e.target.id===\"infoUniversity\"){state.selectedUni=e.target.value;renderInfo();return;}\n const option=e.target.closest&&e.target.closest(\"input[data-filter-option]\");\n if(option){\n  const scope=option.dataset.filterScope,name=option.dataset.filterName,container=option.closest(\"[data-multi-filter]\");\n  if(![\"calendar\",\"reminder\"].includes(scope)||!name||!container)return;\n  const list=container.querySelector(\".multi-filter-list\");\n  const scrollTop=list?list.scrollTop:0;\n  const key=scope+\":\"+name;\n  const target=scope===\"calendar\"?state.calendarFilters:state.reminderFilters;\n  target[name]=safeFilterIds(Array.from(container.querySelectorAll(\"input[data-filter-option]:checked\")).map(input=>input.value));\n  state.openMultiFilter=key;\n  persistPrefs();\n  if(scope===\"calendar\")renderCalendar();else renderProfile();\n  restoreMultiFilterScroll(key,scrollTop);\n }\n});";
function applyFilterUiFixes(root){
 const target=path.join(root,"assets","js","main-shell.js");
 let source=fs.readFileSync(target,"utf8");
 const startMarker="function updateMultiFilterFromContainer(container,mode){";
 const endMarker="\nfunction resetMultiFilters(scope){";
 const start=source.indexOf(startMarker);
 const end=start<0?-1:source.indexOf(endMarker,start);
 if(start>=0&&end>=0){source=source.slice(0,start)+replacement+source.slice(end);}
 else if(!source.includes("function getMultiFilterSelectedValues(inputs,mode){")){throw new Error("Could not locate multi-filter selection handler.");}
 const listenerStartMarker='$("mainContent").addEventListener("change",e=>{if(e.target.id==="infoUniversity")';
 const listenerEndMarker='\n $("mainContent").addEventListener("input",e=>{';
 const listenerStart=source.indexOf(listenerStartMarker);
 const listenerEnd=listenerStart<0?-1:source.indexOf(listenerEndMarker,listenerStart);
 if(listenerStart>=0&&listenerEnd>=0){source=source.slice(0,listenerStart)+listenerReplacement+source.slice(listenerEnd);}
 else if(!source.includes("restoreMultiFilterScroll(key,scrollTop);")){throw new Error("Could not locate multi-filter change listener.");}
 if(!source.includes('class="multi-filter-grid reminder-filter-grid"')&&!source.includes('class="multi-filters-grid reminder-filter-grid"'))throw new Error("Reminder multi-select grid wrapper is missing.");
 fs.writeFileSync(target,source,"utf8");
 return {path:target,bytes:Buffer.byteLength(source,"utf8")};
}
if(require.main===module){
 try{const result=applyFilterUiFixes(path.resolve(__dirname,".."));process.stdout.write("Multi-filter UI fixes applied ("+result.bytes+" bytes).\n");}
 catch(error){process.stderr.write("Multi-filter UI patch failed: "+(error.stack||error.message)+"\n");process.exitCode=1;}
}
module.exports={applyFilterUiFixes};