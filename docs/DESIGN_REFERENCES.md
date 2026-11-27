# Additional design references

Reviewed on November 27, 2026. These sources inform ClearView's own design. The project does not bundle their paid templates or unrelated site imagery.

## Public site review

| Source actually reviewed | Relevant pattern | ClearView application |
| --- | --- | --- |
| [AffectUI Change Summary](https://www.affectui.com/components/change-summary) | Quiet definition-list rows, short labels, exact change values, small direction indicators, immediate reduced-motion rendering | Rework the existing Safe Mode monthly-change summary using report-derived amounts. Keep source citations and the provider-total reminder. |
| [PrettySites HabitFlow, Light](https://prettysites.io/?prompt=habitflow) | White task surface against pale-blue context, one accented summary, left-aligned section titles and quiet separators | Refine receipt grouping, workspace spacing, and readable type roles. No template source or assets copied. |
| [MotionSites Jellyfish Scroll](https://motionsites.ai/?prompt=driftlab-hero) | One central object, independently moving foreground and background, anchored typography, progress cues | Apply restrained progression to the existing paper/frame introduction. Preserve the immediate audit link and native scrolling. |
| [21st scroll animation guide](https://dev.21st.dev/blog/react-scroll-animation-components) and its public component catalog | Reveal, parallax, pin/progress; transform motion, short pin duration, reduced-motion fallback, native keyboard scrolling | Audit the existing intro's observer, measurement, progress, and reduced-motion behavior. |

The user supplied prettysites.ai. That address returned a DNS failure. Search found the working PrettySites catalog at prettysites.io, which was then inspected directly. The PrettySites free Copy Prompt action did not expose usable clipboard content in this session; only the visible preview informed the design. MotionSites' free copy action showed a success notice, but its clipboard content was not reliably retrieved. Neither complete prompt is claimed as copied or applied.

The 21st catalog link for Scroll media expansion hero returned a component-not-found page. The public guide and catalog remained usable. No 21st membership or API key was purchased. Paid AffectUI screens and paid template source were not retrieved.

## Installed GitHub skills

The user requested installation and use. The system skill installer installed these pinned sources in the local Codex profile. They are not application dependencies.

| Repository | Revision | Installed skills | Applied responsibility |
| --- | --- | --- | --- |
| [Devesh-Shirsath/spotkit](https://github.com/Devesh-Shirsath/spotkit) | `f9b6a611e14c68a88fae44b4c67777a25b9c1d2c` | spotkit | Extension initial page-to-receipt illustration |
| [Moddingflow/better-design](https://github.com/Moddingflow/better-design) | `c373ad7fa122b8c0d63b1be756443cc93a56e71d` | better-design | Semantic style consolidation, hierarchy, intrinsic layout, responsive review |
| [samber/cc-skills](https://github.com/samber/cc-skills) | `50a33836b20f690c668af557bd9ef9d07a8c7ef2` | frontend-design-deslop | Remove conflicting visual rules and generic chrome |
| [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better) | `6d9f2f1df10e8ce2ae1708598a73b0506fb98794` | make-interfaces-feel-better | Rendered interaction, typography, target size, and text-growth checks |
| [frankxai/awesome-motion-design-agent-skills](https://github.com/frankxai/awesome-motion-design-agent-skills) | `e7dc6e2e728c918ffcea5edb2d7c94e2a6f7785d` | motion-director, web-motion-auditor, site-motion-excellence-director, remotion-video-agent, generative-media-director | Relevant motion direction and audit guidance; installation does not mean every workflow ran |
| [kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill) | `e9eaddc07895575253d6663320354a708f53e955` | logo-design | Original ClearView mark, small-size and reverse tests, favicon and extension icons |
| [Remocn/remocn](https://github.com/Remocn/remocn) | `52ec1ffe46df26c5b3895eb74dcc65ba7c3d1fdb` | remocn | Isolated actual video component integration; video verification remains separate |

## Spotkit implementation

Feature: inspection turns a page's disclosures into an itemized receipt. The metaphor is a source card becoming a receipt card. The primitives are two cards, an arrow, a magnifier, and neutral placeholder bars. The illustration adapts L12 Split from `examples/approval.svg`; panel, backdrop, medallion, and card geometry are retained.

The inline React component uses `useId` for unique mask and gradient references. Host CSS applies the ClearView palette. Bars remain neutral. No invented currency or success state appears in the artwork. The SVG source is retained beside the component for reproducible checks. Spotkit's checker passes. Smallest-size visual verification is recorded separately with the extension review.

Spotkit and the Phosphor regular icon geometry use MIT licenses. Full notices ship in `THIRD_PARTY_NOTICES.txt` and the extension build.
