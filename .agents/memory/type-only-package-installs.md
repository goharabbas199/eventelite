---
name: Type-only package installs
description: Check dependency classification after adding Node declaration packages through Replit's package installer.
---

After installing a TypeScript declaration-only npm package through Replit's package installer, verify it is listed under `devDependencies` and that the lockfile marks it and type-only transitive packages as development dependencies. The installer may add packages as production dependencies by default.

**Why:** Shipping declaration-only packages as production dependencies is unnecessary, and the production classification can also change lockfile metadata for transitive `@types` packages.

**How to apply:** Check both `package.json` and the lockfile after installation. If correcting the dependency category would require another install that restarts workflows, make the metadata correction without triggering a second restart and verify with `npm ls`, the type check, and the build.
