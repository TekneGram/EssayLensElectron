# What I Learned About Mockups and CSS Style Specifications

This planning round changed how I think about styling and UI exploration. I used to treat CSS decisions as something that happens during implementation. Now I see the value of defining style tokens early, before building real components.

The key documents were `09_styles_spec.md` and `07_layout_spec.md`. The layout spec gave a strong structure for regions, grid behavior, and responsive modes. The styles spec gave semantic tokens for color, spacing, typography, motion, and interaction states. Together, they formed a design system that can guide implementation instead of reacting to it.

I honestly did not know I could define CSS tokens in advance in this level of detail. I also did not know I could use those tokens and layout specs to have Codex generate mockups, then refine the visual result through iteration, and update the specification as I learned what worked. That loop was a big discovery for me.

The mockups in this project made that loop real. I could inspect `mockups/AssessmentTab.png` and `mockups/RubricTab.png`, compare them against the specs, and see where spacing, hierarchy, and visual contrast felt right or needed adjustment. Because tokens were semantic, changes could be made at the system level. That means less random CSS and fewer one off overrides later.

Another useful lesson was that layout and style specs should reinforce each other. The layout spec defines region structure and resizing behavior. The style spec defines the visual language that sits on top. If these are separated clearly, iteration becomes cleaner. You can change structure without rewriting all visuals. You can tune visuals without breaking structural intent.

I also liked that the style spec included accessibility and theming behavior from the start. It did not treat these as afterthoughts. Light and dark mode parity, focus visibility, and reduced motion support are baked into planning.

I now see mockups as a communication layer, not just a visual draft. They help me explain intent to coders, to teacher users, and to anyone reviewing the direction. When people can see the layout and the token driven styling in one place, feedback gets more concrete and more useful.

This also helps avoid style drift during implementation. If a component starts to look off, I can trace back to the token or layout rule instead of adding quick fixes. Over time that should keep the interface cleaner and easier to maintain.

It also made review sessions less subjective. We can point to concrete values and clear layout behavior instead of debating taste alone. That keeps design conversation practical and productive.

This is still planning work. Nothing has actually been built yet. But this planning gave me a repeatable method. Define tokens first. Define macro layout clearly. Generate mockups. Review them. Update the spec. Repeat.

For coders, this makes UI work less chaotic. For vibe coding enthusiasts, it gives fast iteration with better consistency. For teachers who will use the app, it increases confidence that readability and practical grading flow are being designed with care.

![Assessment tab mockup](../mockups/AssessmentTab.png)

![Rubric tab mockup](../mockups/RubricTab.png)
