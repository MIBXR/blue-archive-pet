#!/usr/bin/env python3
"""Rebuild approved website cutouts without changing pets/ or enlarging pixels.

Requires Python 3.10+, Pillow and NumPy. Run from any working directory:
    python site/tools/prepare-hd.py
All inputs resolve relative to this checkout; all outputs go into site/assets/.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json, hashlib, shutil

repo=Path(__file__).resolve().parents[2]
assets=repo/'site'/'assets'
assets.mkdir(parents=True,exist_ok=True)

def matte(source,key,background_mask=None):
    image=Image.open(source).convert('RGBA')
    data=np.asarray(image,dtype=np.float32)
    rgb=data[...,:3]
    old_alpha=data[...,3]/255
    if old_alpha.min()<0.5:
        # The selected waiting row and Hibiki main already carry useful alpha.
        return image,{'method':'existing-alpha','background_rgb':None}
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    strength=g-np.maximum(r,b) if key=='green' else np.minimum(r,b)-g
    confident=strength>175
    if key=='green': confident &= g>180
    else: confident &= np.minimum(r,b)>180
    if background_mask is not None:
        # The recovered chair source has a known green gradient, documented in
        # its original production keying. Preserve the same observed matte mask.
        confident=np.asarray(background_mask,dtype=bool)
    background=np.median(rgb[confident],axis=0)
    bg_strength=background[1]-max(background[0],background[2]) if key=='green' else min(background[0],background[2])-background[1]
    # Only a narrow spatial border can acquire partial alpha. Opaque character
    # colors and white interiors are preserved even when their hue is close.
    near=np.asarray(Image.fromarray(np.uint8(confident)*255).filter(ImageFilter.MaxFilter(7)))>0
    partial=near & ~confident & (strength>12)
    alpha=np.ones(strength.shape,dtype=np.float32)
    alpha[confident]=0
    alpha[partial]=np.clip(1-strength[partial]/bg_strength,0,1)
    # Reverse the known backdrop contribution on edge pixels rather than
    # eroding the silhouette or desaturating cyan inside the artwork.
    nonzero=partial & (alpha>0)
    clean=rgb.copy()
    clean[nonzero]=(rgb[nonzero]-background*(1-alpha[nonzero,None]))/alpha[nonzero,None]
    clean=np.clip(clean,0,255)
    clean[alpha==0]=0
    result=np.dstack((clean,alpha*255)).round().astype(np.uint8)
    output=Image.fromarray(result,'RGBA')
    return output,{'method':'spatial-chroma-alpha-with-edge-unmix','background_rgb':background.tolist(),'background_strength':float(bg_strength),'foreground_bbox':output.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox(),'partial_pixels':int(nonzero.sum())}

def main_visuals():
    hibiki=repo/'pets'/'hibiki-cheerleader-fullbody-handdrawn'/'materials'/'main.png'
    toki=repo/'pets'/'toki-bunny-fullbody-handdrawn'/'materials'/'selected-sources'/'base.png'
    shutil.copyfile(hibiki,assets/'hibiki-main.png')
    result,stats=matte(toki,'green')
    result.save(assets/'toki-main.png',compress_level=9)
    stats['source_sha256']=hashlib.sha256(toki.read_bytes()).hexdigest()
    stats['output_sha256']=hashlib.sha256((assets/'toki-main.png').read_bytes()).hexdigest()
    return stats

STATES=['idle','running-right','running-left','waving','jumping','failed','waiting','running','review','look-row-9','look-row-10']
COUNTS=[6,8,8,4,5,8,6,6,6,8,8]

# Integer source-pixel translations recovered from the approved Hibiki
# source-to-published-frame X matrices. Planted shoes stay planted; walking,
# leaning and the running cheer retain their approved body/prop movement.
# The look rows retain the approved small shoe-position differences as they turn.
# These do not center the per-frame outer silhouette or change Y/row scale.
HIBIKI_X_TRANSLATIONS={
    'idle':[-2,1,4,11,13,16],
    'running-right':[-3,-6,-5,-4,-4,-4,-4,-1],
    'running-left':[-17,-25,-16,-12,-7,-8,-4,3],
    'waving':[15,27,24,26],
    'jumping':[-9,-10,-2,-1,-5],
    'failed':[-12,-14,-17,-8,3,5,4,6],
    'waiting':[-14,-13,-23,-15,-3,9],
    'running':[-52,10,62,20,53,20],
    'review':[2,-19,12,10,13,1],
    'look-row-9':[-15,-30,-21,-16,-8,-5,11,17],
    'look-row-10':[0,0,8,10,16,21,25,27],
}

def hd_strips():
    folder=assets/'motion-hd'
    folder.mkdir(parents=True,exist_ok=True)
    records=[]
    for pet in ['hibiki','toki']:
        slug='hibiki-cheerleader-fullbody-handdrawn' if pet=='hibiki' else 'toki-bunny-fullbody-handdrawn'
        source_folder=repo/'pets'/slug/'materials'
        if pet=='toki':source_folder=source_folder/'selected-sources'
        for row,(state,count) in enumerate(zip(STATES,COUNTS)):
            # Recovered chair originals use their approved component ownership
            # and one shared family scale in chair_hd(), rather than row cuts.
            if pet=='toki' and row>=9:continue
            source=source_folder/(state+'.png')
            if not source.exists():continue
            image,stats=matte(source,'magenta' if pet=='hibiki' else 'green')
            target=folder/(pet+'-'+state+'.png')
            if stats['method']=='existing-alpha':shutil.copyfile(source,target)
            else:image.save(target,compress_level=9)
            alpha=np.asarray(image.getchannel('A'))
            column_occupancy=np.sum(alpha>24,axis=0)
            boundaries=[0]
            for i in range(1,count):
                nominal=image.width*i/count
                left=max(boundaries[-1]+1,round(nominal-45));right=min(image.width,round(nominal+45))
                occupancy=column_occupancy[left:right]
                low=int(occupancy.min())
                candidates=np.flatnonzero(occupancy==low)+left
                boundary=int(candidates[np.argmin(abs(candidates-nominal))])
                boundaries.append(boundary)
            boundaries.append(image.width)
            frames=[]
            for x0,x1 in zip(boundaries,boundaries[1:]):
                bbox=Image.fromarray(alpha[:,x0:x1]).point(lambda a:255 if a>24 else 0).getbbox()
                frames.append({'x':x0,'y':0,'width':x1-x0,'height':image.height,'foreground_bbox':bbox,'boundary_occupancy':int(column_occupancy[x0])})
            records.append({'pet':pet,'state':state,'row':row,'count':count,'source':str(source.relative_to(repo)).replace('\\','/'),'file':target.name,'source_width':image.width,'source_height':image.height,'frames':frames,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),**stats})
            print(pet,state,[(f['x'],f['width'],f['foreground_bbox'],f['boundary_occupancy']) for f in frames])
    return records


def components(mask,diagonal=True):
    parents=[];segments=[];previous=[]
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    def union(a,b):
        a=find(a);b=find(b)
        if a!=b:parents[max(a,b)]=min(a,b)
    for y,line in enumerate(mask):
        edges=np.diff(np.r_[False,line,False].astype(np.int8))
        starts=np.flatnonzero(edges==1);ends=np.flatnonzero(edges==-1)
        current=[];pointer=0
        for x0,x1 in zip(starts,ends):
            sid=len(parents);parents.append(sid)
            segments.append((y,int(x0),int(x1),sid));current.append((int(x0),int(x1),sid))
            while pointer<len(previous) and (previous[pointer][1]<x0 if diagonal else previous[pointer][1]<=x0):pointer+=1
            scan=pointer
            while scan<len(previous) and (previous[scan][0]<=x1 if diagonal else previous[scan][0]<x1):
                union(sid,previous[scan][2]);scan+=1
        previous=current
    parts={}
    for y,x0,x1,sid in segments:
        key=find(sid)
        parts.setdefault(key,[]).append((y,x0,x1))
    result=[]
    for runs in parts.values():
        pixels=sum(x1-x0 for _,x0,x1 in runs)
        bbox=[min(x0 for _,x0,_ in runs),min(y for y,_,_ in runs),max(x1 for _,_,x1 in runs),max(y for y,_,_ in runs)+1]
        result.append({'pixels':pixels,'bbox':bbox,'runs':runs})
    return sorted(result,key=lambda p:p['pixels'],reverse=True)


def register_hd(records,main_report):
    folder=assets/'motion-hd'
    manifest={'schema_version':1,'source':'approved-high-resolution-originals','published_atlas_cell':[192,208],'pets':{key:{'stage_width':520,'stage_height':520,'subject_height':340,'baseline_y':460,'rows':[]} for key in ['hibiki','toki']}}
    report=[]
    for record in records:
        rgba=np.asarray(Image.open(folder/record['file']).convert('RGBA'))
        alpha=rgba[:,:,3]
        parts=components(alpha>24)
        bodies=sorted([p for p in parts if p['pixels']>10000],key=lambda p:p['bbox'][0])
        assert len(bodies)==record['count'],(record['file'],len(bodies))
        centers=np.array([(p['bbox'][0]+p['bbox'][2])/2 for p in bodies])
        ownership=np.full(alpha.shape,-1,dtype=np.int16)
        for part in parts:
            xs=sum((x0+x1-1)/2*(x1-x0) for _,x0,x1 in part['runs'])/part['pixels']
            owner=int(np.argmin(abs(centers-xs)))
            for y,x0,x1 in part['runs']:ownership[y,x0:x1]=owner
        # Assign soft antialias pixels to their adjacent opaque component. This
        # partitions touching X ranges without clipping a neighboring silhouette.
        for _ in range(6):
            missing=(alpha>0)&(ownership<0)
            if not missing.any():break
            newer=ownership.copy()
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
                shifted=np.roll(ownership,(dy,dx),(0,1))
                if dy<0:shifted[dy:,:]=-1
                if dy>0:shifted[:dy,:]=-1
                if dx<0:shifted[:,dx:]=-1
                if dx>0:shifted[:,:dx]=-1
                use=missing&(newer<0)&(shifted>=0)
                newer[use]=shifted[use]
            ownership=newer
        missing_y,missing_x=np.where((alpha>0)&(ownership<0))
        for y,x in zip(missing_y,missing_x):ownership[y,x]=int(np.argmin(abs(centers-x)))

        cell_width=600
        registered=np.zeros((record['source_height'],cell_width*record['count'],4),dtype=np.uint8)
        source_ground=max(p['bbox'][3] for p in bodies)
        reference_height=float(np.median([p['bbox'][3]-p['bbox'][1] for p in bodies]))
        scale=min(1.0,340/reference_height)
        draw_y=460-source_ground*scale
        draw_x=(520-cell_width*scale)/2
        frames=[]
        lost=0
        for i in range(record['count']):
            nominal_origin=round((i+0.5)*record['source_width']/record['count']-cell_width/2)
            dx=HIBIKI_X_TRANSLATIONS[record['state']][i] if record['pet']=='hibiki' else 0
            origin=nominal_origin-dx
            yy,xx=np.where((ownership==i)&(alpha>0))
            dst_x=xx-origin
            inside=(dst_x>=0)&(dst_x<cell_width)
            lost+=int((~inside).sum())
            registered[yy[inside],i*cell_width+dst_x[inside]]=rgba[yy[inside],xx[inside]]
            local_bbox=Image.fromarray(registered[:,i*cell_width:(i+1)*cell_width,3]).point(lambda a:255 if a>16 else 0).getbbox()
            projected=[draw_x+local_bbox[0]*scale,draw_y+local_bbox[1]*scale,draw_x+local_bbox[2]*scale,draw_y+local_bbox[3]*scale]
            assert min(projected[:2])>=0 and max(projected[2:])<=520,(record['file'],i,projected)
            frame={'x':i*cell_width,'y':0,'width':cell_width,'height':record['source_height'],'draw_x':round(draw_x,6),'draw_y':round(draw_y,6),'draw_width':round(cell_width*scale,6),'draw_height':round(record['source_height']*scale,6),'alpha_bbox':local_bbox,'projected_alpha_bbox':[round(v,4) for v in projected],'original_nominal_origin_x':nominal_origin,'original_body_bbox':bodies[i]['bbox']}
            if record['pet']=='hibiki':
                frame.update(registered_source_origin_x=origin,integer_translation_x=dx)
            frames.append(frame)
        assert lost==0,(record['file'],lost)
        assert int(registered[:,:,3].sum())==int(alpha.sum()),record['file']
        registered_name=record['file'].replace('.png','-registered.png')
        Image.fromarray(registered,'RGBA').save(folder/registered_name,compress_level=9)
        row={'row':record['row'],'state':record['state'],'file':registered_name,'source_width':int(registered.shape[1]),'source_height':int(registered.shape[0]),'frame_width':cell_width,'frame_height':record['source_height'],'frame_count':record['count'],'sha256':hashlib.sha256((folder/registered_name).read_bytes()).hexdigest(),'frames':frames,'scale':round(scale,6),'registration':{'mode':'one-scale-and-one-y-offset-per-action','source_ground_y':source_ground,'reference_body_height':reference_height,'source_grid_step':record['source_width']/record['count'],'component_assignment':'body and props connected components; edges follow adjacent component','original_source':record['source'],'original_source_sha256':record['source_sha256'],'transparent_source_file':record['file'],'transparent_source_sha256':record['sha256'],'transparent_source_dimensions':[record['source_width'],record['source_height']]}}
        manifest['pets'][record['pet']]['rows'].append(row)
        report.append({'pet':record['pet'],'state':record['state'],'matting':{key:record[key] for key in ['method','background_rgb','background_strength','partial_pixels'] if key in record},'lost_pixels':lost,'alpha_sum_preserved':True,'common_source_ground':source_ground,'reference_height':reference_height,'scale':scale,'draw_y':draw_y,'feet_bottoms':[p['bbox'][3] for p in bodies],'registration':row['registration']})
        print(record['pet'],record['state'],'scale',round(scale,3),'ground',source_ground,'feet',[p['bbox'][3] for p in bodies])
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    (folder/'processing-report.json').write_text(json.dumps({'main_visual':main_report,'actions':report},indent=2)+'\n',encoding='utf8')


def chair_hd():
    """Restore the approved sixteen-pose chair family at source resolution.

    The original four-connected component map includes four observed halo
    ownership corrections. Nominal strip grids remain intact; no per-pose
    recentering, fitting, enlargement or new artwork is performed.
    """
    source_folder=repo/'pets'/'toki-bunny-fullbody-handdrawn'/'materials'/'selected-sources'
    provenance_path=source_folder/'look-source-provenance.json'
    if not provenance_path.exists():return
    provenance=json.loads(provenance_path.read_text(encoding='utf8'))
    folder=assets/'motion-hd'
    prepared=[]
    heights=[]
    for source_record in provenance['rows']:
        source=source_folder/source_record['original_source']
        source_sha=hashlib.sha256(source.read_bytes()).hexdigest()
        assert source_sha==source_record['source_sha256'],source
        original=np.asarray(Image.open(source).convert('RGBA'))
        assert original.shape[:2]==(source_record['source_height'],source_record['source_width'])
        rgb=original[:,:,:3].astype(np.int16)
        hard_mask=~((rgb[:,:,1]>rgb[:,:,0]+55)&(rgb[:,:,1]>rgb[:,:,2]+55))
        parts=components(hard_mask,diagonal=False)
        approved={tuple(p['bbox']):p for p in source_record['component_ownership']}
        assert {tuple(p['bbox']):p['pixels'] for p in parts}=={bbox:p['pixels'] for bbox,p in approved.items()}
        bodies=sorted([p for p in parts if p['pixels']>10000],key=lambda p:p['bbox'][0])
        assert len(bodies)==8
        heights.extend(p['bbox'][3]-p['bbox'][1] for p in bodies)
        image,stats=matte(source,'green',background_mask=~hard_mask)
        stats['observed_background_predicate']='green > red + 55 AND green > blue + 55'
        rgba=np.asarray(image)
        alpha=rgba[:,:,3]
        ownership=np.full(alpha.shape,-1,dtype=np.int16)
        for part in parts:
            owner=approved[tuple(part['bbox'])]['frame']
            for y,x0,x1 in part['runs']:ownership[y,x0:x1]=owner
        # Soft border pixels inherit the already approved adjacent component.
        # This keeps floating halo arcs with their true pose across X overlaps.
        for _ in range(6):
            missing=(alpha>0)&(ownership<0)
            if not missing.any():break
            newer=ownership.copy()
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
                shifted=np.roll(ownership,(dy,dx),(0,1))
                if dy<0:shifted[dy:,:]=-1
                if dy>0:shifted[:dy,:]=-1
                if dx<0:shifted[:,dx:]=-1
                if dx>0:shifted[:,:dx]=-1
                use=missing&(newer<0)&(shifted>=0)
                newer[use]=shifted[use]
            ownership=newer
        centers=np.array([(p['bbox'][0]+p['bbox'][2])/2 for p in bodies])
        missing_y,missing_x=np.where((alpha>0)&(ownership<0))
        for y,x in zip(missing_y,missing_x):ownership[y,x]=int(np.argmin(abs(centers-x)))
        state=STATES[source_record['row']]
        transparent_name='toki-'+state+'.png'
        image.save(folder/transparent_name,compress_level=9)
        prepared.append((source_record,source,rgba,alpha,ownership,bodies,stats,transparent_name))

    # Both halves share the same scale; their whole-strip ground offsets account
    # for the original seven-pixel difference in source chair-base placement.
    reference_height=float(np.median(heights))
    scale=min(1.0,340/reference_height)
    cell_width=600
    draw_x=(520-cell_width*scale)/2
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    report=json.loads((folder/'processing-report.json').read_text(encoding='utf8'))
    for record,source,rgba,alpha,ownership,bodies,stats,transparent_name in prepared:
        height,width=alpha.shape
        source_ground=max(p['bbox'][3] for p in bodies)
        draw_y=460-source_ground*scale
        registered=np.zeros((height,cell_width*8,4),dtype=np.uint8)
        frames=[]
        for i in range(8):
            origin=round((i+0.5)*width/8-cell_width/2)
            yy,xx=np.where((ownership==i)&(alpha>0))
            dst_x=xx-origin
            assert np.all((dst_x>=0)&(dst_x<cell_width)),(record['row'],i)
            registered[yy,i*cell_width+dst_x]=rgba[yy,xx]
            bbox=Image.fromarray(registered[:,i*cell_width:(i+1)*cell_width,3]).point(lambda a:255 if a>16 else 0).getbbox()
            projected=[draw_x+bbox[0]*scale,draw_y+bbox[1]*scale,draw_x+bbox[2]*scale,draw_y+bbox[3]*scale]
            assert min(projected[:2])>=0 and max(projected[2:])<=520,(record['row'],i,projected)
            frames.append({'x':i*cell_width,'y':0,'width':cell_width,'height':height,'draw_x':round(draw_x,6),'draw_y':round(draw_y,6),'draw_width':round(cell_width*scale,6),'draw_height':round(height*scale,6),'alpha_bbox':bbox,'projected_alpha_bbox':[round(v,4) for v in projected],'original_nominal_origin_x':origin,'original_body_bbox':bodies[i]['bbox']})
        assert int(registered[:,:,3].sum())==int(alpha.sum()),record['row']
        state=STATES[record['row']]
        filename=transparent_name.replace('.png','-registered.png')
        target=folder/filename
        Image.fromarray(registered,'RGBA').save(target,compress_level=9)
        row={'row':record['row'],'state':state,'file':filename,'source_width':cell_width*8,'source_height':height,'frame_width':cell_width,'frame_height':height,'frame_count':8,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'frames':frames,'scale':round(scale,6),'registration':{'mode':'one-shared-scale-for-sixteen-chair-directions-and-original-nominal-grid','source_ground_y':source_ground,'reference_body_height':reference_height,'source_grid_step':width/8,'component_assignment':'approved original four-connected pose and halo ownership; soft edges follow adjacent component','original_source':source.relative_to(repo).as_posix(),'original_source_sha256':record['source_sha256'],'transparent_source_file':transparent_name,'transparent_source_sha256':hashlib.sha256((folder/transparent_name).read_bytes()).hexdigest(),'transparent_source_dimensions':[width,height],'source_provenance':provenance_path.relative_to(repo).as_posix()}}
        rows=manifest['pets']['toki']['rows']
        rows[:]=[item for item in rows if item['row']!=record['row']]
        rows.append(row)
        actions=report['actions']
        actions[:]=[item for item in actions if not(item['pet']=='toki' and item['state']==state)]
        actions.append({'pet':'toki','state':state,'matting':stats,'lost_pixels':0,'alpha_sum_preserved':True,'common_source_ground':source_ground,'reference_height':reference_height,'scale':scale,'draw_y':draw_y,'feet_bottoms':[p['bbox'][3] for p in bodies],'registration':row['registration']})
        print('toki',state,'recovered chair scale',round(scale,6),'source ground',source_ground)
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    (folder/'processing-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')


if __name__=='__main__':
    main_report=main_visuals()
    register_hd(hd_strips(),main_report)
    chair_hd()
    print('Website cutouts and manifest regenerated in site/assets/.')
