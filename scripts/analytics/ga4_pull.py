# Usage: python3 -I scripts/analytics/ga4_pull.py START END > REPORT/ga4/<date>-pull.json  (needs gcloud ADC in ~/.config/gcloud-lenaqar)
import json, subprocess, sys, urllib.request, os
tok = subprocess.run(["gcloud","auth","application-default","print-access-token"],capture_output=True,text=True,
      env={**os.environ,"CLOUDSDK_CONFIG":os.path.expanduser("~/.config/gcloud-lenaqar")}).stdout.strip()
PROP="properties/562541313"; START, END = sys.argv[1], sys.argv[2]
AI = r"chatgpt|openai|perplexity|gemini|bard|claude|anthropic|copilot|deepseek|grok|meta\.ai|you\.com|phind"
def run(dims, mets, flt=None, order=None, limit=100):
    body={"dateRanges":[{"startDate":START,"endDate":END}],"dimensions":[{"name":d} for d in dims],
          "metrics":[{"name":m} for m in mets],"limit":limit}
    if flt: body["dimensionFilter"]=flt
    if order: body["orderBys"]=order
    req=urllib.request.Request(f"https://analyticsdata.googleapis.com/v1beta/{PROP}:runReport",data=json.dumps(body).encode(),
        headers={"Authorization":f"Bearer {tok}","Content-Type":"application/json","x-goog-user-project":"gen-lang-client-0077888650"})
    r=json.load(urllib.request.urlopen(req))
    return {"columns":dims+mets,"rows":[[c["value"] for c in row["dimensionValues"]]+[c["value"] for c in row["metricValues"]] for row in r.get("rows",[])]}
aif={"filter":{"fieldName":"sessionSource","stringFilter":{"matchType":"PARTIAL_REGEXP","value":AI,"caseSensitive":False}}}
out={"property":PROP,"range":{"start":START,"end":END},"ai_source_regex":AI,"reports":{
 "daily":run(["date"],["sessions","engagedSessions","activeUsers"],order=[{"dimension":{"dimensionName":"date"}}]),
 "channels":run(["sessionDefaultChannelGroup"],["sessions","engagedSessions"]),
 "ai_daily":run(["date","sessionSource"],["sessions","engagedSessions"],aif,order=[{"dimension":{"dimensionName":"date"}}]),
 "ai_landing":run(["sessionSource","landingPage"],["sessions","engagedSessions","averageSessionDuration"],aif),
 "ai_events":run(["sessionSource","eventName"],["eventCount"],{"andGroup":{"expressions":[aif,{"filter":{"fieldName":"eventName","inListFilter":{"values":["buy_request_submitted","sell_request_submitted","whatsapp_click","generate_lead"]}}}]}}),
 "key_events_by_channel":run(["sessionDefaultChannelGroup","eventName"],["eventCount"],{"filter":{"fieldName":"eventName","inListFilter":{"values":["buy_request_submitted","sell_request_submitted","whatsapp_click"]}}}),
}}
print(json.dumps(out,ensure_ascii=False))
