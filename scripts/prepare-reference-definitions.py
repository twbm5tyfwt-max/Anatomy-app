import json,re,pathlib,hashlib,urllib.request
root=pathlib.Path(__file__).resolve().parents[1];rev='76b965742a97393a4c567b1accf012f163a520a5'
# Pin both content and license to the recorded source revision.
raw=urllib.request.urlopen(f'https://raw.githubusercontent.com/obophenotype/uberon/{rev}/uberon.obo',timeout=40).read();text=raw.decode();pathlib.Path('/tmp/forma-uberon.obo').write_bytes(raw)
terms=[]
for block in text.split('\n[Term]\n')[1:]:
 def field(p):
  m=re.search(p,block,re.M);return m[1] if m else ''
 id=field(r'^id: (UBERON:\d+)$');name=field(r'^name: (.+)$');d=field(r'^def: "((?:\\.|[^"\\])*)"')
 if not id or not name or not d or 'is_obsolete: true' in block:continue
 # Exclude explicitly unvetted definitions and comparative/nonhuman examples.
 if re.search(r'unvetted|zebrafish|teleost|drosophila|amphibian|tadpole|chicken|avian|murine|mouse|mice|fin |fin\.|fish|insect|larva|tetrapod|non-mammalian|frog|bird|reptil|lizard|shark|cartilaginous fishes',d,re.I):continue
 d=d.replace('\\"','"').replace('\\n',' ').replace('\\,',',')
 synonyms=re.findall(r'^synonym: "([^"]+)" EXACT',block,re.M)
 refs=field(r'^def: ".*" \[(.*)\]')
 terms.append({'id':id,'name':name,'definition':d,'synonyms':synonyms,'citations':refs,'fma':re.findall(r'^xref: FMA:(\d+)',block,re.M)})
def norm(s):
 s=s.lower().replace('_',' ').strip('() ');s=re.sub(r'\b(right|left)\b','',s);return re.sub(r'\s+',' ',s).strip()
index={};fma={}
for term in terms:
 for name in [term['name'],*term['synonyms']]:index.setdefault(norm(name),{})[term['id']]=term
 for id in term['fma']:fma.setdefault('FMA'+id,{})[term['id']]=term
modelrows=json.loads((root/'src/model-manifest.json').read_text())['models']+json.loads((root/'src/generated/hra-manifest.json').read_text())['models']
output={}; used={}
for m in modelrows:
 names=[m['name']]
 if m.get('sourceName','').startswith('VH_F_'):names.append(m['sourceName'][5:].replace('_',' '))
 candidates=fma.get(m['id'],{})
 matched='FMA identifier'
 if len(candidates)!=1:
  candidates={};matched='exact name/synonym (side-independent term)'
  for name in names:
   found=index.get(norm(name),{})
   if len(found)==1:candidates=found;break
 if len(candidates)==1:
  term=next(iter(candidates.values()));used[term['id']]={k:v for k,v in term.items() if k not in ('synonyms','fma')};output[m['id']]={'term':term['id'],'match':matched}
anchors={}
for a in json.loads((root/'src/generated/landmark-anchors.json').read_text()):
 found=index.get(norm(a['name']),{})
 if len(found)==1:
  t=next(iter(found.values()));used[t['id']]={k:v for k,v in t.items() if k not in ('synonyms','fma')};anchors[a['id']]=t['id']
result={'source':'https://github.com/obophenotype/uberon','revision':rev,'version':re.search(r'^data-version: (.*)',text,re.M)[1],'sha256':hashlib.sha256(raw).hexdigest(),'license':'CC BY 3.0','terms':used,'models':output,'landmarks':anchors}
(root/'src/generated/reference-definitions.json').write_text(json.dumps(result,indent=2)+'\n')
print('Matched',len(output),'model components and',len(anchors),'source landmarks;',len(used),'distinct definitions')
