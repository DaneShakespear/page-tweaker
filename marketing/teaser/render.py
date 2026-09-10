"""Local, deterministic 20-second product teaser. Requires Pillow and ffmpeg.

Real app captures supply all product UI. Titles, cursor and generic AI composer
are editorial graphics. File paths are masked before any frame is rendered.
"""
from pathlib import Path
from functools import lru_cache
import math, subprocess, json, hashlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'out/teaser'
CAP = OUT / 'captures'
W,H,FPS,DURATION = 1920,1080,30,20
BG = '#0a1016'
WHITE = '#f4f7fa'
MUTED = '#9baab7'
CYAN = '#64d7ff'
FONT = '/System/Library/Fonts/SFNS.ttf'

@lru_cache(None)
def font(size,weight='Regular'):
    f=ImageFont.truetype(FONT,size)
    f.set_variation_by_name(weight)
    return f

def text(im,xy,value,size=36,color=WHITE,weight='Regular',anchor=None):
    ImageDraw.Draw(im).text(xy,value,font=font(size,weight),fill=color,anchor=anchor,spacing=10)

def ease(v):
    v=max(0,min(1,v));return 1-(1-v)**3

def lerp(a,b,p):return a+(b-a)*p

@lru_cache(None)
def cap(name):
    im=Image.open(CAP/(name+'.png')).convert('RGB').resize((1840,1000),Image.Resampling.LANCZOS)
    d=ImageDraw.Draw(im)
    # Editorial privacy mask: preserve address-bar geometry, remove host path.
    d.rounded_rectangle((570,19,1590,43),radius=4,fill='#1b222c')
    text(im,(580,22),'Studio demo / local HTML',16,'#cbd6df')
    if name=='05-handoff':
        d.rounded_rectangle((1538,441,1813,520),radius=5,fill='#202731')
        text(im,(1550,455),'Visual brief ready',17,'#cbd6df')
    return im

def cursor(im,x,y,pulse=0):
    d=ImageDraw.Draw(im)
    if pulse>0:
        r=12+25*pulse
        d.ellipse((x-r,y-r,x+r,y+r),outline=CYAN,width=3)
    pts=[(x,y),(x+1,y+29),(x+9,y+22),(x+17,y+37),(x+24,y+33),(x+16,y+19),(x+28,y+18)]
    d.polygon(pts,fill='white',outline='#091116',width=2)

def rounded_paste(im,asset,box,radius=20):
    x,y,w,h=map(round,box)
    asset=asset.resize((w,h),Image.Resampling.LANCZOS)
    mask=Image.new('L',(w,h));ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=radius,fill=255)
    im.paste(asset,(x,y),mask)
    ImageDraw.Draw(im).rounded_rectangle((x,y,x+w-1,y+h-1),radius=radius,outline='#35424d',width=1)

def header(im,label='VISUAL FEEDBACK FOR AI-BUILT WEBSITES'):
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((88,66,96,85),radius=4,fill=CYAN)
    text(im,(114,64),'AI PagePolish',24,WHITE,'Semibold')
    text(im,(1818,68),label,16,MUTED,anchor='ra')

def backdrop():
    im=Image.new('RGB',(W,H),BG)
    d=ImageDraw.Draw(im)
    for y in range(H):
        v=y/H;d.line((0,y,W,y),fill=(10+int(3*v),16+int(5*v),22+int(7*v)))
    return im

BASE=backdrop()
ICON=Image.open(ROOT/'src/app-icon.png').convert('RGBA')

def intro(t):
    im=BASE.copy();header(im)
    p=ease(t/.65)
    layer=Image.new('RGBA',(W,H))
    y=300+int((1-p)*45)
    text(layer,(140,y),'Stop explaining.',112,'#a8b7c2','Semibold')
    text(layer,(140,y+130),'Show your AI.',132,WHITE,'Bold')
    d=ImageDraw.Draw(layer);d.rounded_rectangle((146,y+290,146+int(705*ease((t-.3)/.6)),y+298),radius=4,fill=CYAN)
    text(layer,(146,y+342),'Open it. Adjust it. Show AI.',34,MUTED)
    icon=ICON.resize((300,300),Image.Resampling.LANCZOS)
    layer.alpha_composite(icon,(1455,340))
    layer.putalpha(layer.getchannel('A').point(lambda x:int(x*p)))
    im.paste(layer,(0,0),layer)
    text(im,(146,933),'THE LAST 10% JUST GOT CLEARER.',20,MUTED,'Medium')
    return im

