"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const shell=fs.readFileSync(path.join(ROOT,"assets","js","main-shell.js"),"utf8");
const build=fs.readFileSync(path.join(ROOT,"assets","css","filters.css"),"utf8");
const tokens=fs.readFileSync(path.join(ROOT,"assets","css","tokens.css"),"utf8");
function fixture(scope,scrollTop){
 const targetKey=scope==="calendar"?"calendarFilters":"reminderFilters";
 const state={calendarFilters:{universityIds:["u1","u2"],unitIds:["unit-1"],eventTypeIds:[]},reminderFilters:{institutionGroupIds:[],universityIds:["u1","u2"],cycleIds:[],unitIds:["unit-1"],eventTypeIds:[]},openMultiFilter:""};
 const list={scrollTop:scrollTop||0};
 const group={dataset:{multiFilter:scope+":universityIds"},querySelector(selector){return selector===".multi-filter-list"?list:null;}};
 const document={querySelectorAll(){return [group];}};
 const frames=[];const window={requestAnimationFrame(callback){frames.push(callback);}};
 const inputs=[{value:"u1",checked:true},{value:"u2",checked:false},{value:"u3",checked:true}];
 const container={dataset:{multiFilter:scope+":universityIds"},querySelector(selector){return selector===".multi-filter-list"?list:null;},querySelectorAll(selector){return selector==="input[data-filter-option]"?inputs:[];}};
 let renders=0,persists=0;
 const start=shell.indexOf("function getMultiFilterSelectedValues(inputs,mode){");
 const end=shell.indexOf("\nfunction resetMultiFilters(scope){",start);
 assert.ok(start>=0&&end>start,"multi-filter helper functions should be present after source restoration");
 const helpers=shell.slice(start,end);
 const api=new Function("state","safeFilterIds","getUnitFilterOptions","getFutureFilterEvents","persistPrefs","renderCalendar","renderProfile","document","window",helpers+"\nreturn {getMultiFilterSelectedValues,updateMultiFilterFromContainer,restoreMultiFilterScroll};")(
  state,values=>Array.from(new Set(values)),()=>[{value:"unit-1"}],()=>[],()=>{persists++;},
  ()=>{renders++;list.scrollTop=0;},()=>{renders++;list.scrollTop=0;},document,window);
 return {api,state,targetKey,container,list,frames,get renders(){return renders;},get persists(){return persists;}};
}
test("সব বাদ clears every selected calendar and reminder value",()=>{
 for(const scope of ["calendar","reminder"]){const f=fixture(scope,84);f.api.updateMultiFilterFromContainer(f.container,"none");assert.deepEqual(f.state[f.targetKey].universityIds,[]);assert.deepEqual(f.state[f.targetKey].unitIds,["unit-1"]);assert.equal(f.state.openMultiFilter,scope+":universityIds");assert.equal(f.renders,1);assert.equal(f.persists,1);assert.equal(f.list.scrollTop,84);}
});
test("সব নির্বাচন includes each available option",()=>{const f=fixture("calendar",0);f.api.updateMultiFilterFromContainer(f.container,"all");assert.deepEqual(f.state.calendarFilters.universityIds,["u1","u2","u3"]);});
test("checkbox change handler records and restores the list scroll position",()=>{
 const listenerStart=shell.indexOf('$("mainContent").addEventListener("change",e=>{');
 const listenerEnd=shell.indexOf('$("mainContent").addEventListener("input",e=>{',listenerStart);
 const listener=shell.slice(listenerStart,listenerEnd);
 assert.ok(listener.includes("const scrollTop=list?list.scrollTop:0;"));
 assert.ok(listener.includes("restoreMultiFilterScroll(key,scrollTop);"));
});
test("filter scroll position is restored immediately and on the next animation frame",()=>{const f=fixture("reminder",0);f.api.restoreMultiFilterScroll("reminder:universityIds",156);assert.equal(f.list.scrollTop,156);f.list.scrollTop=0;assert.equal(f.frames.length,1);f.frames[0]();assert.equal(f.list.scrollTop,156);});
test("Me page replaces the old reminder filter grid with four time toggles",()=>{
 assert.ok(!shell.includes('renderMultiFilter("reminder"'));
 for(const m of ["10080","4320","1440","180"])assert.ok(shell.includes("["+m+","),"missing reminder offset "+m);
 assert.ok(shell.includes('data-offset="'));
});
test("filter CSS targets the actual generated details/list classes",()=>{assert.ok(build.includes(".multi-filter-group{"));assert.ok(build.includes(".multi-filter-summary{"));assert.ok(build.includes(".multi-filter-list{"));assert.ok(build.includes("overflow-y:auto"));});
test("light palette tokens: paper-green surfaces and distinct status colours",()=>{for(const v of ["--bg: #F6F8F4","--card: #FFFFFF","--ok-fg: #256A45","--info-fg: #1F5F99","--maybe-fg: #55429A","--done-fg: #3C5D4A","--now-fg:  #A12A2A"])assert.ok(tokens.includes(v),v);assert.ok(!/gradient|backdrop-filter/.test(tokens));});