import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Document,NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt,prune} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
const revision='0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef', sourceBlob='f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb';
const rows=JSON.parse(await readFile('/tmp/forma-z-export/objects.json','utf8'));
const raw=await readFile('/tmp/forma-z-export/geometry.bin');
const anchors=JSON.parse(await readFile('/tmp/forma-z-export/annotations.json','utf8'));
const legacy=JSON.parse(await readFile('scripts/legacy-model-ids.json','utf8'));
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const read=(r)=>{const b=raw.subarray(r.offset,r.offset+r.length*4);return r.dtype==='float32'?new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)):new Uint32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const ord=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];
function clean(name){
 let side=name.match(/\.(l|r)$/)?.[1];let base=name.replace(/\.(l|r)$/,'').replace(/[()]/g,'').replace(/\bmuscle\b/gi,'').replace(/\s+/g,' ').trim();
 if(/^Atlas C1$/i.test(base))return 'Atlas';if(/^Axis C2$/i.test(base))return 'Axis';
 const v=base.match(/^Vertebra ([CTL])(\d+)$/);if(v)return `${ord[+v[2]]} ${{C:'cervical',T:'thoracic',L:'lumbar'}[v[1]]} vertebra`;
 if(!side)return base[0].toUpperCase()+base.slice(1);
 const word=side==='l'?'left':'right';
 if(/\b(head|part|belly) of /i.test(base))base=base.replace(/ of /i,` of ${word} `);
 else base=word+' '+base[0].toLowerCase()+base.slice(1);
 return base[0].toUpperCase()+base.slice(1);
}
const key=s=>s.toLowerCase().replace(/\b(clavicular|sternocostal) head of (.*pectoralis major)/g,'$1 part of $2').replace(/\bmuscle\b/g,'').replace(/\s+/g,' ').trim();
const legacyNames=new Map(legacy.map(m=>[key(m.name),m.id]));
const used=new Set();
function idFor(name,sourceName){const old=legacyNames.get(key(name));let id=old&&!used.has(old)?old:'ZA'+createHash('sha1').update(sourceName).digest('hex').slice(0,12);used.add(id);return id;}
function system(row){
 const c=row.collections.join(' ').toLowerCase(),n=row.sourceName.toLowerCase();
 if(c.includes('1: skeletal')||c.includes('3: joints'))return 'skeletal';if(c.includes('4: muscular')||c.includes('2: muscular'))return 'muscular';
 if(c.includes('5: cardiovascular'))return 'cardiovascular';if(c.includes('6: lymphoid'))return 'lymphatic';if(c.includes('7: nervous'))return 'nervous';if(c.includes('9: regions'))return 'integumentary';
 if(c.includes('urinary'))return 'urinary';if(c.includes('reproductive')||c.includes('genital')||/testis|penis|prostate|seminal|uterus|ovary|ovarian|vagina|uterine/.test(n))return 'reproductive';if(c.includes('endocrine')||/thyroid gland|adrenal|pituitary|pineal/.test(n))return 'endocrine';if(c.includes('respiratory')||/lung|bronch|trachea|larynx/.test(n))return 'respiratory';return 'digestive';
}
function layer(row,material){
 const c=row.collections.join(' '),n=row.sourceName.toLowerCase();
 if(c.includes('2: Muscular insertions'))return 'attachment';
 if(c.includes('9: Regions'))return 'skin';
 if(/\bligament\b/i.test(n))return 'ligaments';
 if(/Tendon/i.test(material)||/\btendon\b/i.test(n))return 'tendons';
 if(/Bursa/i.test(material)||/\bbursa\b/i.test(n))return 'bursae';
 if(/Articular capsule|Synovial/i.test(material))return 'capsules';
 if(/Fat/i.test(material)||/fat pad/i.test(n))return 'organs';
 if(/Ligament/i.test(material)||/\bligament\b/i.test(n))return 'ligaments';
 if(/Cartilage/i.test(material)||/cartilage|intervertebral disc|meniscus|labrum/i.test(n))return 'cartilage';
 if(/Fascia|aponeuros/i.test(material+' '+n))return 'fascia';
 if(c.includes('1: Skeletal'))return 'bones';if(c.includes('4: Muscular'))return 'muscles';
 if(c.includes('3: Joints'))return 'ligaments';return 'organs';
}
function region(row){const c=row.collections.join(' ');if(c.includes('Cervical vertebrae'))return 'Head & neck';if(/upper limb/i.test(c))return 'Upper limbs';if(/lower limb/i.test(c))return 'Lower limbs';if(/Head|Neck/i.test(c)&&!c.includes('Vertebral column'))return 'Head & neck';return 'Torso';}
const palette={bones:'#d5c6a5',muscles:'#a84845',tendons:'#e6d6bb',ligaments:'#d2c8a8',cartilage:'#a9c2cb',fascia:'#d7ccb7',bursae:'#c8c3ad',capsules:'#d0c9ac',skin:'#c69c81',organs:'#ae6f64',attachment:'#f3b044'};
const linear=s=>{let c=parseInt(s.slice(1),16);return [16,8,0].map(n=>{let v=((c>>n)&255)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});};
const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene('Z-Anatomy');
const materials=Object.fromEntries(Object.entries(palette).map(([l,c])=>[l,doc.createMaterial(l).setBaseColorFactor([...linear(c),1]).setRoughnessFactor(l==='cartilage'?.45:.78).setMetallicFactor(0).setDoubleSided(false).setExtras({layer:l})]));
const models=[],sourceMap=new Map(),sourceModels=new Map();let triangles=0;
for(let ri=0;ri<rows.length;ri++){
 const row=rows[ri],isAttachment=row.collections.includes('2: Muscular insertions');
 const name=isAttachment?row.sourceName:clean(row.sourceName),primaryId=idFor(name,row.sourceName);
 sourceMap.set(row.sourceName,primaryId);
 const positions=read(row.positions),normals=read(row.normals);let flipScore=0;
 for(const g of row.groups){const idx=read(g.indices);for(let t=0;t<Math.min(idx.length,180);t+=3){let a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3;let ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];flipScore+=(uy*vz-uz*vy)*normals[a]+(uz*vx-ux*vz)*normals[a+1]+(ux*vy-uy*vx)*normals[a+2];}}
 const byLayer=new Map();for(const g of row.groups){const l=layer(row,g.material);byLayer.set(l,[...(byLayer.get(l)||[]),g]);}
 // Keep each source tissue region selectable; no extra anatomical geometry is created.
 const dominant=[...byLayer.entries()].sort((a,b)=>b[1].reduce((s,g)=>s+g.indices.length,0)-a[1].reduce((s,g)=>s+g.indices.length,0))[0][0];
 const primaryLayer=row.collections.includes('1: Skeletal system')&&byLayer.has('bones')?'bones':row.collections.includes('4: Muscular system')&&byLayer.has('muscles')?'muscles':dominant;
 for(const [l,groups] of byLayer){
  const id=l===primaryLayer?primaryId:primaryId+'_'+l;
  let idx=new Uint32Array(groups.reduce((s,g)=>s+g.indices.length,0)),at=0;
  for(const g of groups){let a=read(g.indices);idx.set(a,at);at+=a.length;}
  if(flipScore<0)for(let j=0;j<idx.length;j+=3)[idx[j+1],idx[j+2]]=[idx[j+2],idx[j+1]];
  if((system(row)==='cardiovascular'||system(row)==='nervous')&&idx.length>18000){[idx]=MeshoptSimplifier.simplify(idx,positions,3,Math.max(6000,Math.floor(idx.length*.35/3)*3),.0003,['LockBorder']);}
  // Compact only referenced vertices, retaining source vertex normals.
  const remap=new Map(),p=[],n=[],out=[];
  for(const v of idx){let i=remap.get(v);if(i===undefined){i=remap.size;remap.set(v,i);p.push(positions[v*3],positions[v*3+1],positions[v*3+2]);n.push(normals[v*3],normals[v*3+1],normals[v*3+2]);}out.push(i);}
  const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];for(let i=0;i<p.length;i++) {bounds[0][i%3]=Math.min(bounds[0][i%3],p[i]);bounds[1][i%3]=Math.max(bounds[1][i%3],p[i]);}
  const accessor=(type,array)=>doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const mesh=doc.createMesh(id).addPrimitive(doc.createPrimitive().setAttribute('POSITION',accessor('VEC3',new Float32Array(p))).setAttribute('NORMAL',accessor('VEC3',new Float32Array(n))).setIndices(accessor('SCALAR',p.length/3<65536?new Uint16Array(out):new Uint32Array(out))).setMaterial(materials[l]));
  scene.addChild(doc.createNode(id).setMesh(mesh));
  const derived=l!==primaryLayer;const display=isAttachment?row.sourceName:derived?`${l[0].toUpperCase()+l.slice(1)} surface of ${name[0].toLowerCase()+name.slice(1)}`:name;
  const m={id,name:display,system:system(row),ancestry:[...row.collections,...(l==='bones'?['Bone organ']:[])],sha1:sourceBlob,bounds,triangles:out.length/3,layer:l,sourceName:row.sourceName,sourceMaterial:groups.map(g=>g.material).join(', '),region:region(row),parentId:derived?primaryId:undefined,surfaceRegion:derived,source:'Z-Anatomy'};
  if(isAttachment){const match=row.sourceName.match(/\.(o|i|e)(l|r)$/);if(match){m.attachmentKind=match[1]==='o'?'origin':'insertion';m.attachmentSource=row.sourceName.replace(/\.(o|i|e)(l|r)$/,'.'+match[2]);}}
  models.push(m);triangles+=out.length/3;sourceModels.set(row.sourceName,[...(sourceModels.get(row.sourceName)||[]),m]);
 }
 if(ri%400===0)console.log('Converted',ri,'/',rows.length,'objects');
}
for(const m of models)if(m.attachmentSource){m.attachmentFor=sourceMap.get(m.attachmentSource);if(!m.attachmentFor){const sourceFamily=clean(m.attachmentSource).toLowerCase();const side=m.attachmentSource.endsWith('.r')?'right':'left';const bare=sourceFamily.replace(/\b(right|left)\b/g,'').trim();const candidate=models.find(x=>x.layer==='muscles'&&!x.parentId&&x.name.toLowerCase().includes(side)&&x.name.toLowerCase().includes(bare));if(candidate){m.attachmentFor=candidate.id;m.sharedAttachment=true;}}const target=models.find(x=>x.id===m.attachmentFor);m.name=`${m.attachmentKind==='origin'?'Origin':'Insertion'} overlay — ${target?.name||m.attachmentSource}`;}
const staticMap=JSON.parse(await readFile('scripts/z-static-landmarks.json','utf8'));
const landmarkAnchors=anchors.filter(a=>a.hooks.some(h=>sourceMap.has(h.target))||staticMap.names.includes(a.name)).map(a=>{
 const hook=a.hooks.find(h=>sourceMap.has(h.target))||{target:staticMap.sourceTarget,indices:[1]};const index=hook.indices[0]??1;
 return {id:'ZL'+createHash('sha1').update(a.sourceName).digest('hex').slice(0,12),name:a.name,modelId:sourceMap.get(hook.target),sourceObject:a.sourceName,sourceTarget:hook.target,anchor:a.points[index]||a.points.at(-1),labelPosition:a.textPosition,collections:a.collections,anchorMethod:a.hooks.some(h=>sourceMap.has(h.target))?'source-hook':'validated-static-line'};
});
await doc.transform(prune(),meshopt({encoder:MeshoptEncoder,level:'high'}));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const binary=await io.writeBinary(doc);await mkdir('public/models',{recursive:true});await mkdir('src/generated',{recursive:true});
await writeFile('public/models/anatomy.glb',binary);
await writeFile('src/model-manifest.json',JSON.stringify({revision,source:'https://github.com/Z-Anatomy/Models-of-human-anatomy',sourceBlob,models},null,2));
await writeFile('src/generated/landmark-anchors.json',JSON.stringify(landmarkAnchors,null,2));
console.log('Saved',models.length,'parts;',triangles,'triangles;',Math.round(binary.length/1024/1024*10)/10,'MB;',landmarkAnchors.length,'source anchors.');
console.log('SHA256',createHash('sha256').update(binary).digest('hex'));
