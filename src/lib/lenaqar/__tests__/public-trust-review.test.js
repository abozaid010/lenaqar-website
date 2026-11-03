import { serializeJsonLd } from '../json-ld.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { toPublicOpportunity } from '../to-public-opportunity.js';
import { applyPublicMoneyTrust, assessPublicMoney } from '../unit-trust.js';
import { applyRequirementMoneyTrust } from '../requirement-money-trust.js';
import { buildListingSchema } from '../listing-seo.js';

const unit = { code: 'MguPxCF0', total_price: 1000000, down_payment: 700000,
  remaining_amount: 800000, paid_amount: 200000, installment_years: 10 };
test('paid identity alone cannot validate conflicting down; internal paid stays private',()=>{
 const assessment=assessPublicMoney({totalPrice:1000000,downPayment:700000,remainingAmount:800000},{paidAmount:200000});
 assert.deepEqual(assessment,{showSplit:false,reason:'paid_identity_only'});
 const result=toPublicOpportunity(unit);
 assert.equal(result.paymentSplitHidden,true);assert.equal(result.downPayment,null);assert.equal(result.installmentYears,null);
 assert.equal(result.totalPrice,1000000);assert.equal('paidAmount' in result,false);assert.equal('paid_amount' in result,false);
 assert.deepEqual(applyPublicMoneyTrust(result),result);
});
test('valid primary identity preserved even when optional paid evidence is absent',()=>{
 const result=toPublicOpportunity({...unit,down_payment:200000});
 assert.equal(result.downPayment,200000);assert.equal(result.installmentYears,10);assert.equal(result.paymentSplitHidden,undefined);
});
test('reviewed schedule omitted including query variants; ordinary images and schema preserved',()=>{
 const result=toPublicOpportunity({...unit,images:[{url:'https://api.lenaai.net/gcs/homey_ee175730?cache=2'},{url:'https://api.lenaai.net/gcs/property-photo'}]});
 assert.deepEqual(result.images,[{url:'https://api.lenaai.net/gcs/property-photo'}]);
 assert.equal(JSON.stringify(result).includes('ee175730'),false);
 assert.deepEqual(buildListingSchema(result,'https://www.lenaqar.com/opportunities/MguPxCF0').image,['https://api.lenaai.net/gcs/property-photo']);
 assert.deepEqual(toPublicOpportunity({...unit,image:'https://api.lenaai.net/gcs/homey_ee175730'}).images,[]);
});
test('review holds redact both structured money and Latin/Arabic note claims before serialization',()=>{
 for(const id of ['61240565aa04','f4eaaa7a591f'])for(const notes of ['monthly 8,500','القسط الشهري ٨٬٥٠٠ جنيه']){
 const input={id,locations:[{city:'cairo'}],roomsCount:3,minPrice:1,maxPrice:2,downPayment:3,monthlyInstallment:85000,notes};
 const result=applyRequirementMoneyTrust(input);
 assert.deepEqual(result,{id,locations:[{city:'cairo'}],roomsCount:3,moneyReviewRequired:true});
 assert.equal(input.notes,notes);
 }
});
test('valid and missing-money requirements remain unchanged, no speculative text parsing',()=>{
 const valid={id:'valid',monthlyInstallment:8500,notes:'8,500 جنيه'};assert.equal(applyRequirementMoneyTrust(valid),valid);
 const missing={id:'other',roomsCount:2};assert.equal(applyRequirementMoneyTrust(missing),missing);
});

test('incomplete split claims are hidden while totals and records without claims survive',()=>{
 for (const field of ['downPayment','remainingAmount','overPrice','installmentAmountYearly','installmentYears']) {
  const result=applyPublicMoneyTrust({totalPrice:1000000,[field]:9});
  assert.equal(result.paymentSplitHidden,true);assert.equal(result[field],null);
  assert.equal(result.totalPrice,1000000);
 }
 assert.equal(applyPublicMoneyTrust({totalPrice:1000000}).paymentSplitHidden,undefined);
 assert.equal(applyPublicMoneyTrust({totalPrice:1000000,downPayment:0,remainingAmount:0}).paymentSplitHidden,undefined);
});

test('complete annual identity preserves a supported plan without inventing remaining',()=>{
 const input={totalPrice:1000000,downPayment:100000,installmentAmountYearly:100000,installmentYears:9};
 assert.deepEqual(applyPublicMoneyTrust(input),input);
 assert.equal(applyPublicMoneyTrust({...input,installmentAmountYearly:200000}).paymentSplitHidden,true);
});

test('JSON-LD script delimiters are escaped without changing parsed data',()=>{
 const input={name:'</script><script>alert(1)</script>',datePosted:'</script>'};
 const serialized=serializeJsonLd(input);
 assert.equal(serialized.includes('<'),false);
 assert.deepEqual(JSON.parse(serialized),input);
});
