import pathlib,subprocess,json,hashlib,xml.etree.ElementTree as E
root=pathlib.Path(__file__).resolve().parents[1];source=pathlib.Path(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else '/tmp/anatomy-reference');rev='5ae32b3f4bc24ed003e91dc38bf47dba80751044'
files=['2310_Structures_of_the_Respiratory_Zone.jpg','2421_Histology_of_the_Large_IntestineN.jpg','503_Epidermis.jpg','2615_Juxtaglomerular_Apparatus.jpg'];ns={'c':'http://cnx.rice.edu/cnxml'};rows=json.loads((root/'src/generated/histology.json').read_text())
for file in files:
 data=subprocess.check_output(['git','-C',str(source),'show',f'{rev}:media/{file}']);(root/'public/anatomy'/file).write_bytes(data)
 for p in source.glob('modules/*/index.cnxml'):
  for f in E.parse(p).findall('.//c:figure',ns):
   if f.find('c:title',ns) is not None and any(i.get('src','').endswith(file) for i in f.findall('.//c:image',ns)):
    row={'file':file,'title':''.join(f.find('c:title',ns).itertext()).strip(),'caption':' '.join(''.join(f.find('c:caption',ns).itertext()).split()),'module':p.parent.name,'sha256':hashlib.sha256(data).hexdigest(),'license':'OpenStax CC BY-NC-SA 4.0; retain the specific micrograph credits in the caption','source':f'https://github.com/openstax/osbooks-anatomy-physiology/blob/{rev}/media/{file}'}
    if not any(r['file']==file for r in rows):rows.append(row)
(root/'src/generated/histology.json').write_text(json.dumps(rows,indent=2)+'\n')
p=root/'src/assetPaths.ts';import re;s=p.read_text();model_export=s[s.index('export const anatomyModels'):];s=s.split('export const anatomyModels')[0];d=dict(re.findall(r'"([^"]+)": "([^"]+)"',s));d.update({f:'/anatomy/'+f for f in files});p.write_text('export const anatomyImages:Record<string,string> = '+json.dumps(d,indent=2)+';\n\n'+model_export);print('Added 4 context-specific microscopy plates')