def edit(t):
    im=BASE.copy();header(im,'OPEN IT. ADJUST IT.')
    text(im,(100,122),'See it. Adjust it.',66,WHITE,'Semibold')
    if t<1.4:
        name='01-page' if t<.75 else '02-selected'
        frame=cap(name).crop((0,0,1840,920))
        p=ease(t/.5); y=235+40*(1-p)
        rounded_paste(im,frame,(120,y,1680,840),18)
        if t>.5:cursor(im,120+270*1680/1840,y+300*1680/1840,max(0,1-(t-.6)/.5))
    else:
        k=min(20,max(0,int((t-1.7)/2.2*20)))
        name=f'size-{k:02d}' if t<4.25 else '03-adjusted'
        pic=cap(name)
        # Tight editorial crops keep both the real page and the real control readable.
        rounded_paste(im,pic.crop((60,200,740,701)),(100,258,1110,818),20)
        text(im,(1295,328),'A little bigger.',36,WHITE,'Medium')
        rounded_paste(im,pic.crop((1530,370,1820,445)),(1295,410,525,136),14)
        text(im,(1295,601),'Exactly like that.',34,CYAN,'Medium')
        text(im,(1295,657),'Preview the change\non the real page.',28,MUTED)
        if t<4.25:
            x=1295+lerp(175,365,k/20)
            cursor(im,x,505)
    return im

def mark(t):
    im=BASE.copy();header(im,'DRAW IT. EXPLAIN IT.')
    text(im,(100,122),'Point to what matters.',66,WHITE,'Semibold')
    k=min(12,max(0,int((t-.4)/1.05*12)))
    name=f'arrow-{k:02d}' if t<1.5 else '04-marked'
    pic=cap(name)
    # The annotation and note below are pixels from the app, not recreated labels.
    rounded_paste(im,pic.crop((65,220,755,676)),(100,258,1200,794),20)
    text(im,(1370,375),'Draw.',44,WHITE,'Semibold')
    text(im,(1370,438),'Add context.',44,WHITE,'Semibold')
    text(im,(1370,555),'Show what\nwords miss.',34,CYAN,'Medium')
    if .4<t<1.5:
        p=k/12
        cursor(im,100+(lerp(336,311,p)-65)*1200/690,258+(lerp(582,510,p)-220)*794/456)
    return im

