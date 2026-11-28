import numpy as np, wave, sys
SR=48000; DUR=57.2
out=np.zeros(int(SR*DUR))
def env(n,a=.004,d=.1):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def tambah(x,at,vol):
    x=x/np.max(np.abs(x))*vol; i=int(at*SR); out[i:i+len(x)]+=x[:len(out)-i]
def sweep(f0,f1,dur,d,vib=0,vr=0):
    n=int(SR*dur); t=np.arange(n)/SR; f=f0*(f1/f0)**(t/dur)
    if vib: f=f*(1+vib*np.sin(2*np.pi*vr*t))
    ph=2*np.pi*np.cumsum(f)/SR; return (np.sin(ph)+.25*np.sin(2*ph))*env(n,.003,d)
def lonceng(f,dur,d):
    n=int(SR*dur); t=np.arange(n)/SR
    return sum(a*np.sin(2*np.pi*f*m*t)*np.exp(-t/(d/m**.5)) for m,a in[(1,1),(2.76,.35),(5.4,.12)])*np.minimum(1,t/.002)
# 1 pop tikus muncul
tambah(sweep(380,950,.12,.035),1.74,.30)
# 2 boing gajah meloncat
tambah(sweep(150,320,.42,.16,vib=.12,vr=22),2.06,.26)
# 3 tik tetes keringat
tambah(lonceng(1700,.25,.05),2.33,.16)
# 4 blip saat menoleh ke kamera
tambah(lonceng(660,.3,.06),4.25,.16); tambah(lonceng(880,.3,.06),4.33,.16)
# 5 boing kecil + kilau bintang saat kaget
tambah(sweep(170,360,.38,.14,vib=.1,vr=20),7.12,.22)
for i,(d,f) in enumerate([(0,2093),(.06,2637),(.12,3136),(.18,2349)]):
    tambah(lonceng(f,.6,.12),7.14+d,.13)

rng=np.random.default_rng(7)
def bising(dur,d,lo,hi,naik=False):
    n=int(SR*dur); x=rng.standard_normal(n); X=np.fft.rfft(x); f=np.fft.rfftfreq(n,1/SR); X[(f<lo)|(f>hi)]=0; x=np.fft.irfft(X,n)
    t=np.arange(n)/SR; e=(t/dur)**1.5*np.minimum(1,(dur-t)/.08) if naik else env(n,.01,d); return x*e
# kretek api (jarang)
for at in[8.6,9.15,9.7,10.5]: tambah(bising(.06,.012,1500,6000),at,.07)
# jinjit tikus
for i,at in enumerate([12.0,12.22,12.44,12.66]): tambah(lonceng([520,620,560,660][i],.2,.04),at,.10)
# plop masuk belalai
tambah(sweep(620,220,.16,.05),13.18,.22)
# tarik napas gajah
tambah(bising(.7,0,300,1800,naik=True),15.75,.12)
# semburan air
tambah(bising(.75,.25,600,5000),16.62,.20)
# wus tikus terbang
tambah(sweep(900,500,.35,.12,vib=.2,vr=30),16.9,.10)
# buk mendarat di semak + gemeresik
tambah(sweep(110,70,.25,.08),18.15,.26); tambah(bising(.35,.1,2000,7000),18.17,.08)
# tuk drum sirkus
tambah(sweep(160,110,.25,.09)+0,21.15,.16)

# mesin jip pelan (dengung rendah berdenyut) + rem
n=int(SR*1.9);tt=np.arange(n)/SR;mesin=np.sin(2*np.pi*55*tt)*(0.6+0.4*np.sin(2*np.pi*11*tt))*np.minimum(1,tt/.2)*np.minimum(1,(1.9-tt)/.3)
tambah(mesin,23.85,.10); tambah(bising(.25,.08,2500,6000),25.7,.05)
# pluk kotoran ditaruh
tambah(sweep(180,90,.2,.06),29.65,.18)
# langkah gajah pelan
for at in[30.9,31.5,32.1,34.9,35.5,36.1,36.7,39.5,40.1,40.7,41.3]: tambah(sweep(70,50,.2,.07),at,.10)
# tali ditarik / kotoran diangkat
tambah(bising(.3,.08,1200,5000),32.0,.10); tambah(bising(.3,.08,1200,5000),38.0,.10)
# kaget gajah
tambah(sweep(150,320,.42,.16,vib=.12,vr=22),32.55,.22); tambah(lonceng(1700,.25,.05),32.92,.14)

# pop kumbang & tikus + boing kecil gajah
tambah(sweep(380,950,.12,.035),45.18,.24); tambah(sweep(150,320,.3,.1,vib=.12,vr=22),45.22,.18)
tambah(sweep(420,1000,.12,.035),46.32,.24); tambah(sweep(160,340,.3,.1,vib=.12,vr=22),46.37,.18)
# telinga menegak
tambah(lonceng(990,.3,.06),48.8,.12)
# dengung lebah
n=int(SR*3.4);tt=np.arange(n)/SR;f=230*(1+.04*np.sin(2*np.pi*7*tt));ph=2*np.pi*np.cumsum(f)/SR
buzz=(2*((ph/(2*np.pi))%1)-1)*(.5+.5*np.sin(2*np.pi*13*tt))**2;e=np.minimum(1,tt/.6)*np.minimum(1,(3.4-tt)/.8)
tambah(np.convolve(buzz*e,np.ones(6)/6,'same'),49.2,.11)
# langkah lari cepat
for i in range(12): tambah(sweep(80,55,.12,.04),50.0+i*.15,.07)
# pop tunjuk + denting penutup
tambah(sweep(380,950,.12,.035),54.55,.18); tambah(lonceng(1568,.9,.25),55.8,.10); tambah(lonceng(2093,.9,.25),55.95,.08)
# reverb kecil
ir=np.random.default_rng(3).standard_normal(int(SR*.35))*np.exp(-np.arange(int(SR*.35))/SR/.08)*.025
out=out+np.convolve(out,ir)[:len(out)]
out=out/np.max(np.abs(out))*0.6
st=np.stack([out,out],1); d=(st*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes()); w.close()
