# Usage: python3 -I scripts/analytics/gsc_pull.py START END > REPORT/gsc/<date>-pull.json  (needs gcloud ADC in ~/.config/gcloud-lenaqar)
import json, subprocess, sys, urllib.request, urllib.parse, os
tok = subprocess.run(["gcloud","auth","application-default","print-access-token"],capture_output=True,text=True,
      env={**os.environ,"CLOUDSDK_CONFIG":os.path.expanduser("~/.config/gcloud-lenaqar")}).stdout.strip()
H={"Authorization":f"Bearer {tok}","Content-Type":"application/json","x-goog-user-project":"gen-lang-client-0077888650"}
SITE=urllib.parse.quote("https://www.lenaqar.com/",safe="")
def q(dims,start,end,limit=50):
    body={"startDate":start,"endDate":end,"dimensions":dims,"rowLimit":limit}
    r=urllib.request.Request(f"https://www.googleapis.com/webmasters/v3/sites/{SITE}/searchAnalytics/query",data=json.dumps(body).encode(),headers=H)
    return json.load(urllib.request.urlopen(r)).get("rows",[])
def inspect(url):
    body={"inspectionUrl":url,"siteUrl":"https://www.lenaqar.com/"}
    r=urllib.request.Request("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",data=json.dumps(body).encode(),headers=H)
    i=json.load(urllib.request.urlopen(r))["inspectionResult"]["indexStatusResult"]
    return {k:i.get(k) for k in ("verdict","coverageState","lastCrawlTime","googleCanonical")}
s,e=sys.argv[1],sys.argv[2]
out={"range":{"start":s,"end":e},"by_date":q(["date"],s,e),"by_page":q(["page"],s,e,25),"by_query":q(["query"],s,e,40),
 "inspect":{u:inspect(u) for u in ["https://www.lenaqar.com/","https://www.lenaqar.com/how-it-works","https://www.lenaqar.com/before-you-pay","https://www.lenaqar.com/privacy","https://www.lenaqar.com/guides/el-shorouk/prices-2026","https://www.lenaqar.com/guides/madinaty/prices-2026","https://www.lenaqar.com/guides/buying/contract-registration-checklist"]}}
print(json.dumps(out,ensure_ascii=False))
