# note-typescript-template-backend

A minimal Node.js + TypeScript backend starter with strict code quality standards.

## Overview

project.name: note-typescript-template-backend
project.type: Node.js Backend Template
project.version: 0.0.0
project.module_system: ESM
project.package_manager: pnpm@10.11.0

## Tech Stack

stack[5]{tool,version,purpose}:
  TypeScript,~5.9.3,Type-safe JavaScript
  tsx,^4.21.0,Dev server with hot-reload
  Biome,^2.3.12,Linting + formatting
  Turbo,^2.7.6,Task orchestration
  Node Types,^25.0.10,TypeScript definitions

## Scripts

scripts[7]{command,description}:
  pnpm dev,Run development server with watch mode
  pnpm build,Compile TypeScript to dist/
  pnpm start,Run compiled JavaScript from dist/
  pnpm typecheck,Type-check without emitting files
  pnpm lint,Check code with Biome linter
  pnpm lint:fix,Auto-fix linting issues
  pnpm verify,Run build + typecheck + lint via Turbo

## TypeScript Configuration

### Compiler Options

compiler.target: ES2022
compiler.module: NodeNext
compiler.moduleResolution: NodeNext
compiler.outDir: ./dist
compiler.skipLibCheck: true

### Strictness Flags (All Enabled)

strictness[10]{flag,enabled}:
  strict,✓
  noUnusedLocals,✓
  noUnusedParameters,✓
  erasableSyntaxOnly,✓
  noFallthroughCasesInSwitch,✓
  noUncheckedSideEffectImports,✓
  verbatimModuleSyntax,✓
  forceConsistentCasingInFileNames,✓
  noUncheckedIndexedAccess,✓

## Biome Rules Summary

### Code Style

style.quotes: double
style.semicolons: always
style.indentWidth: 2
style.lineWidth: 120
style.trailingCommas: es5

### Enforced Patterns

enforced[12]{rule,description}:
  noDefaultExport,Named exports only
  noEnum,Use const objects or unions instead
  noAny,Explicit types required
  noVar,Use const/let only
  noConsole,Only console.warn and console.error allowed
  noForEach,Use for...of instead
  noCommonJs,ESM only (no require/module.exports)
  noBarrelFile,No re-exporting everything
  noNamespaceImport,Import specific members
  useExplicitType,Explicit function return types
  useStrictMode,Enforce strict mode
  noNonNullAssertion,No ! assertions

### Naming Conventions

naming[3]{selector,format}:
  variables,camelCase | CONSTANT_CASE | PascalCase
  functions,camelCase
  types,PascalCase

## Project Structure

```
note-typescript-template-backend/
├── src/
│   └── index.ts          # Entry point
├── dist/                 # Build output (gitignored)
├── biome.json            # Linting + formatting config
├── tsconfig.json         # TypeScript config
├── turbo.json            # Task runner config
├── package.json          # Dependencies + scripts
├── pnpm-lock.yaml        # Lock file
└── .gitignore            # Git ignore rules
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Development mode (watch)
pnpm dev

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build

# Run production build
pnpm start

# Verify everything (build + typecheck + lint)
pnpm verify
```

## Features

features[7]{feature,status}:
  TypeScript 5.9 with maximum strictness,✓
  ESM-first module system,✓
  Biome for fast linting + formatting,✓
  Turbo for task orchestration,✓
  Hot-reload dev server via tsx,✓
  Zero runtime dependencies,✓
  Clean minimal starting point,✓

## What's Not Included

This template intentionally omits:

not_included[7]: web framework (Express/Fastify/etc),test framework (Vitest/Jest),database layer,Docker configuration,CI/CD pipelines,git repository,authentication/authorization

**Why?** Maximum flexibility. Add only what you need.

## Design Philosophy

philosophy[5]{principle,description}:
  Minimal,Single entry file - build up from here
  Strict,Maximum TypeScript + Biome strictness enabled
  Modern,ESM-only with latest Node.js patterns
  Fast,Biome (Rust) + Turbo for speed
  Opinionated,Strong conventions out of the box

## Token Savings

This README uses **TOON (Token-Oriented Object Notation)** for structured data, saving ~40% tokens compared to traditional markdown tables or JSON blocks.

## License

MIT (or your preferred license)
