(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.AdmissionCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const COLLECTIONS=["universities","admissionCycles","admissionDetails","events","examCenters","circulars","notices","sources"];
  const OFFICIAL=new Set(["official_admission_portal","official_university_notice","official_notice_board","official_authority_announcement"]);
  const MONTH=new Intl.DateTimeFormat("bn-BD",{month:"long",year:"numeric",timeZone:"UTC"});
  const DATE=new Intl.DateTimeFormat("bn-BD",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
  const DATETIME=new Intl.DateTimeFormat("bn-BD",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Dhaka"});
  const TIME=new Intl.DateTimeFormat("bn-BD",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Dhaka"});
  function asDate(value){const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?null:d;}
  function dhakaDateParts(value){
    const d=asDate(value);if(!d)return null;
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const out={};for(const p of parts)if(p.type!=="literal")out[p.type]=Number(p.value);return out;
  }
  function keyFromParts(p){return String(p.year).padStart(4,"0")+"-"+String(p.month).padStart(2,"0")+"-"+String(p.day).padStart(2,"0");}
  function getDhakaDateKey(value){const p=dhakaDateParts(value);return p?keyFromParts(p):null;}
  function parseDateKey(key){
    if(typeof key!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
    const [year,month,day]=key.split("-").map(Number),date=new Date(Date.UTC(year,month-1,day));
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return {year,month,day,date};
  }
  function formatDateKey(key){const p=parseDateKey(key);return p?DATE.format(p.date):"তারিখ অনির্ধারিত";}
  function formatDateTime(value){const d=asDate(value);return d?DATETIME.format(d):"সময় প্রকাশিত হয়নি";}
  function formatTime(value){const d=asDate(value);return d?TIME.format(d):"সময় প্রকাশিত হয়নি";}
  function getMonthLabel(year,month){return MONTH.format(new Date(Date.UTC(year,month-1,1)));}
  function getCalendarCells(year,month){
    if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12)throw new TypeError("Invalid calendar year/month");
    const offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
    const total=Math.ceil((offset+new Date(Date.UTC(year,month,0)).getUTCDate())/7)*7;
    return Array.from({length:total},(_,i)=>{
      const d=new Date(Date.UTC(year,month-1,i-offset+1)),y=d.getUTCFullYear(),m=d.getUTCMonth()+1,day=d.getUTCDate();
      return {key:keyFromParts({year:y,month:m,day}),year:y,month:m,day,inCurrentMonth:y===year&&m===month,weekday:d.getUTCDay()};
    });
  }
  function getWeekKeys(key){
    const p=parseDateKey(key);if(!p)return [];
    const start=new Date(p.date.getTime()-((p.date.getUTCDay()+6)%7)*86400000);
    return Array.from({length:7},(_,i)=>{const d=new Date(start.getTime()+i*86400000);return keyFromParts({year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()});});
  }
  function getDateKeyForEvent(event){if(event&&typeof event.dateOnly==="string"&&parseDateKey(event.dateOnly))return event.dateOnly;return event&&typeof event.startsAt==="string"?getDhakaDateKey(event.startsAt):null;}
  function getReminderEvents(data,universityId,unitDetailId){
    if(!data||typeof universityId!=="string"||!universityId.trim())return [];
    const cycles=new Map((data.admissionCycles||[]).map(x=>[x.id,x]));
    const details=new Map((data.admissionDetails||[]).map(x=>[x.id,x]));
    const allowed=new Set(["officially_confirmed","authority_announced"]);
    return (data.events||[]).filter(event=>{
      const cycle=cycles.get(event.cycleId);
      if(!cycle||cycle.universityId!==universityId)return false;
      if(!allowed.has(event.verification&&event.verification.status))return false;
      const key=getDateKeyForEvent(event);
      if(!key||!parseDateKey(key))return false;
      if(event.dateRange)return false;
      if(unitDetailId){
        const selected=details.get(unitDetailId);
        if(!selected||selected.cycleId!==cycle.id)return false;
        if(event.admissionDetailId)return event.admissionDetailId===unitDetailId;
        return event.appliesToAllUnits===true||!event.admissionDetailId;
      }
      return true;
    }).slice().sort((a,b)=>getDateKeyForEvent(a).localeCompare(getDateKeyForEvent(b))||String(a.id).localeCompare(String(b.id)));
  }
  function getReminderEventsForSelection(data,universityIds,unitDetailIds){
    const universitySet=new Set((Array.isArray(universityIds)?universityIds:[]).filter(x=>typeof x==="string"&&x.trim()));
    if(!universitySet.size)return [];
    const unitIds=Array.from(new Set((Array.isArray(unitDetailIds)?unitDetailIds:[]).filter(x=>typeof x==="string"&&x.trim())));
    const cycles=new Map((data&&data.admissionCycles||[]).map(x=>[x.id,x]));
    const details=new Map((data&&data.admissionDetails||[]).map(x=>[x.id,x]));
    const collected=new Map();
    const add=events=>events.forEach(event=>collected.set(event.id,event));
    if(!unitIds.length){
      universitySet.forEach(universityId=>add(getReminderEvents(data,universityId,null)));
    }else{
      unitIds.forEach(unitId=>{
        const detail=details.get(unitId),cycle=detail&&cycles.get(detail.cycleId);
        if(!cycle||!universitySet.has(cycle.universityId))return;
        add(getReminderEvents(data,cycle.universityId,unitId));
      });
    }
    return Array.from(collected.values()).sort((a,b)=>getDateKeyForEvent(a).localeCompare(getDateKeyForEvent(b))||String(a.id).localeCompare(String(b.id)));
  }
  function getReminderEventsForFilters(data,filters={}){
    if(!data)return [];
    const toSet=value=>new Set((Array.isArray(value)?value:[]).filter(item=>typeof item==="string"&&item.trim()));
    const groups=toSet(filters.institutionGroupIds);
    const universities=toSet(filters.universityIds);
    const cyclesSelected=toSet(filters.cycleIds);
    const units=toSet(filters.unitIds);
    const types=toSet(filters.eventTypeIds);
    const cycles=new Map((data.admissionCycles||[]).map(item=>[item.id,item]));
    const details=new Map((data.admissionDetails||[]).map(item=>[item.id,item]));
    const universityRecords=new Map((data.universities||[]).map(item=>[item.id,item]));
    const allowed=new Set(["officially_confirmed","authority_announced"]);
    return (data.events||[]).filter(event=>{
      const cycle=cycles.get(event.cycleId);
      const university=cycle&&universityRecords.get(cycle.universityId);
      if(!cycle||!university)return false;
      if(!allowed.has(event.verification&&event.verification.status))return false;
      const key=getDateKeyForEvent(event);
      if(!key||!parseDateKey(key))return false;
      if(event.dateRange)return false;
      if(groups.size&&!groups.has(university.institutionGroup))return false;
      if(universities.size&&!universities.has(cycle.universityId))return false;
      if(cyclesSelected.size&&!cyclesSelected.has(cycle.id))return false;
      if(types.size&&!types.has(event.type))return false;
      if(units.size){
        const selectedInCycle=Array.from(units).some(id=>{
          const detail=details.get(id);
          return detail&&detail.cycleId===cycle.id;
        });
        if(!selectedInCycle)return false;
        if(event.admissionDetailId&&!units.has(event.admissionDetailId))return false;
      }
      return true;
    }).slice().sort((a,b)=>getDateKeyForEvent(a).localeCompare(getDateKeyForEvent(b))||String(a.id).localeCompare(String(b.id)));
  }

  function getReminderFilterOptionScope(data,filters={}){
    if(!data)return {institutionGroupIds:[],universityIds:[],cycleIds:[],unitIds:[],eventTypeIds:[]};
    const groups=new Set((Array.isArray(filters.institutionGroupIds)?filters.institutionGroupIds:[]).filter(x=>typeof x==="string"&&x.trim()));
    const universitySelection=new Set((Array.isArray(filters.universityIds)?filters.universityIds:[]).filter(x=>typeof x==="string"&&x.trim()));
    const cycleSelection=new Set((Array.isArray(filters.cycleIds)?filters.cycleIds:[]).filter(x=>typeof x==="string"&&x.trim()));
    const unitSelection=new Set((Array.isArray(filters.unitIds)?filters.unitIds:[]).filter(x=>typeof x==="string"&&x.trim()));
    const groupIds=new Set();
    const universityIds=new Set();
    const cycleIds=new Set();
    const unitIds=new Set();

    (data.filterOptions&&Array.isArray(data.filterOptions.institutionGroups)?data.filterOptions.institutionGroups:[])
      .forEach(item=>{if(item&&typeof item.value==="string"&&item.value.trim())groupIds.add(item.value);});
    (data.universities||[]).forEach(university=>{
      const group=university&&university.institutionGroup;
      if(typeof group==="string"&&group.trim())groupIds.add(group);
      if(!university||!university.id||groups.size&&!groups.has(group))return;
      universityIds.add(university.id);
    });

    const allowedUniversities=universitySelection.size
      ?new Set(Array.from(universitySelection).filter(id=>universityIds.has(id)))
      :universityIds;
    (data.admissionCycles||[]).forEach(cycle=>{
      if(!cycle||!cycle.id||!allowedUniversities.has(cycle.universityId))return;
      cycleIds.add(cycle.id);
    });

    const allowedCycles=cycleSelection.size
      ?new Set(Array.from(cycleSelection).filter(id=>cycleIds.has(id)))
      :cycleIds;
    (data.admissionDetails||[]).forEach(detail=>{
      if(!detail||!detail.id||!allowedCycles.has(detail.cycleId))return;
      if(unitSelection.size&&!unitSelection.has(detail.id))return;
      unitIds.add(detail.id);
    });

    const eventTypeIds=new Set();
    (data.filterOptions&&Array.isArray(data.filterOptions.eventTypes)?data.filterOptions.eventTypes:[])
      .forEach(item=>{if(item&&typeof item.value==="string"&&item.value.trim())eventTypeIds.add(item.value);});

    return {
      institutionGroupIds:Array.from(groupIds),
      universityIds:Array.from(universityIds),
      cycleIds:Array.from(cycleIds),
      unitIds:Array.from(unitIds),
      eventTypeIds:Array.from(eventTypeIds)
    };
  }

  function createReminderSchedule(event,now){
    if(event&&event.dateRange)return null;
    const key=getDateKeyForEvent(event),parts=parseDateKey(key);
    if(!parts)return null;
    const eventAt=Date.UTC(parts.year,parts.month-1,parts.day,3,0,0,0);
    const current=Number.isFinite(Number(now))?Number(now):Date.now();
    if(eventAt<=current)return null;
    const planned=Date.UTC(parts.year,parts.month-1,parts.day-2,3,0,0,0);
    const notifyImmediately=planned<=current;
    return {id:event.id,title:String(event.title||"ভর্তি-সংক্রান্ত তারিখ").slice(0,180),dateKey:key,eventAt,notifyAt:notifyImmediately?current:planned,notifyImmediately,status:event.verification&&event.verification.status||""};
  }
  function indexById(items){return new Map((Array.isArray(items)?items:[]).map(item=>[item.id,item]));}
  function normalizeSearch(value){return String(value==null?"":value).normalize("NFKC").trim().toLocaleLowerCase("bn-BD");}
  function getUnitCategories(value){
    const text=normalizeSearch(value).replace(/[–—-]/g," ");
    const found=new Set();
    let match;
    const afterUnit=/\bunit\s*([a-e])\b/g;
    const beforeUnit=/\b([a-e])\s*unit\b/g;
    const combined=/\bunit\s*([a-e])\s*(?:&|ও|এবং)\s*([a-e])\b/g;
    while((match=afterUnit.exec(text)))found.add(match[1].toUpperCase());
    while((match=beforeUnit.exec(text)))found.add(match[1].toUpperCase());
    while((match=combined.exec(text))){found.add(match[1].toUpperCase());found.add(match[2].toUpperCase());}
    return found;
  }
  function matchesUnitGroup(detail,selected){
    if(!detail)return false;
    if(selected==="all"||!selected)return true;
    if(selected.indexOf("unit:")===0)return getUnitCategories(detail.unitGroup).has(selected.slice(5));
    return detail.unitGroup===selected;
  }
  function selectedFilterMatches(selected,value){
    if(!selected||selected==="all")return true;
    const values=Array.isArray(selected)?selected:[selected];
    return !values.length||values.includes(value);
  }
  function filterEvents(dataset,filters={}){
    const cycles=indexById(dataset.admissionCycles),details=indexById(dataset.admissionDetails),universities=indexById(dataset.universities),query=normalizeSearch(filters.query);
    return (dataset.events||[]).filter(event=>{
      const cycle=cycles.get(event.cycleId),uni=cycle&&universities.get(cycle.universityId),detail=event.admissionDetailId&&details.get(event.admissionDetailId);
      if(!selectedFilterMatches(filters.type,event.type))return false;
      if(!selectedFilterMatches(filters.institutionGroup,uni&&uni.institutionGroup))return false;
      if(!selectedFilterMatches(filters.cycleId,event.cycleId))return false;
      if(!selectedFilterMatches(filters.universityId,cycle&&cycle.universityId))return false;
      const selectedUnits=Array.isArray(filters.unitGroup)?filters.unitGroup:(filters.unitGroup&&filters.unitGroup!=="all"?[filters.unitGroup]:[]);
      const isCycleWide=event.appliesToAllUnits===true&&!event.admissionDetailId;
      if(selectedUnits.length&&!isCycleWide&&!selectedUnits.some(function (unit) { return matchesUnitGroup(detail,unit); }))return false;
      const eventDateKey=getDateKeyForEvent(event);
      const dateRange=event.dateRange;
      if(filters.dateKey){
        const matchesDate=dateRange
          ? filters.dateKey>=dateRange.startsOn&&filters.dateKey<=dateRange.endsOn
          : eventDateKey===filters.dateKey;
        if(!matchesDate)return false;
      }
      if(filters.dateKeys){
        const matchesPeriod=dateRange
          ? filters.dateKeys.some(key=>key>=dateRange.startsOn&&key<=dateRange.endsOn)
          : filters.dateKeys.includes(eventDateKey);
        if(!matchesPeriod)return false;
      }
      if(query&&!normalizeSearch([event.title,event.type,uni&&uni.name,uni&&uni.shortName,...(uni&&Array.isArray(uni.aliases)?uni.aliases:[]),...(uni&&Array.isArray(uni.memberInstitutions)?uni.memberInstitutions:[]),detail&&detail.unitGroup,cycle&&cycle.session].filter(Boolean).join(" ")).includes(query))return false;
      return true;
    }).slice().sort((a,b)=>String(getDateKeyForEvent(a)||"").localeCompare(String(getDateKeyForEvent(b)||""))||String(a.startsAt||"").localeCompare(String(b.startsAt||""))||String(a.id).localeCompare(String(b.id)));
  }


  function getCalendarFilterOptionScope(dataset,filters={}){
    if(!dataset)return {institutionGroupIds:[],universityIds:[],cycleIds:[],unitDetailIds:[],eventTypeIds:[]};
    const cycles=indexById(dataset.admissionCycles),details=indexById(dataset.admissionDetails),universities=indexById(dataset.universities);
    const detailsByCycle=new Map();
    (dataset.admissionDetails||[]).forEach(detail=>{
      if(!detailsByCycle.has(detail.cycleId))detailsByCycle.set(detail.cycleId,[]);
      detailsByCycle.get(detail.cycleId).push(detail.id);
    });
    const selectedGroups=filters.institutionGroup||[];
    const selectedUniversities=filters.universityId||[];
    const selectedCycles=filters.cycleId||[];
    const selectedUnits=Array.isArray(filters.unitGroup)
      ? filters.unitGroup
      : (filters.unitGroup&&filters.unitGroup!=="all"?[filters.unitGroup]:[]);
    const groupIds=new Set(),universityIds=new Set(),cycleIds=new Set(),unitDetailIds=new Set(),eventTypeIds=new Set();
    (dataset.events||[]).forEach(event=>{
      const cycle=cycles.get(event.cycleId),university=cycle&&universities.get(cycle.universityId);
      const detail=event.admissionDetailId?details.get(event.admissionDetailId):null;
      if(university&&typeof university.institutionGroup==="string"&&university.institutionGroup)
        groupIds.add(university.institutionGroup);

      if(!selectedFilterMatches(selectedGroups,university&&university.institutionGroup))return;
      if(cycle)universityIds.add(cycle.universityId);
      if(!selectedFilterMatches(selectedUniversities,cycle&&cycle.universityId))return;
      cycleIds.add(event.cycleId);
      if(!selectedFilterMatches(selectedCycles,event.cycleId))return;

      if(event.admissionDetailId)unitDetailIds.add(event.admissionDetailId);
      else if(event.appliesToAllUnits===true){
        (detailsByCycle.get(event.cycleId)||[]).forEach(id=>unitDetailIds.add(id));
      }

      const isCycleWide=event.appliesToAllUnits===true&&!event.admissionDetailId;
      if(selectedUnits.length&&!isCycleWide&&!selectedUnits.some(unit=>matchesUnitGroup(detail,unit)))return;
      if(typeof event.type==="string"&&event.type)eventTypeIds.add(event.type);
    });
    return {
      institutionGroupIds:Array.from(groupIds),
      universityIds:Array.from(universityIds),
      cycleIds:Array.from(cycleIds),
      unitDetailIds:Array.from(unitDetailIds),
      eventTypeIds:Array.from(eventTypeIds)
    };
  }

  function getVisibleUniversities(dataset,filters={}){
    const cycles=dataset.admissionCycles||[],details=dataset.admissionDetails||[],query=normalizeSearch(filters.query);
    const output=(dataset.universities||[]).filter(uni=>{
      const own=cycles.filter(c=>c.universityId===uni.id),ids=new Set(own.map(c=>c.id));
      if(filters.cycleId&&filters.cycleId!=="all"&&!own.some(c=>c.id===filters.cycleId))return false;
      if(filters.unitGroup&&filters.unitGroup!=="all"&&!details.some(d=>ids.has(d.cycleId)&&matchesUnitGroup(d,filters.unitGroup)))return false;
      if(filters.status&&filters.status!=="all"){
        const statuses=[uni.verification&&uni.verification.status];
        own.forEach(c=>statuses.push(c.verification&&c.verification.status));
        details.filter(d=>ids.has(d.cycleId)).forEach(d=>statuses.push(d.verification&&d.verification.status));
        if(!statuses.includes(filters.status))return false;
      }
      const aliases=Array.isArray(uni.aliases)?uni.aliases:[];
      if(query&&!normalizeSearch([uni.name,uni.shortName,...aliases,...(Array.isArray(uni.memberInstitutions)?uni.memberInstitutions:[])].filter(Boolean).join(" ")).includes(query))return false;
      return true;
    });
    const verifiedAt=x=>x&&x.verification&&x.verification.lastVerifiedAt?Date.parse(x.verification.lastVerifiedAt)||0:0;
    if(filters.sort==="recent")output.sort((a,b)=>{
      const latest=u=>Math.max(verifiedAt(u),...cycles.filter(c=>c.universityId===u.id).map(verifiedAt),...details.filter(d=>cycles.some(c=>c.id===d.cycleId&&c.universityId===u.id)).map(verifiedAt));
      return latest(b)-latest(a)||a.name.localeCompare(b.name,"bn");
    });else output.sort((a,b)=>a.name.localeCompare(b.name,"bn"));
    return output;
  }
  const VALID_STATUSES=new Set(["officially_confirmed","authority_announced","tentative","awaiting_official_notice","changed","updated","pending_review"]);
  const VALID_SOURCE_TYPES=new Set(["official_admission_portal","official_university_notice","official_notice_board","official_authority_announcement","third_party_discovery_only"]);
  const VALID_EVENT_TYPES=new Set(["application_open","application_deadline","admit_card_open","admit_card_deadline","admission_test","result_publication","other"]);
  const DATE_TIME_RE=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  function isTentativeStatus(status){return status==="tentative"||!VALID_STATUSES.has(status);}
  function getEventCountdown(event,todayKey){
    const eventKey=getDateKeyForEvent(event),eventDate=parseDateKey(eventKey),today=parseDateKey(todayKey);
    if(!eventDate||!today)return null;
    const rangeEnd=event&&event.dateRange&&parseDateKey(event.dateRange.endsOn);
    const isRangeActive=Boolean(rangeEnd&&todayKey>=eventKey&&todayKey<=event.dateRange.endsOn);
    const isRangePast=Boolean(rangeEnd&&todayKey>event.dateRange.endsOn);
    const days=isRangeActive?0:(isRangePast?-1:Math.round((eventDate.date.getTime()-today.date.getTime())/86400000));
    if(days>60)return null;
    const status=event&&event.verification?event.verification.status:undefined;
    const isApproximate=isTentativeStatus(status);
    let label;
    if(isRangeActive)label="সময়সীমা চলছে";
    else if(days<0)label="শেষ হয়েছে";
    else if(days===0)label="আজ";
    else if(days===1)label="আগামীকাল";
    else label=days.toLocaleString("bn-BD")+" দিন বাকি";
    if(isApproximate)label="আনুমানিক · "+label;
    const isDeadline=event&&["application_deadline","admit_card_deadline"].includes(event.type);
    return {days:days,label:label,isApproximate:isApproximate,
      isUrgent:!event.dateRange&&status==="officially_confirmed"&&isDeadline&&days>=0&&days<=7};
  }
  function validDateTime(value){
    if(typeof value!=="string")return false;
    const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
    if(!match)return false;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    const hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]);
    if(month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate())return false;
    if(hour>23||minute>59||second>59)return false;
    if(match[8]){
      const offsetHour=Number(match[8]),offsetMinute=Number(match[9]);
      if(offsetHour>14||offsetMinute>59||(offsetHour===14&&offsetMinute!==0))return false;
    }
    return !Number.isNaN(Date.parse(value));
  }
  function validHttpUrl(value){try{const url=new URL(value);return (url.protocol==="https:"||url.protocol==="http:")&&Boolean(url.hostname);}catch(_){return false;}}

  function getApplicationWindowsForEvent(event,dataset){
    const empty={windows:[],detailCount:0,coveredDetailCount:0};
    if(!event||!dataset||!["application_open","application_deadline"].includes(event.type))return empty;
    const all=Array.isArray(dataset.admissionDetails)?dataset.admissionDetails:[];
    let records=[];
    if(event.admissionDetailId){
      records=all.filter(detail=>detail.id===event.admissionDetailId&&detail.cycleId===event.cycleId);
    }else if(event.appliesToAllUnits===true){
      records=all.filter(detail=>detail.cycleId===event.cycleId);
    }else return empty;
    const grouped=new Map();
    let coveredDetailCount=0;
    records.forEach(detail=>{
      const application=detail.application||{};
      const opensAt=application.opensAt||null;
      const opensOn=opensAt?null:(application.opensOn||null);
      const closesAt=application.closesAt||null;
      const closesOn=closesAt?null:(application.closesOn||null);
      if(!opensAt&&!opensOn&&!closesAt&&!closesOn)return;
      coveredDetailCount++;
      const key=JSON.stringify([opensAt,opensOn,closesAt,closesOn]);
      let window=grouped.get(key);
      if(!window){
        window={opensAt,opensOn,closesAt,closesOn,unitGroups:[]};
        grouped.set(key,window);
      }
      window.unitGroups.push(detail.unitGroup||detail.id);
    });
    return {windows:Array.from(grouped.values()),detailCount:records.length,coveredDetailCount};
  }

  function validateDataset(data){
    const errors=[];
    if(!data||typeof data!=="object"||Array.isArray(data))return ["Dataset root must be an object."];
    if(data.schemaVersion!=="1.0.0")errors.push("schemaVersion must be 1.0.0.");
    COLLECTIONS.forEach(k=>{if(!Array.isArray(data[k]))errors.push(k+" must be an array.");});
    if(errors.length)return errors;
    if(data.filterOptions!==undefined){
      const options=data.filterOptions;
      if(!options||typeof options!=="object"||Array.isArray(options)){
        errors.push("filterOptions must be an object.");
      }else{
        ["institutionGroups","eventTypes"].forEach(key=>{
          if(!Array.isArray(options[key])){errors.push("filterOptions."+key+" must be an array.");return;}
          const seen=new Set();
          options[key].forEach((item,index)=>{
            if(!item||typeof item!=="object"||Array.isArray(item)||
              typeof item.value!=="string"||!item.value.trim()||item.value.length>100||
              typeof item.label!=="string"||!item.label.trim()||item.label.length>180){
              errors.push("filterOptions."+key+"["+index+"] requires a value and label.");
              return;
            }
            if(seen.has(item.value))errors.push("filterOptions."+key+" contains duplicate value "+item.value+".");
            seen.add(item.value);
          });
        });
      }
    }
    const configuredEventTypes=new Set(
      data.filterOptions&&Array.isArray(data.filterOptions.eventTypes)
        ? data.filterOptions.eventTypes.filter(item=>item&&typeof item.value==="string").map(item=>item.value)
        : []
    );
    const configuredInstitutionGroups=new Set(
      data.filterOptions&&Array.isArray(data.filterOptions.institutionGroups)
        ? data.filterOptions.institutionGroups.filter(item=>item&&typeof item.value==="string").map(item=>item.value)
        : []
    );
    const maps=Object.create(null);
    COLLECTIONS.forEach(k=>{
      maps[k]=new Map();
      data[k].forEach((r,i)=>{
        if(!r||typeof r!=="object"||Array.isArray(r)||typeof r.id!=="string"||!r.id.trim()){errors.push(k+"["+i+"] requires an id.");return;}
        if(maps[k].has(r.id))errors.push(k+" contains duplicate id "+r.id+".");
        else maps[k].set(r.id,r);
      });
    });
    const ref=(kind,id,ctx)=>{
      const item=typeof id==="string"?maps[kind].get(id):null;
      if(!item){errors.push(ctx+" references missing "+kind+" id "+String(id)+".");return null;}
      return item;
    };
    const date=(value,ctx,nullable=true)=>{
      if((value===null||value===undefined)&&nullable)return;
      if(!validDateTime(value))errors.push(ctx+" must be a timezone-qualified ISO 8601 date-time"+(nullable?" or null":"")+".");
    };
    const url=(value,ctx,nullable=true)=>{
      if((value===null||value===undefined)&&nullable)return;
      if(!validHttpUrl(value))errors.push(ctx+" must be an HTTP(S) URL"+(nullable?" or null":"")+".");
    };
    const gpa=(value,max,ctx)=>{
      if(value===undefined||value===null)return;
      if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>max)errors.push(ctx+" must be a number between 0 and "+max+".");
    };
    const verify=(record,ctx,allowUnknownStatus=false)=>{
      const v=record.verification;
      if(!v||typeof v!=="object"||Array.isArray(v)){errors.push(ctx+" is missing verification metadata.");return;}
      if(!VALID_STATUSES.has(v.status)&&!allowUnknownStatus)errors.push(ctx+" has an invalid verification status.");
      if(v.lastVerifiedAt===undefined)errors.push(ctx+".verification.lastVerifiedAt is required (use null when unknown).");
      else if(v.lastVerifiedAt!==null)date(v.lastVerifiedAt,ctx+".verification.lastVerifiedAt",false);
      if(!Array.isArray(v.sources)){errors.push(ctx+".verification.sources must be an array.");return;}
      const seen=new Set(),sources=[];
      v.sources.forEach((s,i)=>{
        if(!s||typeof s!=="object"||Array.isArray(s)){errors.push(ctx+".verification.sources["+i+"] must be an object.");return;}
        if(seen.has(s.sourceId))errors.push(ctx+" contains duplicate source reference "+String(s.sourceId)+".");
        seen.add(s.sourceId);
        const source=ref("sources",s.sourceId,ctx+".verification.sources["+i+"]");
        if(!Array.isArray(s.supports)||!s.supports.length||s.supports.some(x=>typeof x!=="string"||!x.trim()))errors.push(ctx+".verification.sources["+i+"].supports must list at least one supported field.");
        if(source)sources.push(source);
      });
      if(v.status==="officially_confirmed"){
        if(!validDateTime(v.lastVerifiedAt))errors.push(ctx+" is confirmed without a valid verification timestamp.");
        if(!sources.some(s=>VALID_SOURCE_TYPES.has(s.sourceType)&&s.sourceType!=="third_party_discovery_only"))errors.push(ctx+" is confirmed without a referenced official source.");
      }
      if(v.status==="authority_announced"){
        if(!validDateTime(v.lastVerifiedAt))errors.push(ctx+" is authority-announced without a valid verification timestamp.");
        if(!sources.length)errors.push(ctx+" is authority-announced without a referenced source.");
        if(typeof v.changeNote!=="string"||!v.changeNote.trim())errors.push(ctx+" is authority-announced without a change note.");
      }
      if(v.status==="pending_review"&&!sources.some(s=>OFFICIAL.has(s.sourceType))){
        errors.push(ctx+" is pending review without a referenced official source.");
      }
    };
    data.sources.forEach(r=>{
      if(!VALID_SOURCE_TYPES.has(r.sourceType))errors.push("source:"+r.id+" has an invalid sourceType.");
      if(typeof r.label!=="string"||r.label.length<2||r.label.length>180)errors.push("source:"+r.id+" has an invalid label.");
      if(r.documentReference!==undefined&&(typeof r.documentReference!=="string"||r.documentReference.length>300))errors.push("source:"+r.id+" has an invalid documentReference.");
      url(r.url,"source:"+r.id+".url",false);
      date(r.retrievedAt,"source:"+r.id+".retrievedAt",false);
    });
    data.universities.forEach(r=>{
      if(r.institutionGroup!==undefined&&!["general_public_university","engineering_university","specialized_public_institution","army_administered_private_university","admission_cluster","medical_admission","open_university"].includes(r.institutionGroup)&&!configuredInstitutionGroups.has(r.institutionGroup))errors.push("university:"+r.id+" has an invalid institutionGroup.");
      url(r.officialWebsite,"university:"+r.id+".officialWebsite");
      url(r.admissionWebsite,"university:"+r.id+".admissionWebsite");
      verify(r,"university:"+r.id);
    });
    data.admissionCycles.forEach(r=>{
      ref("universities",r.universityId,"admissionCycle:"+r.id);
      if(typeof r.session!=="string"||!/^20\d{2}-\d{2}$/.test(r.session))errors.push("admissionCycle:"+r.id+" has an invalid session.");
      if(r.cycleLabel!==undefined&&(typeof r.cycleLabel!=="string"||r.cycleLabel.length>100))errors.push("admissionCycle:"+r.id+" has an invalid cycleLabel.");
      verify(r,"admissionCycle:"+r.id);
    });
    data.admissionDetails.forEach(r=>{
      ref("admissionCycles",r.cycleId,"admissionDetail:"+r.id);
      if(typeof r.unitGroup!=="string"||!r.unitGroup.trim()||r.unitGroup.length>100)errors.push("admissionDetail:"+r.id+" requires a unitGroup of 1–100 characters.");
      const app=r.application||{};
      date(app.opensAt,"admissionDetail:"+r.id+".application.opensAt");
      date(app.closesAt,"admissionDetail:"+r.id+".application.closesAt");
      if(app.opensOn!==undefined&&app.opensOn!==null&&!parseDateKey(app.opensOn))errors.push("admissionDetail:"+r.id+".application.opensOn must be a valid YYYY-MM-DD date.");
      if(app.closesOn!==undefined&&app.closesOn!==null&&!parseDateKey(app.closesOn))errors.push("admissionDetail:"+r.id+".application.closesOn must be a valid YYYY-MM-DD date.");
      url(app.applicationUrl,"admissionDetail:"+r.id+".application.applicationUrl");
      if(app.feeBDT!==undefined&&app.feeBDT!==null&&(typeof app.feeBDT!=="number"||!Number.isFinite(app.feeBDT)||app.feeBDT<0))errors.push("admissionDetail:"+r.id+" has an invalid application fee.");
      if(app.totalProgramFeeBDT!==undefined&&app.totalProgramFeeBDT!==null&&(typeof app.totalProgramFeeBDT!=="number"||!Number.isFinite(app.totalProgramFeeBDT)||app.totalProgramFeeBDT<0))errors.push("admissionDetail:"+r.id+" has an invalid total programme fee.");
      const eligibility=r.eligibility||{};
      gpa(eligibility.minimumCombinedGpa,10,"admissionDetail:"+r.id+".eligibility.minimumCombinedGpa");
      gpa(eligibility.minimumHscGpa,5,"admissionDetail:"+r.id+".eligibility.minimumHscGpa");
      gpa(eligibility.minimumSscGpa,5,"admissionDetail:"+r.id+".eligibility.minimumSscGpa");
      const exam=r.exam||{},admit=exam.admitCard||{};
      date(exam.startsAt,"admissionDetail:"+r.id+".exam.startsAt");
      date(exam.endsAt,"admissionDetail:"+r.id+".exam.endsAt");
      if(exam.dateOnly!==undefined&&exam.dateOnly!==null&&!parseDateKey(exam.dateOnly))errors.push("admissionDetail:"+r.id+".exam.dateOnly must be a valid YYYY-MM-DD date.");
      if(exam.format!==undefined&&exam.format!==null&&(typeof exam.format!=="string"||exam.format.length>120))errors.push("admissionDetail:"+r.id+".exam.format exceeds 120 characters.");
      if(exam.venue!==undefined&&exam.venue!==null&&(typeof exam.venue!=="string"||exam.venue.length>300))errors.push("admissionDetail:"+r.id+".exam.venue exceeds 300 characters.");
      date(admit.availableFrom,"admissionDetail:"+r.id+".exam.admitCard.availableFrom");
      date(admit.availableUntil,"admissionDetail:"+r.id+".exam.admitCard.availableUntil");
      url(admit.url,"admissionDetail:"+r.id+".exam.admitCard.url");
      if(exam.durationMinutes!==undefined&&exam.durationMinutes!==null&&(!Number.isInteger(exam.durationMinutes)||exam.durationMinutes<1))errors.push("admissionDetail:"+r.id+" has an invalid exam duration.");
      if(r.circularIds!==undefined&&!Array.isArray(r.circularIds))errors.push("admissionDetail:"+r.id+".circularIds must be an array.");
      (Array.isArray(r.circularIds)?r.circularIds:[]).forEach(id=>{
        const circular=ref("circulars",id,"admissionDetail:"+r.id);
        if(circular&&circular.cycleId!==r.cycleId)errors.push("admissionDetail:"+r.id+" links a circular from another cycle.");
      });
      verify(r,"admissionDetail:"+r.id);
    });
    data.events.forEach(r=>{
      ref("admissionCycles",r.cycleId,"event:"+r.id);
      if(r.admissionDetailId){
        const detail=ref("admissionDetails",r.admissionDetailId,"event:"+r.id);
        if(detail&&detail.cycleId!==r.cycleId)errors.push("event:"+r.id+" links an admission detail from another cycle.");
      }
      if(!VALID_EVENT_TYPES.has(r.type)&&!configuredEventTypes.has(r.type))errors.push("event:"+r.id+" has an invalid event type.");
      if(r.appliesToAllUnits!==undefined&&typeof r.appliesToAllUnits!=="boolean")errors.push("event:"+r.id+" has an invalid appliesToAllUnits flag.");
      if(r.appliesToAllUnits===true&&r.admissionDetailId)errors.push("event:"+r.id+" cannot be both cycle-wide and linked to one admission detail.");
      if(!r.admissionDetailId&&r.appliesToAllUnits!==true)errors.push("event:"+r.id+" requires an admissionDetailId or appliesToAllUnits:true.");
      if(r.dateRange!==undefined&&r.dateRange!==null){
        const range=r.dateRange;
        const validRange=range&&typeof range==="object"&&!Array.isArray(range)&&
          parseDateKey(range.startsOn)&&parseDateKey(range.endsOn)&&range.startsOn<=range.endsOn;
        if(!validRange||r.dateOnly!==range.startsOn||r.startsAt!==undefined&&r.startsAt!==null||r.endsAt!==undefined&&r.endsAt!==null){
          errors.push("event:"+r.id+" has an invalid dateRange; use a date-only start and end without clock times.");
        }
      }
      if(r.startsAt===undefined||r.startsAt===null){
        if(!parseDateKey(r.dateOnly))errors.push("event:"+r.id+" requires a timezone-qualified startsAt or a valid dateOnly value.");
      }else date(r.startsAt,"event:"+r.id+".startsAt",false);
      if(r.dateOnly!==undefined&&r.dateOnly!==null&&!parseDateKey(r.dateOnly))errors.push("event:"+r.id+".dateOnly must be a valid YYYY-MM-DD date.");
      if(r.dateOnly&&typeof r.startsAt==="string"&&parseDateKey(r.dateOnly)&&getDhakaDateKey(r.startsAt)!==r.dateOnly){
        errors.push("event:"+r.id+" dateOnly does not match startsAt in Asia/Dhaka.");
      }
      date(r.endsAt,"event:"+r.id+".endsAt");
      if(typeof r.startsAt==="string"&&typeof r.endsAt==="string"&&Date.parse(r.endsAt)<Date.parse(r.startsAt)){
        errors.push("event:"+r.id+" endsAt precedes startsAt.");
      }
      verify(r,"event:"+r.id,true);
    });
    data.examCenters.forEach(r=>{ref("admissionCycles",r.cycleId,"examCenter:"+r.id);verify(r,"examCenter:"+r.id);});
    data.circulars.forEach(r=>{
      ref("admissionCycles",r.cycleId,"circular:"+r.id);
      url(r.documentUrl,"circular:"+r.id+".documentUrl",false);
      date(r.publishedAt,"circular:"+r.id+".publishedAt");
      verify(r,"circular:"+r.id);
    });
    data.notices.forEach(r=>{
      ref("admissionCycles",r.cycleId,"notice:"+r.id);
      const source=ref("sources",r.sourceId,"notice:"+r.id);
      date(r.publishedAt,"notice:"+r.id+".publishedAt");
      if(!["needs_review","reviewed","dismissed"].includes(r.reviewStatus))errors.push("notice:"+r.id+" has an invalid reviewStatus.");
      if(r.reviewStatus==="needs_review"&&source&&!OFFICIAL.has(source.sourceType)&&source.sourceType!=="third_party_discovery_only"){
        errors.push("notice:"+r.id+" is pending review without an allowed official or discovery-only source.");
      }
    });
    return errors;
  }
  const STATUS={officially_confirmed:"অফিসিয়ালি নিশ্চিত",authority_announced:"কর্তৃপক্ষ-ঘোষিত",tentative:"সম্ভাব্য",awaiting_official_notice:"অফিসিয়াল বিজ্ঞপ্তির অপেক্ষায়",changed:"পরিবর্তিত",updated:"হালনাগাদ",pending_review:"Pending..."};
  const EVENT={application_open:"আবেদন শুরু",application_deadline:"আবেদনের শেষ সময়",admit_card_open:"অ্যাডমিট কার্ড",admit_card_deadline:"অ্যাডমিট কার্ডের শেষ সময়",admission_test:"ভর্তি পরীক্ষা",result_publication:"ফলাফল প্রকাশ",other:"অন্যান্য"};
  const SOURCE={official_admission_portal:"অফিসিয়াল ভর্তি পোর্টাল",official_university_notice:"বিশ্ববিদ্যালয়ের বিজ্ঞপ্তি",official_notice_board:"বিশ্ববিদ্যালয়ের নোটিশ বোর্ড",official_authority_announcement:"কর্তৃপক্ষের ঘোষণা",third_party_discovery_only:"সংবাদমাধ্যম / তৃতীয় পক্ষের সূত্র"};
  return Object.freeze({COLLECTIONS,OFFICIAL_SOURCE_TYPES:OFFICIAL,asDate,dhakaDateParts,getDhakaDateKey,parseDateKey,formatDateKey,formatDateTime,formatTime,getMonthLabel,getCalendarCells,getWeekKeys,getDateKeyForEvent,getReminderEvents,getReminderEventsForSelection,getReminderEventsForFilters,getCalendarFilterOptionScope,getReminderFilterOptionScope,createReminderSchedule,getEventCountdown,getApplicationWindowsForEvent,isTentativeStatus,filterEvents,getVisibleUniversities,validateDataset,getSourceTypeLabel:t=>SOURCE[t]||"সূত্র",getStatusLabel:s=>STATUS[s]||"যাচাইয়ের তথ্য নেই",getEventTypeLabel:t=>EVENT[t]||"ভর্তি কার্যক্রম"});
});