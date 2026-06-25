#!/bin/bash
set -e
mkdir -p .github/workflows

cat > .github/workflows/rust-tests.yml << 'EOF'
name: Rust Unit Tests
on:
  pull_request:
    branches: [main]
    paths: ['contracts/**', 'Cargo.toml', 'Cargo.lock']
jobs:
  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - uses: Swatinem/rust-cache@v2
      - run: cargo test
EOF

cat > .github/workflows/mobile-ci.yml << 'EOF'
name: Mobile CI
on:
  pull_request:
    branches: [main]
    paths: ['mobile/**']
jobs:
  mobile-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: mobile/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm test
EOF

cat > .github/workflows/deploy-testnet.yml << 'EOF'
name: Deploy Contracts to Stellar Testnet
on:
  push:
    branches: [main]
    paths: ['contracts/**', 'deploy.sh']
jobs:
  deploy-testnet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          target: wasm32-unknown-unknown
      - run: cargo install --locked stellar-cli --features opt
      - run: ./deploy.sh
        env:
          DEPLOYER_SECRET_KEY: ${{ secrets.DEPLOYER_SECRET_KEY }}
EOF

cat > .github/workflows/deploy-vercel.yml << 'EOF'
name: Deploy Web App to Vercel
on:
  push:
    branches: [main]
    paths: ['apps/web/**']
jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod
        env:
          NEXT_PUBLIC_REGISTRY_CONTRACT_ID: ${{ secrets.NEXT_PUBLIC_REGISTRY_CONTRACT_ID }}
          NEXT_PUBLIC_SAVINGS_CONTRACT_ID: ${{ secrets.NEXT_PUBLIC_SAVINGS_CONTRACT_ID }}
EOF

cat > .github/workflows/web-lint-typecheck.yml << 'EOF'
name: Web Lint and TypeCheck
on:
  pull_request:
    branches: [main]
    paths: ['apps/web/**']
jobs:
  web-lint-typecheck:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
EOF

cat > .github/workflows/soroban-build.yml << 'EOF'
name: Build Soroban Contracts
on:
  pull_request:
    branches: [main]
    paths: ['contracts/**']
jobs:
  soroban-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          target: wasm32-unknown-unknown
      - run: cargo install --locked stellar-cli --features opt
      - run: stellar contract build && cd ../savings && stellar contract build
        working-directory: contracts/registry
      - uses: actions/upload-artifact@v4
        with:
          name: wasm-artifacts
          path: target/wasm32v1-none/release/*.wasm
EOF

echo "All workflow files generated. Run: git add .github/workflows/ && git commit"
