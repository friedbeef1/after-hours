# Turns raw generated audio into small, evenly loud game files.
import subprocess, re, os, sys, glob
OUT = sys.argv[1]
def peak(path, pre=""):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path] + (["-af", pre] if pre else []) + ["-af" if not pre else "-filter:a", (pre + "," if pre else "") + "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else 0.0
TRIM = "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.01,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse"
RADIO = "highpass=f=320,lowpass=f=3300,acompressor=threshold=-18dB:ratio=4:attack=5:release=80"
def one(src, name, chain, target=-1.5, stereo=False, rate="64k", ss=None, to=None):
    cut = (["-ss", str(ss)] if ss is not None else []) + (["-to", str(to)] if to is not None else [])
    tmp = f"/tmp/_hs_{name}.wav"
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + cut + ["-i", src, "-af", chain, "-ar", "44100", "-ac", "2" if stereo else "1", tmp], check=True)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr); gain = target - (float(m.group(1)) if m else 0)
    dst = os.path.join(OUT, name + ".mp3")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-af", f"volume={gain:.2f}dB", "-b:a", rate, dst], check=True)
    os.remove(tmp)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst], capture_output=True, text=True).stdout.strip()
    return f"{name}: {float(d):.2f}s {os.path.getsize(dst)//1024}KB"
mode = sys.argv[2] if len(sys.argv) > 2 else "voice"
if mode == "voice":
    for f in sorted(glob.glob("raw/*.wav")):
        n = os.path.basename(f)[:-4]
        chain = TRIM if n.startswith(("ann_", "noise_")) else TRIM + "," + RADIO
        print(one(f, n, chain, -1.5 if n.startswith("ann_") else -2.5))
    fade = lambda d, o=1.2: f"afade=t=in:d=0.03,afade=t=out:st={d-o}:d={o}"
    print(one("raw/music_menu.mp3", "music_menu", "afade=t=in:d=0.05,afade=t=out:st=59.5:d=1.5", -3, True, "112k"))
    print(one("raw/music_win.mp3", "music_win", fade(6.5), -3, True, "112k", 0, 6.5))
    print(one("raw/music_lose.mp3", "music_lose", fade(6.0, 1.0), -3, True, "112k", 9.8, 15.8))
    print(one("raw/music_victory.mp3", "music_victory", fade(30, 2), -3, True, "112k", 0, 30))
    print(one("raw/music_defeat.mp3", "music_defeat", fade(30, 2), -3, True, "112k", 0, 30))
    print(one("raw/music_fuse.mp3", "music_fuse", fade(30, 0.5), -3, True, "112k", 0, 30))
if mode == "sfx":
    cuts = {"sfx_squirt": ("squirt", 0.50, 0.95), "sfx_egg": ("egg", 0.22, 0.50), "sfx_pea": ("pea", 0.06, 0.58), "sfx_tomato": ("tomato", 0.12, 0.52),
            "sfx_splat": ("splat_wall", 0.10, 0.80), "sfx_thwap": ("splat_body", 0.20, 0.70), "sfx_step1": ("steps", 0.17, 0.44), "sfx_step2": ("steps", 0.45, 0.72),
            "sfx_step3": ("steps", 0.73, 1.00), "sfx_step4": ("steps", 1.01, 1.30), "sfx_refill": ("reload", 1.20, 2.40), "sfx_bell": ("bell", 0.04, 1.80),
            "sfx_rooster": ("rooster", 0.35, 1.58), "sfx_tick": ("tick", 0.03, 0.16), "sfx_tock": ("tick", 0.29, 0.42), "sfx_cork_pop": ("cork", 4.20, 4.62),
            "sfx_squeak": ("cork", 0.20, 1.15), "sfx_thud": ("plant", 0.38, 0.82), "sfx_click": ("buy", 0.22, 0.76), "sfx_flop": ("flop", 0.42, 1.25), "sfx_cluck": ("ambience", 0.0, 3.2)}
    for name, (src, a, b) in cuts.items():
        d = b - a
        print(one(f"sfx/{src}.mp3", name, f"afade=t=in:d=0.004,afade=t=out:st={max(0, d-0.05):.3f}:d=0.05", -6 if "step" in name else -3, False, "96k", a, b))
