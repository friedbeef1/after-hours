import sys, json, os, base64, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen
from concurrent.futures import ThreadPoolExecutor

ANN = ("Orus", "a deep, booming, jolly county-fair announcer speaking over a loudspeaker, confident and clear, short and punchy")
HERD = ("Fenrir", "a plucky cartoon farm animal shouting to teammates over a walkie-talkie, high-pitched, squeaky, excited and energetic")
HERD2 = ("Leda", "a young, cheeky cartoon farm animal calling out to teammates over a walkie-talkie, bright, fast and playful")
HANDS = ("Achird", "a friendly farmer with a warm country drawl calling out loudly to the team over a walkie-talkie, clear and urgent but good-natured")
HANDS2 = ("Sulafat", "a cheerful farm woman with a light country accent calling out loudly to the team over a walkie-talkie, clear and brisk")
def noise(animal): return ("Fenrir", f"a voice actor doing a loud, silly, convincing impression of a {animal} noise, no real words, short")

VOICE = {
 # announcer
 "ann_welcome": (ANN, "Welcome to Harvest Standoff!"),
 "ann_go": (ANN, "Let's go!"),
 "ann_planted": (ANN, "The Stink-Pumpkin has been planted!"),
 "ann_corked": (ANN, "The pumpkin has been corked!"),
 "ann_stink": (ANN, "Pee-yew! What a stinker!"),
 "ann_herd_win": (ANN, "The Herd wins!"),
 "ann_hands_win": (ANN, "The Farmhands win!"),
 "ann_time": (ANN, "Time's up!"),
 "ann_half": (ANN, "Half-time! Switch sides!"),
 "ann_match_point": (ANN, "Match point!"),
 "ann_ten": (ANN, "Ten seconds!"),
 "ann_victory": (ANN, "Victory! What a harvest!"),
 "ann_defeat": (ANN, "Better luck next harvest!"),
 "ann_lts": (ANN, "Last team standing! Splat them all!"),
 "ann_reveal": (ANN, "Nowhere left to hide!"),
 "ann_draw": (ANN, "It's a draw!"),
 # the Herd
 "herd_go_1": (HERD, "Stampede! Go, go, go!"),
 "herd_go_2": (HERD2, "Hooves and feathers, move out!"),
 "herd_spot_1": (HERD, "Farmer spotted!"),
 "herd_spot_2": (HERD2, "Overalls, dead ahead!"),
 "herd_planting": (HERD, "Planting the pumpkin! Cover me!"),
 "herd_guard": (HERD2, "Pumpkin's down! Guard it!"),
 "herd_dropped": (HERD, "I dropped the pumpkin!"),
 "herd_got_it": (HERD2, "I've got the pumpkin!"),
 "herd_hurt_1": (HERD, "Hey! I'm soaked!"),
 "herd_hurt_2": (HERD2, "Yikes, that's sticky!"),
 "herd_out_1": (HERD, "Aw, hay bales! I'm splatted!"),
 "herd_out_2": (HERD2, "Splat! I'm out!"),
 "herd_nice": (HERD, "Nice shot!"),
 "herd_refill": (HERD2, "Refilling!"),
 "herd_to_a": (HERD, "To the barn!"),
 "herd_to_b": (HERD2, "Going to the garden!"),
 "herd_corking": (HERD, "Corking the pumpkin! Cover me!"),
 # the Hands
 "hands_go_1": (HANDS, "Alright farmhands, move it!"),
 "hands_go_2": (HANDS2, "Protect the farm!"),
 "hands_spot_1": (HANDS, "Critter spotted!"),
 "hands_spot_2": (HANDS2, "Animals in the yard!"),
 "hands_corking": (HANDS, "Corking the pumpkin! Cover me!"),
 "hands_planted_a": (HANDS2, "The pumpkin is at the barn!"),
 "hands_planted_b": (HANDS, "The pumpkin is at the garden!"),
 "hands_hurt_1": (HANDS, "Yeesh, right in the overalls!"),
 "hands_hurt_2": (HANDS2, "Hey, watch the hat!"),
 "hands_out_1": (HANDS, "Well, butter my biscuit. I'm splatted!"),
 "hands_out_2": (HANDS2, "Oh, fiddlesticks! I'm out!"),
 "hands_nice": (HANDS, "Nice shot, partner!"),
 "hands_refill": (HANDS, "Refilling my tank!"),
 "hands_to_a": (HANDS, "Heading to the barn!"),
 "hands_to_b": (HANDS2, "Heading to the garden!"),
 "hands_planting": (HANDS, "Planting the pumpkin! Cover me!"),
 "hands_guard": (HANDS2, "Pumpkin's down! Guard it!"),
 "hands_dropped": (HANDS, "Dropped the pumpkin!"),
 "hands_got_it": (HANDS2, "I've got the pumpkin!"),
 # animal noises
 "noise_chicken": (noise("chicken clucking and squawking"), "Bok bok bok, ba-GAWK!"),
 "noise_pig": (noise("pig oinking and squealing"), "Oink! Oink! Squeeee!"),
 "noise_cow": (noise("cow mooing"), "Moooooo!"),
 "noise_sheep": (("Leda", "a voice actor doing a loud, silly, wobbly impression of a sheep bleating, high pitched and nasal, clearly a sheep"), "Baa! Baaa-aaa-aah!"),
 "noise_goat": (("Puck", "a voice actor doing a loud, silly, nasal impression of a goat bleating, clearly a goat"), "Maaah! Maa-aa-aah!"),
}
MUSIC = {
 "music_menu": ("lyria-3.5", "Create a 1-minute instrumental track with no vocals. A bright, bouncy video game main-menu theme for a family-friendly farm game: lively banjo and fiddle lead, acoustic guitar, upright bass, light brushed drums, playful tuba accents. Adventurous and mischievous, like a friendly barnyard heist. Steady medium-fast tempo, ends in a way that loops smoothly back to the start."),
 "music_win": ("lyria-3-clip-preview", "Instrumental, no vocals. Starts instantly with a short triumphant victory fanfare: banjo, fiddle and bright brass hits, bouncy and joyful, building to one big final chord within the first six seconds, then stays quiet."),
 "music_lose": ("lyria-3-clip-preview", "Instrumental, no vocals. Starts instantly with a short comedic 'oh no' failure sting: a tuba and slide whistle sliding downward with a single plucked banjo note at the end, playful and silly rather than sad, finished within the first five seconds, then stays quiet."),
 "music_victory": ("lyria-3-clip-preview", "Instrumental, no vocals. A joyful barn-dance celebration hoedown: fast fiddle, banjo, hand claps, stomping kick drum, washboard. Triumphant and fun, family friendly video game victory screen."),
 "music_defeat": ("lyria-3-clip-preview", "Instrumental, no vocals. A gentle, warm, slightly wistful but hopeful tune: slow acoustic guitar, soft harmonica and upright bass. Family friendly video game 'better luck next time' screen, comforting not gloomy."),
 "music_fuse": ("lyria-3-clip-preview", "Instrumental, no vocals. A tense but playful sneaky countdown loop: pizzicato strings, a ticking woodblock like a clock, low tuba pulses, nervous banjo plucks, gradually more urgent. Cartoon suspense for a family friendly game, steady tempo, loops smoothly."),
 # experiments: can the music model make stand-alone sound effects?
 "sfx_try_rooster": ("lyria-3-clip-preview", "Sound effects only, absolutely no music and no instruments: a real rooster crowing loudly at dawn on a farm, a pause of silence, then crowing once more."),
 "sfx_try_cowbell": ("lyria-3-clip-preview", "Sound design only, no melody and no other instruments: one single metal cowbell struck once and left to ring out, followed by four seconds of silence, repeated."),
 "sfx_try_splat": ("lyria-3-clip-preview", "Foley sound effects only, no music and no instruments: the wet squishy splat of a ripe tomato hitting a wooden wall, once every three seconds with silence in between."),
}
def listen(path, mime):
    # ask a listening model what is actually in the clip, since the author of this script cannot hear
    import urllib.request
    data = base64.b64encode(open(path, "rb").read()).decode()
    body = {"contents": [{"parts": [{"inline_data": {"mime_type": mime, "data": data}}, {"text": "Describe this audio in at most 2 sentences. If there is speech, start with the exact words spoken in quotes, then the voice character and any problems (cut off, noise, extra words). If there is no speech, say what sounds or instruments are heard and at what seconds."}]}]}
    req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": "dummy"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r: d = json.load(r)
        return " ".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"]).strip()[:400]
    except Exception as e: return "LISTEN FAILED " + str(e)[:200]

