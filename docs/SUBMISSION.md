# Submission and release evidence

## Verified event facts

Checked on November 26, 2026. The [Code for Change event page](https://code-for-change-global.devpost.com/) lists a deadline of December 1, 2026 at 5:00 PM Pacific. This is December 1 at 7:00 PM Central Standard Time.

The [published rules](https://code-for-change-global.devpost.com/rules) require student participants to be above the legal age of majority in their country of residence. They exclude companies. The rules do not state an under-age parental-consent exception. The owner must verify individual eligibility before submission.

The rules require original work created during the hackathon period and a complete Devpost project page. The event asks for a demo or demo video and relevant code or instructions. The master spec's live Vercel demo, packaged extension, public source, and approximately 2.5-minute video are project delivery goals; the event page does not list that exact bundle as mandatory.

The event page lists Impact, Originality, Technical Execution, and Presentation. The rules also mention usability and clarity. No equal 25% weights were found. Do not present those weights as official.

The rules page says winners will be announced on November 21, 2026. That date precedes the displayed December 1 deadline. Treat the winner date as unresolved. The owner can ask the organizer to reconcile it; no message has been sent on the owner's behalf.

## Release gates

| Gate | Required evidence | Current state |
| --- | --- | --- |
| Analyzer | Root `npm test` output and exit code | 33 tests pass; coverage thresholds pass |
| Types | Root `npm run typecheck` output and exit code | All workspaces pass |
| Production build | Root `npm run build` output and exit code | All workspaces pass |
| Sandbox | Scenario arithmetic, Safe Mode, revert, keyboard control, responsive views | 13 Chromium tests pass locally and on the live Vercel site |
| Extension | Load unpacked; scan; locate; repair; revert; tab navigation; restricted-page error | Six message tests and real Chromium runtime flow pass |
| Privacy | Inspect source, bundles, and network behavior | Source review and browser no-submission/no-external-request assertions pass |
| Video | Real product proof; runtime; readable captions; decode and audio checks | Local 157.3-second film delivered; decode, codec, captions, and objective audio pass; two independent critique rounds complete; explicit exceptions and manual limits in VIDEO_VERIFICATION.md |
| ZIPs | Archive inventory; expected entry points; no secrets or dependencies folder | Extension and source ZIPs pass CRC and inventory checks; source is regenerated after final documentation updates |
| Public source | Approved repository contents and destination | Published at https://github.com/KnigguKniggu-droid/clearview |
| Public demo | Approved Vercel project and deployed smoke test | https://clearview-brown.vercel.app; final runtime deployed;17 static files match;13 browser tests pass |
| Submission | Owner eligibility, team details, reviewed writeup, valid links | Not submitted |

## Approval boundary

The owner explicitly approved the public repository KnigguKniggu-droid/clearview and Vercel sandbox publication. The owner also approved the GitHub CLI workflow scope needed to publish CI. These approvals persist. Video upload and Devpost submission still require approval of their concrete destination and contents.

## Evidence record

Record the source revision, exact command, real exit code, relevant log, and date for each gate. Record browser results separately from JSDOM tests. Mark unmeasured performance values `UNKNOWN`. Keep failed checks visible until a later check supersedes them.

## Before publication

1. Review repository files and remove unintended personal data, credentials, logs, and temporary capture assets from the public package.
2. Confirm the project license and third-party attribution with the owner.
3. Confirm that all portal names and screenshots are clearly presented as simulated content.
4. Run the release gates and inspect the packaged extension.
5. Show the owner the runnable build, release files, video, and proposed publication destinations.
6. Obtain publication approval.
7. Publish the approved assets and verify each public URL.
8. Update `DEVPOST_DRAFT.md` with the verified URLs and owner-supplied team details.
9. Obtain approval for the final Devpost submission.

Recheck the live rules before submission. Do not infer eligibility from the presence of a submission form.
