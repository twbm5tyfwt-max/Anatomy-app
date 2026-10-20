import pathlib,subprocess,json,hashlib,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1];source=pathlib.Path(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else '/tmp/anatomy-reference');rev='5ae32b3f4bc24ed003e91dc38bf47dba80751044'
files={'Heart':'2008_Internal_Anatomy_of_the_HeartN.jpg','Lungs':'2312_Gross_Anatomy_of_the_Lungs.jpg','Kidneys':'2610_The_Kidney.jpg','Stomach':'2414_Stomach.jpg','Liver':'2423_Microscopic_Anatomy_of_Liver.jpg','Pancreas':'2424_Exocrine_and_Endocrine_Pancreas.jpg','Spleen':'2208_Spleen.jpg','Bladder':'2605_The_Bladder.jpg','Eye':'1413_Structure_of_the_Eye.jpg','Brain':'1311_Brain_Stem.jpg','Thyroid':'1811_The_Thyroid_Gland.jpg','Adrenal':'1818_The_Adrenal_Glands.jpg','Pituitary':'1806_The_Hypothalamus-Pituitary_Complex.jpg','Intestines':'2417_Small_IntestineN.jpg','Testis':'Figure_28_01_03.JPG','Female pelvis':'Figure_28_02_06.JPG'}
ns={'c':'http://cnx.rice.edu/cnxml'};rows=[]
for region,file in files.items():
 data=subprocess.check_output(['git','-C',str(source),'show',f'{rev}:media/{file}']);output=file.rsplit('.',1)[0]+'.jpg';(root/'public/anatomy'/output).write_bytes(data)
 for path in source.glob('modules/*/index.cnxml'):
  t=ET.parse(path)
  for f in t.findall('.//c:figure',ns):
   if f.find('c:title',ns) is not None and any(x.get('src','').endswith(file) for x in f.findall('.//c:image',ns)):
    rows.append({'region':region,'file':output,'title':(''.join(f.find('c:title',ns).itertext()).strip() if f.find('c:title',ns) is not None else region+' reference'),'caption':' '.join((''.join(f.find('c:caption',ns).itertext()) if f.find('c:caption',ns) is not None else '').split()),'source':f'https://github.com/openstax/osbooks-anatomy-physiology/blob/{rev}/modules/{path.parent.name}/index.cnxml','module':path.parent.name,'revision':rev,'sha256':hashlib.sha256(data).hexdigest(),'license':'OpenStax / Rice University, CC BY-NC-SA 4.0; original captions and credits retained.'})
for row in rows:
 if not row['caption']:row['caption']='Published labeled '+row['title'].lower()+' illustration. The source figure supplies no separate prose caption; original embedded labels are retained.'
(root/'src/generated/organ-plates.json').write_text(json.dumps(rows,indent=2)+'\n')
p=root/'src/assetPaths.ts';s=p.read_text();model_export=s[s.index('export const anatomyModels'):];s=s.split('export const anatomyModels')[0];d=dict(__import__('re').findall(r'"([^"]+)": "([^"]+)"',s));d.update({r['file']:'/anatomy/'+r['file'] for r in rows});p.write_text('export const anatomyImages:Record<string,string> = '+json.dumps(d,indent=2)+';\n\n'+model_export)
print('Added',len(rows),'original organ reference plates')
