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
| Analyzer | Root `npm test` output and exit code | Pending final verification |
| Types | Root `npm run typecheck` output and exit code | Pending final verification |
| Production build | Root `npm run build` output and exit code | Pending final verification |
| Sandbox | Scenario arithmetic, Safe Mode, revert, keyboard control, responsive views | Pending final verification |
| Extension | Load unpacked; scan; locate; repair; revert; tab navigation; restricted-page error | Pending final verification |
| Privacy | Inspect source, bundles, and network behavior | Pending final verification |
| Video | Real product proof; runtime; readable captions; decode and audio checks | Pending production and verification |
| ZIPs | Archive inventory; expected entry points; no secrets or dependencies folder | Pending release packaging |
| Public source | Approved repository contents and destination | Not published |
| Public demo | Approved Vercel project and deployed smoke test | Not published |
| Submission | Owner eligibility, team details, reviewed writeup, valid links | Not submitted |

## Approval boundary

Local source, tests, builds, documentation, and packaging are authorized by the project request. Public repository creation, deployment, video upload, and Devpost submission require approval of the concrete release and destination. A successful local build is not a published deliverable.

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
