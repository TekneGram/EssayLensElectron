# EssayLens Electron

EssayLens is an Electron desktop app for teachers to assess second-language essays.
It combines:

- Electron main process for IPC and data orchestration
- React + Vite renderer UI
- SQLite (managed by Electron)
- Python worker for LLM tasks

## Tech Stack

- Electron
- TypeScript
- React + Vite
- TanStack Query
- SQLite3
- Python (LLM worker)

## Current Packaging Model (Python)

The packaged app uses a PyInstaller-built worker binary (not raw `python3` in production).

- Worker source: `electron-llm/main.py`
- Built artifact: `dist/essaylens-llm-worker/`
- Vendored package input: `vendor/python-worker/<platform>-<arch>/`
- Packaged location at runtime: `Resources/python-worker/<platform>-<arch>/`

For Apple Silicon macOS in this repo, use:

- `vendor/python-worker/darwin-arm64/`

## One-Time Setup (PyInstaller build env)

```bash
python3 -m venv .venv-pyinstaller
source .venv-pyinstaller/bin/activate
python -m pip install --upgrade pip pyinstaller
python -m pip install -r electron-llm/requirements.txt
```

## Workflow: Python Code Changed

If you edited Python files and want those changes in the packaged app, run:

1. Activate build environment

```bash
source .venv-pyinstaller/bin/activate
```

2. Rebuild worker with PyInstaller

```bash
pyinstaller --noconfirm --clean --onedir --name essaylens-llm-worker electron-llm/main.py
```

3. Copy worker bundle into vendored packaging path

```bash
mkdir -p vendor/python-worker/darwin-arm64
rsync -a --delete dist/essaylens-llm-worker/ vendor/python-worker/darwin-arm64/
```

4. Package Electron app

```bash
npm run package
```

5. Launch packaged app and test

## Workflow: Electron/Renderer Only Changes

If only Electron/renderer TypeScript/CSS/UI changed (and Python did not), you can skip the PyInstaller rebuild and run:

```bash
npm run package
```

## Build `llama-server` (llama.cpp) For Dev + Packaging

This project keeps llama.cpp source in:

- `electron-llm/third_party/llama.cpp`

Build output is copied to:

- `vendor/llama-server/darwin-arm64/llama-server`

The `vendor` path is the shared runtime source for:

- Dev mode (directly from repo)
- Packaged mode (copied into app `Resources` by `electron-builder`)

Step-by-step on Apple Silicon macOS:

1. Go to repo root

```bash
cd /Users/danielmikaleola/Documents/Development/EssayLensElectron
```

2. Confirm llama.cpp source exists

```bash
ls -la electron-llm/third_party/llama.cpp
```

3. Create build directory

```bash
mkdir -p electron-llm/third_party/llama.cpp/build-darwin-arm64
```

4. Configure CMake

```bash
cmake -S electron-llm/third_party/llama.cpp -B electron-llm/third_party/llama.cpp/build-darwin-arm64 -DCMAKE_BUILD_TYPE=Release
```

5. Build `llama-server`

```bash
cmake --build electron-llm/third_party/llama.cpp/build-darwin-arm64 --config Release --target llama-server
```

6. Create runtime destination

```bash
mkdir -p vendor/llama-server/darwin-arm64
```

7. Copy built binary

```bash
cp electron-llm/third_party/llama.cpp/build-darwin-arm64/bin/llama-server vendor/llama-server/darwin-arm64/llama-server
```

8. Ensure executable permission

```bash
chmod +x vendor/llama-server/darwin-arm64/llama-server
```

9. Verify binary runs

```bash
vendor/llama-server/darwin-arm64/llama-server --help | head -n 20
```

10. Ensure packaging includes this folder in `package.json` `build.extraResources`:

```json
{
  "from": "vendor/llama-server",
  "to": "llama-server",
  "filter": ["**/*"]
}
```

Quick check:

```bash
grep -nE '"from": "vendor/llama-server"|"to": "llama-server"' package.json
```

## Fake LLM Test

The chat flow can use fake reply mode via persisted `llm_settings` defaults.
This allows end-to-end testing without a GGUF model.

Expected behavior in fake mode:

- Sending a chat message returns the configured fake response text.

## Useful Commands

Run dev app:

```bash
npm run dev
```

Run targeted tests:

```bash
npm run test -- electron/main/services/__tests__/pythonWorkerClient.test.ts electron/main/ipc/__tests__/chatHandlers.test.ts
```

Build Electron main/preload:

```bash
npm run build:electron
```
