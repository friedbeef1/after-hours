# After Hours

A bright toy-room reskin of [Harvest Standoff](https://github.com/andreteow/farm-ca) by andreteow. Two toy crews, five a side, fight over a stolen biscuit in a giant living room. It runs in the browser, with desktop controls and phone touch controls.

Play: https://after-hours-play-seven.vercel.app/

## What is new here

A new living-room map built in code, toy characters and launchers re-themed, ten new icons, touch controls and a phone-friendly layout. Opponent AI, stats and match rules are Harvest Standoff's. The Applewood Mill map keeps its original scenery.

Phone note: touch controls were tested in a phone-sized browser. Smoothness on real phones has not been measured.

## Run it

```bash
npm ci
node build.mjs
python3 start.py
```

Then open http://127.0.0.1:8765.

## Credits and licences

See [CREDITS.md](CREDITS.md) for what is inherited from Harvest Standoff and what is new, [LICENSE](LICENSE) (ISC) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Harvest Standoff's package.json declares ISC. Its audio and painted images, which are bundled here unchanged, are described by its README as AI-generated.
