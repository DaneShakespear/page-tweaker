"""Package local deliverables; no uploads or publication."""
from pathlib import Path
import shutil, json, hashlib, zipfile, subprocess, struct
from PIL import Image

root=Path(__file__).resolve().parents[2]
out=root/'out/teaser'
for name in ['preview.html','description.vtt']:
    shutil.copyfile(root/'marketing/teaser'/name,out/name)
video=out/'ai-pagepolish-teaser.mp4'
data=video.read_bytes()
atoms=[];offset=0
while offset<len(data):
    size=struct.unpack('>I',data[offset:offset+4])[0]
    assert size>0
    atoms.append(data[offset+4:offset+8].decode())
    offset+=size
assert atoms.index('moov')<atoms.index('mdat')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,pix_fmt','-of','json',str(video)]))
s=probe['streams'][0]
assert s['codec_name']=='h264' and s['width']==1920 and s['height']==1080
assert s['r_frame_rate']=='30/1' and float(probe['format']['duration'])==30
assert 'font-size:44px' in (root/'marketing/teaser/demo.html').read_text()
evidence=json.loads((out/'capture-verification.json').read_text())
assert evidence['computed']=={'size':'64px','margin':'22px'}
assert evidence['replacement']=='Make room for better ideas.'
assert evidence['sourceUnchanged']
assert evidence['handoff']['pages'][0]['previewTextEvidence'][0]['previewText']==evidence['replacement']
assert evidence['handoff']['pages'][0]['markup'][0]['explanation']==evidence['note']
evidence['captureSize']=list(Image.open(out/'captures/03-adjusted.png').size)
(out/'capture-verification.json').write_text(json.dumps(evidence,indent=2))
report={'video':probe,'fastStart':True,'sha256':hashlib.sha256(data).hexdigest(),'previewValues':evidence['computed'],'sourceStill44px':True,'annotation':'Move the button closer to the text.','renderedLocally':True}
(out/'verification.json').write_text(json.dumps(report,indent=2))
with zipfile.ZipFile(out/'editable-source.zip','w',zipfile.ZIP_DEFLATED) as z:
    files=list((root/'marketing/teaser').glob('*'))+list((out/'captures').glob('*.png'))+[root/'src/app-icon.png',out/'capture-verification.json']
    for file in files:
        if file.is_file():z.write(file,str(file.relative_to(root)))
with zipfile.ZipFile(out/'web-assets.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['ai-pagepolish-teaser.mp4','poster.jpg','preview.html','description.vtt']:
        z.write(out/name,name)
print(json.dumps({'webBytes':(out/'web-assets.zip').stat().st_size,'sourceBytes':(out/'editable-source.zip').stat().st_size,'videoBytes':len(data)}))
