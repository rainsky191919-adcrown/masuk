# Admin UI regression checks

Run `npm ci`, then `npm run test:admin` from the repository root. The suite builds the actual App and components into ignored bundle directories and verifies 40 groups of behavior in jsdom. `npm run test:build-config` separately checks release environment boundaries.

The backend fixture returns invented identities and data, rejects unsupported write commands, and never connects to Supabase. Tests that exercise submissions use local callbacks only. MapPicker is omitted from component tests; the isolated `acceptance-test` browser mode uses the actual map component. These checks do not replace real QA or Android acceptance.

Fixture-only Vite configuration is never used by the release build. Do not deploy its preview or generated test bundles.
