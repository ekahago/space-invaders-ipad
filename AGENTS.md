# Space Shooter repository instructions

For every user-visible update, increment the release patch version before publishing:
`python3 scripts/release.py --bump`

This updates version.json, the visible version and date in index.html, and all stylesheet/script cache versions. Run it after the final source edits. For major feature releases a specific version may be supplied with `--version X.Y.Z`.
Check the release before publishing with `python3 scripts/release.py --check`.
Always publish the changed files, index.html and version.json in the same commit so the visible version matches the served code.
Run `node tests/game.test.cjs` when changing gameplay, audio, rendering or inputs. CSS and version-only changes need release validation; browser/iPad checks should be reported accurately.
Keep zoom suppression scoped: disable double-tap zoom across the page with touch-action:manipulation, and pinch gestures only in the game board/control area. Preserve intentional zoom elsewhere.

