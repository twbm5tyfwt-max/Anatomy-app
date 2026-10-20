import bpy,json,re,hashlib,numpy as np
from pathlib import Path
from collections import defaultdict
root=Path('/tmp/forma-z-export');root.mkdir(exist_ok=True)
deps=bpy.context.evaluated_depsgraph_get()
meta=[];annotations=[];offset=0
handle=open(root/'geometry.bin','wb')
def write(a):
 global offset
 a=np.ascontiguousarray(a);start=offset;handle.write(a.tobytes());offset+=a.nbytes
 return {'offset':start,'length':a.size,'dtype':str(a.dtype)}
def convert(a):return np.stack([a[:,0],a[:,2],-a[:,1]],axis=1).astype('<f4')
objects=list(bpy.data.objects)
for o in objects:
 cols=[c.name for c in o.users_collection]
 if o.type=='MESH' and o.name.endswith('.j') and '1: Skeletal system' in cols:
  e=o.evaluated_get(deps);me=e.to_mesh()
  points=[list(o.matrix_world@v.co) for v in me.vertices]
  hooks=[{'target':m.object.name if m.object else None,'indices':list(m.vertex_indices)} for m in o.modifiers if m.type=='HOOK']
  annotations.append({'sourceName':o.name,'name':o.name[:-2],'collections':cols,'points':[[p[0],p[2],-p[1]] for p in points],'hooks':hooks,'textPosition':[o.parent.matrix_world.translation.x,o.parent.matrix_world.translation.z,-o.parent.matrix_world.translation.y] if o.parent else None})
  e.to_mesh_clear()
 if o.type not in ['MESH','CURVE'] or not any(re.match(r'^[1-9]:',c) for c in cols):continue
 if re.search(r'\.(i|j|s|t|g)$',o.name) or 'profile' in o.name.lower():continue
 e=o.evaluated_get(deps)
 try:me=e.to_mesh()
 except Exception:continue
 if not me or not len(me.polygons):
  if me:e.to_mesh_clear()
  continue
 me.calc_loop_triangles()
 co=np.empty(len(me.vertices)*3,dtype='<f4');me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
 matrix=np.array(o.matrix_world,dtype=np.float32);co=co@matrix[:3,:3].T+matrix[:3,3];co=convert(co)
 normal=np.empty(len(me.vertices)*3,dtype='<f4');me.vertices.foreach_get('normal',normal);normal=normal.reshape(-1,3)
 normal=normal@np.linalg.inv(matrix[:3,:3]);normal=convert(normal);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-10)
 inds=np.empty(len(me.loop_triangles)*3,dtype='<u4');me.loop_triangles.foreach_get('vertices',inds);inds=inds.reshape(-1,3)
 mi=np.empty(len(me.loop_triangles),dtype='<i4');me.loop_triangles.foreach_get('material_index',mi)
 mats=[m.name if m else '' for m in me.materials]
 row={'sourceName':o.name,'collections':cols,'bounds':[co.min(axis=0).tolist(),co.max(axis=0).tolist()],'positions':write(co),'normals':write(normal),'groups':[],'attributes':[a.name for a in me.color_attributes]}
 for index in np.unique(mi):row['groups'].append({'material':mats[int(index)] if int(index)<len(mats) else '', 'indices':write(inds[mi==index].flatten())})
 meta.append(row);e.to_mesh_clear()
 if len(meta)%250==0:print('EXTRACTED',len(meta),offset,flush=True)
handle.close();(root/'objects.json').write_text(json.dumps(meta));(root/'annotations.json').write_text(json.dumps(annotations,indent=2))
print('EXPORTED',len(meta),'objects',len(annotations),'skeletal anchors',offset,'bytes',flush=True)
for x in annotations:
 if any(t in x['name'].lower() for t in ['spinous process','vertebral body','vertebral foramen','transverse foramen','dens axis','pedicle','lamina of vertebral']):print('ANCHOR',json.dumps(x),flush=True)
