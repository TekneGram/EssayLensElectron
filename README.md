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
