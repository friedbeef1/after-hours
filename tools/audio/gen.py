# Small helpers for the Google audio API (voice + music). Credentials are injected by the proxy.
import base64, json, sys, urllib.request, os, time
URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
def call(body, timeout=300):
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": "dummy", "Api-Revision": "2026-05-20"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()[:600]}
def audio_of(resp):
    out = None; text = []
    for s in resp.get("steps", []):
        if s.get("type") != "model_output": continue
        for c in s.get("content", []):
            if c.get("type") == "audio": out = (base64.b64decode(c["data"]), c.get("mime_type"))
            elif c.get("type") == "text": text.append(c.get("text", ""))
    return out, " ".join(text)
def tts(text, style, voice, path, model="gemini-3.8-flash-tts"):
    body = {"model": model, "input": [{"type": "user_input", "content": [{"type": "text", "text": text, "annotations": [{"type": "speech_metadata", "style": style}]}]}], "response_format": {"type": "audio"}, "generation_config": {"speech_config": [{"voice": voice}]}}
    for attempt in range(3):
        r = call(body); a, _ = audio_of(r)
        if a: open(path, "wb").write(a[0]); return a[1]
        time.sleep(2 + attempt * 3)
    return "FAILED " + json.dumps(r)[:400]
def music(prompt, path, model="lyria-3-clip-preview"):
    body = {"model": model, "input": prompt}
    for attempt in range(2):
        r = call(body, 600); a, t = audio_of(r)
        if a: open(path, "wb").write(a[0]); return a[1] + " | " + t[:200]
        time.sleep(4)
    return "FAILED " + json.dumps(r)[:500]
