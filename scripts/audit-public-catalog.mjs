#!/usr/bin/env node
// Read-only public catalog audit. Never writes raw CRM records or credentials.
import fs from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';
import { fetchCursorPages } from '../src/lib/lenaqar/fetch-cursor-pages.js';
import { toPublicOpportunity } from '../src/lib/lenaqar/to-public-opportunity.js';
import { unitArithmetic, assessPublicMoney, isOpportunityIndexable } from '../src/lib/lenaqar/unit-trust.js';
import { isListableOpportunity } from '../src/lib/lenaqar/validate-unit.js';
nextEnv.loadEnvConfig(process.cwd());
const { SITE, lenaqarInventoryQuery } = await import('../src/config/site.js');
const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/audit-public-catalog.mjs OUTPUT.json');
let pageCount=0;
const raw=await fetchCursorPages({
 maxPages:SITE.feed.maxPages,maxRecords:SITE.feed.maxUnits,maxDurationMs:SITE.feed.maxDurationMs,
 getRecordKey:r=>r.code,
 fetchPage:async cursor=>{
  const q=new URLSearchParams({...lenaqarInventoryQuery(),page_size:String(SITE.feed.pageSize)});
  if(cursor)q.set('cursor',cursor);
  const response=await fetch('https://api.lenaai.net/public/v1/units?'+q,{
   headers:{'X-API-Key':process.env.X_API_KEY||process.env.NEXT_PUBLIC_X_API_KEY||'',
    'X-BFF-Secret':process.env.BFF_SECRET||'',
    'User-Agent':'LenaQar-Marketplace/1.0 (+https://www.lenaqar.com; server-side catalog)'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Catalog HTTP '+response.status);
  const j=await response.json(); const d=j.data||j;pageCount++;
  return {records:d.units,hasMore:d.pagination?.has_more_next,nextCursor:d.pagination?.next_cursor};
 }
});
const rows=raw.map(r=>{
 const unit=toPublicOpportunity(r);
 const assessment=assessPublicMoney(unit?.paymentSplitHidden ? {
  totalPrice:r.totalPrice??r.total_price,downPayment:r.downPayment??r.down_payment,
  remainingAmount:r.remainingAmount??r.remaining_amount,overPrice:r.overPrice??r.over_price,
  installmentYears:r.installmentYears??r.installment_years,
  installmentAmountYearly:r.installmentAmountYearly??r.installment_amount_yearly
 }:unit,{paidAmount:r.paidAmount??r.paid_amount});
 return {code:r.code,rawArithmeticFailure:!unitArithmetic(r).ok,publicSplitHidden:unit?.paymentSplitHidden===true,
  reason:assessment.reason,listable:isListableOpportunity(unit),indexable:isOpportunityIndexable(unit),
  mediaExcluded:(Array.isArray(r.images)?r.images.length:r.image?1:0)-(unit?.images.length||0)};
});
const summary={observedAt:new Date().toISOString(),complete:true,pages:pageCount,units:rows.length,
 rawArithmeticFailures:rows.filter(r=>r.rawArithmeticFailure).length,
 publicHidden:rows.filter(r=>r.publicSplitHidden).length,
 listable:rows.filter(r=>r.listable).length,indexable:rows.filter(r=>r.listable&&r.indexable).length,
 mediaExcluded:rows.reduce((sum,r)=>sum+Math.max(0,r.mediaExcluded),0),
 reasons:Object.fromEntries([...new Set(rows.map(r=>r.reason))].map(reason=>[reason,rows.filter(r=>r.reason===reason).length]))};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({summary,rows},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
