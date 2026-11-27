# Demo video verification

Verified on November 27, 2026. The film captures runtime `86676fa7176cdeec8f03d8505e1c1f2f929f4b6a`. Later documentation commits do not change the captured app or extension.

## Delivered files

| File | Measured result |
| --- | --- |
| `ClearView-Demo.mp4` | 157.3 seconds; 1920 × 1080; 30 fps; H.264 video and AAC audio; 72,569,053 bytes |
| `ClearView-Demo-Review.mp4` | 157.3 seconds; 9,661,267 bytes; below the 10 MB review limit |
| `ClearView-Demo.srt` | 68 cues; longest line 40 characters; maximum 19.7 characters/second; cue durations 0.84–3.74 seconds |
| `ClearView-Poster.png` | Extracted from the final master; complete fixed-charge caption and both receipt totals |
| `ClearView-UI-Redesign.mp4` | Separate 10-second, 1920 × 1080, 30 fps Remocn before/after comparison; intentionally silent |

The videos and detailed `ClearView-Video-QA.md` report ship alongside the release archives. They have not been uploaded to a video-hosting service. No Devpost submission has been made.

The independent [media inventory](evidence/video-delivery.json) confirms the final file sizes, hashes, runtime, stream formats, and required output files.

## Evidence and review

All eight scenes rendered. The medical, telecom, utility, introduction, limits, and actual extension captures passed their state assertions. The medical insert shows native keyboard activation and the real simulated result. The extension capture records 47 findings, six supported repairs, 41 remaining findings, and exact restoration to 47 findings. W3C's page is identified as an intentional educational demonstration.

The master and review files pass full decode. Automated codec, transcript comparison, caption, audio, and scene-lint checks pass. The frame check found zero black intervals. Main audio measures −14.0 LUFS and −1.5 dBTP. Review audio measures −14.1 LUFS and −1.1 dBTP.

Two independent reviewers completed two critique rounds. The final round includes 34 encoded proof frames and 63 master samples spanning 0–155 seconds. One reviewer also checked all 68 caption cue strips. Neither reviewer found a concrete visual or evidence blocker in this scope. Earlier clipped totals, missing restored-selection framing, and an obscured result message were corrected before the final render.

## Exceptions and unmeasured checks

The raw automated gate reports **FAIL** because its motion checks flag stationary source footage and reading holds. The original report remains retained with the production evidence. The reviewed gate reports **PASS with warnings** after 24 exact, hash-bound source-layer allowances. It does not establish a blanket freeze-check pass.

Intentional composed holds include medical source reading, the visible no-payment result, the pre-Revert pause, and the final URL. The final master also contains a one-second pre-repair source-reading hold at 10.77–11.77 seconds. These are reviewed exceptions, not deleted findings.

The planned composition contains 140.6 seconds of actual product footage (89.4%). It uses a separate dark caption lane for legibility. Its full-bleed S share is 0%, below the template's 30% target. This documented framing exception remains explicit.

Human audio listening and uninterrupted full-film playback remain **UNKNOWN**. Objective audio measurements, transcript checks, decode checks, and sampled visual review do not substitute for those checks. No subjective quality score is claimed.

## SHA-256

- Main: `bfb0c835c6383c20d2d4f802e7d18efe640810701442e06e1df69a046840902c`
- Review: `6fa357a639fe40585b87cf601a534309f472ff58c0d26d60f6f4971d0f910195`
- Before/after comparison: `474994d38f9cf19756cda3085b7652dafb21dd946559a7db9e3d7917ad46a1fc`
