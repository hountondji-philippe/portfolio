import urllib.request, json

url = 'https://portfolio-seven-delta-21jq5u35et.vercel.app/api/projects'
req = urllib.request.Request(url, headers={'User-Agent': 'Python/3'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        projects = data.get('projects', [])
        for p in projects:
            titre = p.get('titre', '?')[:45]
            site = p.get('lienSite') or ''
            github = p.get('lienGithub') or ''
            print(f"TITRE: {titre}")
            print(f"  lienSite: {site}")
            print(f"  lienGithub: {github}")
            print()
except Exception as e:
    print('Error:', e)
