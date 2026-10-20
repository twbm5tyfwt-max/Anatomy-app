"""Prepare attributed anatomical excerpts from the pinned Z-Anatomy blend text export.
Run Blender with --disable-autoexec; only the project's extraction script should run.
"""
import pathlib,json,re,sys
root=pathlib.Path(__file__).resolve().parents[1]
source=json.loads(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/forma-source-texts.json').read_text())
models=json.loads((root/'src/model-manifest.json').read_text())['models']
notes={}; mapping={}
def anatomy_only(text):
 paragraphs=re.split(r'\n\s*\n',text)
 return '\n\n'.join(p for p in paragraphs if not re.search(r'\b(?:rabbit|horse|fish|zebrafish|frog|bird|avian|mice|mouse|rodent|reptile|shark|non-human|nonhuman|syndrome|tumou?r|cancer|treatment|surgery|surgical|therapy)\b',p,re.I) and '122mm long and 55mm wide' not in p)

allowed={'structure','function','functions','origin','insertion','attachments','attachment','innervation','nerve supply','blood supply','articulations','articulation','relations','relation','course','branches','contents','surfaces','parts','anatomy','ligaments','location','boundaries','borders','action','actions','anatomical relationships','muscle attachments','osseous attachments'}
for name,text in source.items():
 urls=re.findall(r'https://en\.wikipedia\.org/wiki/[^\s]+',text)
 if not urls:continue
 text=re.sub(r'https?://[^\s]+','',text)
 groups=re.split(r'(?m)^\s*(={2,})\s*([^=\n]+?)\s*\1\s*$',text)
 intro=groups[0].strip().split('\n\n');intro=anatomy_only('\n\n'.join(p for p in intro if p.strip() and not p.strip().isupper()))
 sections=[{'heading':'Identification','text':intro}] if intro else []
 excluded_level=99
 for i in range(1,len(groups),3):
  level=len(groups[i]);heading=groups[i+1].strip();body=anatomy_only(groups[i+2].strip())
  if level<=excluded_level:excluded_level=99
  if re.search(r'clinical|disease|variation|other animals|history|references|external|additional|evolution|injur|syndrome|treatment',heading,re.I):excluded_level=level;continue
  if level>excluded_level or heading.lower() not in allowed or not body:continue
  sections.append({'heading':heading,'text':body[:12000]})
 if sections:notes[name]={'name':name,'url':urls[-1].rstrip('.'),'history':urls[-1].rstrip('.')+'?action=history','sections':sections,'credit':'Wikipedia contributors; archived adaptations by Z-Anatomy authors, CC BY-SA 4.0. Legacy Wikipedia CC BY-SA 3.0 notice retained; keep contributor history and modification notes.'}
def norm(s):return re.sub(r'\s+',' ',s.lower().strip()).strip()
index={norm(k):k for k in notes}
for m in models:
 if m['layer']=='attachment':continue
 name=re.sub(r'\.(?:l|r)$','',m.get('sourceName',''))
 key=index.get(norm(name));scope='exact source structure'
 if not key:
  family=re.split(r'(?:head|part|belly) of ',name,flags=re.I)[-1]
  key=index.get(norm(family));scope='parent muscle / region reference'
 if key:mapping[m['id']]={'reading':key,'scope':scope}
anchor_mapping={}
for a in json.loads((root/'src/generated/landmark-anchors.json').read_text()):
 key=index.get(norm(a['name'].strip('() ')))
 if key:anchor_mapping[a['id']]={'reading':key,'scope':'source landmark reference'}
used={row['reading'] for row in [*mapping.values(),*anchor_mapping.values()]};notes={k:v for k,v in notes.items() if k in used}
result={'source':'https://github.com/Z-Anatomy/Models-of-human-anatomy','revision':'0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef','modifications':'Anatomical identification, structure, function and relationship sections selected from archived plaintext. Clinical, treatment, variation and comparative-animal sections omitted. Original text is not a current clinical guideline. Parent muscle references are marked explicitly. Live Wikipedia revision dates were not reconstructed.','notes':notes,'models':mapping,'landmarks':anchor_mapping}
(root/'src/generated/atlas-readings.json').write_text(json.dumps(result,indent=2)+'\n');print('Prepared',len(notes),'attributed readings linked to',len(mapping),'source components')
