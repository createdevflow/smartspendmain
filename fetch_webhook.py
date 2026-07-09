import urllib.request
import json
import sys

req = urllib.request.Request('https://webhook.site/token/d3275361-1a3d-4fbf-b70d-96cd507bbaf8/requests?sorting=newest', headers={'Accept': 'application/json'})
res = urllib.request.urlopen(req)
data = json.loads(res.read())
print(f"Total requests: {len(data['data'])}")
latest = data['data'][0]
with open('latest_webhook.log', 'w', encoding='utf-8') as f:
    f.write(latest['content'])
print(f"Latest request date: {latest['created_at']}")
