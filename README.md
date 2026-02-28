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

## Build + Stage `llama-server` (llama.cpp) For Dev + Packaging

Build happens in llama.cpp. `vendor/llama-server/darwin-arm64` is a staged runtime bundle.

- Source/build root: `electron-llm/third_party/llama.cpp`
- Staged runtime bundle: `vendor/llama-server/darwin-arm64/`
- The staged bundle is used by:
- Dev mode (directly from repo)
- Packaged mode (copied to app `Resources` by `electron-builder`)

On Apple Silicon macOS:

1. Go to repo root

```bash
cd /Users/danielparsons/Documents/Development/EssayLensElectron
```

2. Build `llama-server` in llama.cpp

```bash
mkdir -p electron-llm/third_party/llama.cpp/build-darwin-arm64
cmake -S electron-llm/third_party/llama.cpp -B electron-llm/third_party/llama.cpp/build-darwin-arm64 -DCMAKE_BUILD_TYPE=Release
cmake --build electron-llm/third_party/llama.cpp/build-darwin-arm64 --config Release --target llama-server
```

3. Stage runtime payload (binary + dylibs)

```bash
mkdir -p vendor/llama-server/darwin-arm64
cp electron-llm/third_party/llama.cpp/build-darwin-arm64/bin/llama-server vendor/llama-server/darwin-arm64/
cp electron-llm/third_party/llama.cpp/build-darwin-arm64/bin/*.dylib vendor/llama-server/darwin-arm64/
chmod +x vendor/llama-server/darwin-arm64/llama-server
```

4. Patch runtime linkage so bundled files are resolved relative to executable location

```bash
install_name_tool -delete_rpath "$(pwd)/electron-llm/third_party/llama.cpp/build-darwin-arm64/bin" vendor/llama-server/darwin-arm64/llama-server 2>/dev/null || true
install_name_tool -add_rpath "@executable_path" vendor/llama-server/darwin-arm64/llama-server

for lib in vendor/llama-server/darwin-arm64/*.dylib; do
  base="$(basename "$lib")"
  install_name_tool -id "@rpath/$base" "$lib"
done
```

5. Verify dylib references before packaging

```bash
otool -L vendor/llama-server/darwin-arm64/llama-server
otool -l vendor/llama-server/darwin-arm64/llama-server | grep -A2 LC_RPATH
```

Expected:
- `@rpath/lib*.dylib` entries resolve to files present in `vendor/llama-server/darwin-arm64`
- `LC_RPATH` includes `@executable_path`
- No stale absolute build-machine path remains in rpath

6. Quick run check

```bash
vendor/llama-server/darwin-arm64/llama-server --help | head -n 20
```

7. Package app

```bash
npm run package
```

8. Confirm packaged copy includes staged dylibs

```bash
ls -la dist/mac-arm64/essaylens-electron.app/Contents/Resources/llama-server/darwin-arm64
otool -L dist/mac-arm64/essaylens-electron.app/Contents/Resources/llama-server/darwin-arm64/llama-server
```

`package.json` already includes:

```json
{
  "from": "vendor/llama-server",
  "to": "llama-server",
  "filter": ["**/*"]
}
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
