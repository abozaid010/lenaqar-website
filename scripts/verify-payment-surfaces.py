#!/usr/bin/env python3
"""Read-only HTML/RSC payment verification; writes sanitized assertions only."""
import argparse, datetime, html, json, re, urllib.request
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--output',required=True);args=p.parse_args()
base=args.base_url.rstrip('/');checks=[]
def check(name, passed): checks.append({'check':name,'pass':bool(passed)})
def fetch(path,rsc=False):
 req=urllib.request.Request(base+path,headers={'RSC':'1'} if rsc else {})
 with urllib.request.urlopen(req,timeout=45) as response:
  check(path+(' RSC' if rsc else ' HTML')+' HTTP',response.status==200)
  if rsc:check(path+' RSC content type','text/x-component' in response.headers.get('Content-Type',''))
  return response.read().decode()
for code in ['MguPxCF0','LNk7qZIF','kBqU7H1A']:
 hidden=code!='kBqU7H1A';path='/opportunities/'+code
 for rsc in [False,True]:
  body=fetch(path,rsc);label=code+(' RSC' if rsc else ' HTML');normalized=body.replace('\\"','"')
  fields={k:re.findall('"'+k+'":([^,}]+)',normalized) for k in ['installmentYears','downPayment','remainingAmount','overPrice','installmentAmountYearly','totalPrice']}
  check(label+' years',fields['installmentYears'] and all(v==('null' if hidden else '9') for v in fields['installmentYears']))
  check(label+' positive total',fields['totalPrice'] and all(float(v)>0 for v in fields['totalPrice']))
  if hidden:
   check(label+' split redacted',all(fields[k] and all(v=='null' for v in fields[k]) for k in ['downPayment','remainingAmount','overPrice','installmentAmountYearly']))
  else:
   check(label+' valid down/remaining preserved',all(fields[k] and all(float(v)>0 for v in fields[k]) for k in ['downPayment','remainingAmount']))
  check(label+' reviewed image absent','homey_ee175730' not in body)
  if not rsc:
   schemas=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',body)]
   listing=next((x for x in schemas if x.get('@type')=='RealEstateListing'),{})
   props=listing.get('mainEntity',{}).get('additionalProperty',[])
   check(label+' schema duration',bool(listing) and (not any(x['name']=='مدة التقسيط' for x in props) if hidden else any(x['name']=='مدة التقسيط' and x['value']==9 for x in props)))
   check(label+' schema property placement','additionalProperty' not in listing)
   check(label+' no inferred seller/date','seller' not in listing.get('offers',{}) and 'datePosted' not in listing)
   check(label+' canonical',f'<link rel="canonical" href="https://www.lenaqar.com{path}"' in body)
   check(label+' WhatsApp attribution','wa.me/201002891933' in body and 'OPP-'+code.upper() in html.unescape(body))
   check(label+' no developer-price claim','السعر من المطور بتاريخه' not in body)
for rsc in [False,True]:
 body=fetch('/',rsc);normalized=body.replace('\\"','"')
 for code in ['61240565aa04','f4eaaa7a591f']:
  objects=re.findall(r'\{[^{}]*"id":"'+code+r'"[^{}]*\}',normalized)
  # RSC records may contain nested arrays; find the object's money-free prefix
  # by decoding the containing JSON fragment from the id-key object start.
  objects=[]
  for match in re.finditer(r'\{"id":"'+code+'"',normalized):
   try: objects.append(json.JSONDecoder().raw_decode(normalized[match.start():])[0])
   except ValueError: pass
  check(code+(' RSC' if rsc else ' HTML')+' request redaction',objects and all(o.get('moneyReviewRequired') is True and not any(k in o for k in ['minPrice','maxPrice','downPayment','monthlyInstallment','notes']) for o in objects))
report={'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseUrl':base,'surface':'local/preview unless production origin explicitly supplied','checks':checks,'passed':sum(c['pass'] for c in checks),'failed':[c for c in checks if not c['pass']]}
Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False));raise SystemExit(bool(report['failed']))