def zipcard(im,box,alpha=1):
    x,y,w,h=map(int,box)
    layer=Image.new('RGBA',(w,h));d=ImageDraw.Draw(layer)
    d.rounded_rectangle((0,0,w-1,h-1),radius=18,fill='#173445',outline=CYAN,width=2)
    sz=min(75,h-25);icon=ICON.resize((sz,sz),Image.Resampling.LANCZOS);layer.alpha_composite(icon,(14,(h-sz)//2))
    text(layer,(sz+29,h//2-25),'Visual brief.zip',24,WHITE,'Semibold')
    text(layer,(sz+29,h//2+9),'Ready for your AI',18,'#a7c6d5')
    if alpha<1:layer.putalpha(layer.getchannel('A').point(lambda v:int(v*alpha)))
    im.paste(layer,(x,y),layer)

def handoff(t):
    im=BASE.copy();header(im,'SHOW AI.')
    text(im,(100,122),'One complete brief. Back to AI.',66,WHITE,'Semibold')
    # Real exported handoff panel, limited to the draggable file and its instructions.
    pic=cap('05-handoff').crop((1525,65,1828,408))
    rounded_paste(im,pic,(135,296,485,549),20)
    text(im,(137,901),'Your changes. Your notes. One file.',27,MUTED)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((1100,327,1798,839),radius=26,fill='#141e27',outline='#33424d',width=2)
    text(im,(1142,365),'Your AI chat',30,WHITE,'Semibold')
    text(im,(1142,432),'Show exactly what should change.',25,MUTED)
    d.rounded_rectangle((1137,510,1761,791),radius=20,fill='#0d151d',outline='#41515f',width=2)
    if t<2.7:text(im,(1449,615),'Drop your visual brief here',27,'#7895a7',anchor='mm')
    else:
        text(im,(1170,730),'Use this brief to update the page.',24,WHITE)
        d.ellipse((1698,731,1734,767),fill=CYAN)
        d.line((1716,756,1716,741),fill=BG,width=3)
        d.line((1709,748,1716,741,1723,748),fill=BG,width=3)
    p=ease((t-.85)/1.5)
    x=lerp(245,1170,p);y=lerp(664,546,p)-math.sin(p*math.pi)*115
    if t>.7:
        zipcard(im,(x,y,425,120),ease((t-.7)/.25))
        if t<2.8:cursor(im,x+355,y+72)
    text(im,(1142,895),'All the context travels with it.',27,CYAN)
    return im

def closing(t):
    im=BASE.copy();p=ease(t/.5)
    layer=Image.new('RGBA',(W,H))
    icon=ICON.resize((170,170),Image.Resampling.LANCZOS);layer.alpha_composite(icon,(875,171))
    text(layer,(960,389),'AI PagePolish',90,WHITE,'Bold',anchor='ma')
    text(layer,(960,493),'by PageTweaker',29,MUTED,'Medium',anchor='ma')
    text(layer,(960,622),'Show exactly what you mean.',57,WHITE,'Semibold',anchor='ma')
    d=ImageDraw.Draw(layer);d.rounded_rectangle((711,772,1209,855),radius=18,fill=CYAN)
    text(layer,(960,797),'Download for macOS',29,'#0a1922','Semibold',anchor='ma')
    text(layer,(960,906),'Open it. Adjust it. Show AI.',24,MUTED,anchor='ma')
    layer.putalpha(layer.getchannel('A').point(lambda v:int(v*p)))
    im.paste(layer,(0,int((1-p)*22)),layer)
    return im

SCENES=[(0,3,intro),(3,9,edit),(9,13,mark),(13,17,handoff),(17,20,closing)]
def frame(t):
    for i,(start,end,fn) in enumerate(SCENES):
        if start<=t<end:
            current=fn(t-start)
            if i and t-start<.2:
                prev=SCENES[i-1];before=prev[2](prev[1]-prev[0]-.001)
                current=Image.blend(before,current,ease((t-start)/.2))
            return current
    return closing(2.9)

def main():
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--proof',action='store_true');args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    times=[1.2,3.8,5.5,8.2,10.1,12.2,14.1,16.3,18.6]
    sheet=Image.new('RGB',(1440,864),BG)
    for i,t in enumerate(times):
        f=frame(t);f.save(OUT/f'proof-{t:.1f}.jpg',quality=94)
        tile=f.resize((480,270),Image.Resampling.LANCZOS)
        sheet.paste(tile,((i%3)*480,(i//3)*288));text(sheet,((i%3)*480+10,(i//3)*288+270),f'{t:.1f}s',14)
    sheet.save(OUT/'contact-sheet.jpg',quality=95)
    frame(1.8).save(OUT/'poster.jpg',quality=95)
    if args.proof:return
    dest=OUT/'ai-pagepolish-teaser.mp4'
    command=['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',str(dest)]
    process=subprocess.Popen(command,stdin=subprocess.PIPE)
    for i in range(FPS*DURATION):
        process.stdin.write(frame(i/FPS).tobytes())
        if i%150==0:print(f'Rendered {i}/{FPS*DURATION} frames',flush=True)
    process.stdin.close()
    if process.wait()!=0:raise RuntimeError('Video encoding failed')
    print(f'Created {dest.name}: {dest.stat().st_size:,} bytes',flush=True)

if __name__=='__main__':main()
