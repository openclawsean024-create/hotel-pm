# hotel-pm status

## 2026-07-19 — STALE checkpoint

❌ STALE: `pnpm test -- src/lib/domain.test.ts` did not run because pnpm blocked dependency build scripts (`esbuild`, `sharp`, `unrs-resolver`) after install. This is an environment/install-policy blocker, not a passing test result.

Raw failure:
```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.28.1, sharp@0.34.5, unrs-resolver@1.12.2
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: pnpm install
```

Current implementation state:
- `package.json`, Next.js 15 / React 19 / TypeScript strict / Tailwind 4 scaffolding created.
- `src/lib/domain.test.ts` written first with 30+ acceptance tests.
- Production implementation has not been written yet; do not claim feature completion.

Main-agent recovery:
1. In `/tmp/hotel-pm-dev`, run `pnpm approve-builds` and approve required packages, or configure the repository's pnpm policy explicitly.
2. Re-run `pnpm install` and then `pnpm test`.
3. Continue RED → GREEN by implementing `src/lib/domain.ts` only after the test runner executes and shows expected missing-module failures.
4. Do not deploy or commit as verified until tests, build, and live checks have real output.
