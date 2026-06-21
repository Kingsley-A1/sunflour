# @sunflour/design-tokens

Versioned, framework-neutral CSS contract for Sunflour products.

- `tokens.css`: primitive palette, spacing, layout, typography, and motion values.
- `themes.css`: semantic light/dark themes, elevation, contrast preferences, and compatibility aliases.
- `motion.css`: reusable motion behavior and reduced-motion safeguards.

Import in this order: `tokens.css`, `themes.css`, then `motion.css`. Components must consume semantic tokens; primitive tokens are theme implementation details.
