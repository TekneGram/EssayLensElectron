# What I Learned About Mockups and CSS Style Specifications

This round taught me something that changed my process. I used to think styling is mostly a late stage task. You build features first. Then you make things look better. That habit caused a lot of inconsistency in past projects. In this planning cycle, I took a different path with `09_styles_spec.md` and `07_layout_spec.md`, and it worked much better.

`07_layout_spec.md` gave me the structural frame. It defined the app shell regions, tab based workspace behavior, and responsive fallback patterns. It made the macro layout explicit. Loader area, file list area, assessment workspace, chat view, and bottom chat interface each had a stable place.

`09_styles_spec.md` then gave the visual language that sits on top of that frame. It defined semantic token categories for color, type, spacing, radius, and motion. It included light and dark theme values. It documented interaction states and accessibility requirements. It also set practical rules, like avoiding one off color values and keeping macro layout flush with seam line separation.

I honestly did not know I could define CSS tokens in advance this way and make them the source of truth before implementation. I also did not know I could use that specification as a prompt foundation for Codex to generate mockups, then review those mockups, and iteratively update the style spec based on what I learned. That loop is now one of my favorite parts of the process.

The mockups made this concrete. I could open `mockups/assessment-tab-open.html`, `mockups/rubric-tab-open.html`, and `mockups/mockup.css` and see the translation from spec to a visual draft. I could also inspect the exported images in `mockups/AssessmentTab.png` and `mockups/RubricTab.png` for quick review. This helped me compare intention against output without touching final app code.

That separation is important. The mockup layer is exploratory. The app layer is production. By keeping those separate during planning, I can iterate quickly without destabilizing runtime code.

What stood out most was how semantic tokens reduce noise. Instead of choosing random hex values in each component, the visual decisions become named variables with meaning. `--bg-app`, `--text-primary`, `--border-subtle`, `--accent-primary`, and similar tokens communicate intent. When a tone feels too strong or too muted, I can tune one token and improve consistency across the whole frame.

I also learned that layout and styling need a clean handshake. The layout spec defines grid areas, pane modes, and responsive behavior. The styles spec defines visual hierarchy, spacing rhythm, and interaction feedback. If those concerns are merged too early, everything gets tangled. If they are specified independently but linked by shared component regions, iteration becomes predictable.

Another discovery was the value of explicit interaction and accessibility states in style planning. Hover, active, selected, focused, disabled, error, and loading are not minor details. They shape trust in the interface. For a teacher grading essays, clarity matters more than decoration. If focus rings are clear, tab states are obvious, and text surfaces are readable, the interface supports the actual task.

The planning docs also encouraged theme parity. That was useful for discipline. It is easy to make light mode the only polished surface. Token based theming pushes me to think in equivalents. If a surface is readable in light mode, the dark mode counterpart should preserve that readability and affordance.

Responsive planning was another benefit. The layout spec already states how columns reflow at narrower widths. The style spec reinforces that by prioritizing core workspace and keeping chat input visible. This means responsiveness is not an emergency patch later. It is part of first principles.

I also saw how this method helps coding speed. Some people think detailed style planning slows delivery. My experience in this round is the opposite. It removes micro decisions during implementation. If token names and layout rules are ready, component work becomes straightforward. There is less hesitation and less rework.

Another gain is review quality. When a mockup is tied to explicit tokens and layout rules, feedback can be specific. Instead of saying this feels off, you can say body text contrast needs adjustment, or chat region spacing should follow token scale, or tab active state needs clearer emphasis. Specific feedback leads to faster improvement.

For vibe coding enthusiasts, this process still feels creative. You can generate visual drafts quickly. You can iterate with an agent. You can keep momentum. The difference is that your iterations are anchored to a clear system, so the design gets stronger over time instead of drifting.

For teachers and education focused stakeholders, this approach matters because it protects readability and workflow coherence. Essay assessment is a cognitively heavy task. The UI should feel calm, legible, and predictable. Planning layout and style upfront increases the chance of that outcome.

I should also state status clearly. Nothing has actually been built yet. This is planning and mockup work, not completed product implementation. But the planning is already useful because it gives a repeatable UI development loop.

The loop now looks simple in my head. Define layout structure. Define semantic style tokens. Generate a mockup pass. Review against product goals. Update the spec. Repeat until the direction feels stable. Then implement with fewer surprises.

I also like that this loop keeps design decisions visible in versioned text files. That means I can revisit why a token exists, why a region is sized a certain way, and why a responsive rule was chosen. It turns styling from hidden intuition into shared project knowledge.

That shared knowledge helps future contributors too. A new teammate can read the style and layout specs, view the mockups, and understand the visual intent quickly. They do not need to reverse engineer every choice from scattered component CSS.

For me, this alone makes the specification effort worth it before any production component is shipped.

That is the main learning I am keeping from this round. Mockups are not just pretty previews. CSS style specs are not just documentation. Together, they are a practical architecture tool for frontend quality.

![Assessment tab mockup](../mockups/AssessmentTab.png)

![Rubric tab mockup](../mockups/RubricTab.png)