def do_voice(item):
    k, ((voice, style), text) = item; p = f"raw/{k}.wav"
    if os.path.exists(p) and os.path.getsize(p) > 2000: return k, "cached", listen(p, "audio/wav") if "--relisten" in sys.argv else ""
    r = gen.tts(text, style, voice, p)
    return k, r, (listen(p, "audio/wav") if r == "audio/wav" else "")
def do_music(item):
    k, (model, prompt) = item; p = f"raw/{k}.mp3"
    if os.path.exists(p) and os.path.getsize(p) > 20000: return k, "cached", ""
    r = gen.music(prompt, p, model)
    return k, r[:120], (listen(p, "audio/mpeg") if r.startswith("audio") else "")

only = [a for a in sys.argv[1:] if not a.startswith("--")]
log = {}
with ThreadPoolExecutor(4) as ex:
    jobs = [ex.submit(do_voice, it) for it in VOICE.items() if not only or it[0] in only] + [ex.submit(do_music, it) for it in MUSIC.items() if not only or it[0] in only]
    for j in jobs:
        k, r, heard = j.result(); log[k] = {"result": r, "heard": heard, "wanted": VOICE.get(k, (0, ""))[1] if k in VOICE else ""}
        print(k, "|", r, "|", heard, flush=True)
old = json.load(open("log.json")) if os.path.exists("log.json") else {}
old.update(log); json.dump(old, open("log.json", "w"), indent=1)
print("DONE", len(log))
