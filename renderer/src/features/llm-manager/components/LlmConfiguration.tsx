import { useMemo, useState } from 'react';
import type { LlmRuntimeSettings } from '../../../../../electron/shared/llmManagerContracts';

type SettingKey = keyof LlmRuntimeSettings;

type EditableValue = string | number | boolean | null;

interface LlmConfigurationProps {
  settings: LlmRuntimeSettings | null;
  canResetDefaults: boolean;
  isSaving: boolean;
  isResetting: boolean;
  onSave: (settings: Partial<LlmRuntimeSettings>) => Promise<unknown>;
  onResetDefaults: () => Promise<unknown>;
  errorMessage?: string;
}

const BOOLEAN_KEYS: ReadonlySet<SettingKey> = new Set(['llm_use_jinja', 'llm_cache_prompt', 'llm_flash_attn', 'use_fake_reply']);

const NUMBER_KEYS: ReadonlySet<SettingKey> = new Set(['llm_port', 'llm_n_ctx', 'max_tokens', 'temperature']);

const NULLABLE_NUMBER_KEYS: ReadonlySet<SettingKey> = new Set([
  'llm_n_threads',
  'llm_n_gpu_layers',
  'llm_n_batch',
  'llm_n_parallel',
  'llm_seed',
  'llm_rope_freq_base',
  'llm_rope_freq_scale',
  'top_p',
  'top_k',
  'repeat_penalty',
  'request_seed'
]);

const NULLABLE_STRING_KEYS: ReadonlySet<SettingKey> = new Set(['llm_gguf_path', 'llm_mmproj_path', 'fake_reply_text']);

const EDITABLE_KEYS: ReadonlySet<SettingKey> = new Set([
  'fake_reply_text',
  'llm_n_batch',
  'llm_n_ctx',
  'llm_n_gpu_layers',
  'llm_n_threads',
  'max_tokens',
  'repeat_penalty',
  'temperature',
  'top_k',
  'top_p',
  'use_fake_reply'
]);

function formatValue(value: EditableValue): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

function parseStringValue(key: SettingKey, rawValue: string): EditableValue {
  if (NUMBER_KEYS.has(key)) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Value for ${key} must be a number.`);
    }
    return parsed;
  }

  if (NULLABLE_NUMBER_KEYS.has(key)) {
    if (!rawValue.trim()) {
      return null;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Value for ${key} must be a number or empty.`);
    }
    return parsed;
  }

  if (NULLABLE_STRING_KEYS.has(key)) {
    return rawValue.trim() ? rawValue : null;
  }

  return rawValue;
}

export function LlmConfiguration({
  settings,
  canResetDefaults,
  isSaving,
  isResetting,
  onSave,
  onResetDefaults,
  errorMessage
}: LlmConfigurationProps) {
  const [editingKey, setEditingKey] = useState<SettingKey | null>(null);
  const [draftValue, setDraftValue] = useState<string>('');
  const [draftBooleanValue, setDraftBooleanValue] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const settingKeys = useMemo(() => {
    if (!settings) {
      return [] as SettingKey[];
    }
    return Object.keys(settings).sort() as SettingKey[];
  }, [settings]);

  const beginEdit = (key: SettingKey) => {
    if (!settings) {
      return;
    }
    if (!EDITABLE_KEYS.has(key)) {
      return;
    }

    const currentValue = settings[key];
    setEditingKey(key);
    setLocalError(null);

    if (BOOLEAN_KEYS.has(key)) {
      setDraftBooleanValue(Boolean(currentValue));
      setDraftValue('');
      return;
    }

    setDraftValue(currentValue === null ? '' : String(currentValue));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraftValue('');
    setLocalError(null);
  };

  const saveEdit = async () => {
    if (!settings || !editingKey) {
      return;
    }

    try {
      let nextValue: EditableValue;
      if (BOOLEAN_KEYS.has(editingKey)) {
        nextValue = draftBooleanValue;
      } else {
        nextValue = parseStringValue(editingKey, draftValue);
      }

      const nextSettings = { [editingKey]: nextValue } as Partial<LlmRuntimeSettings>;
      await onSave(nextSettings);
      cancelEdit();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not save setting.');
    }
  };

  return (
    <section className="subpane llm-panel" aria-label="LLM runtime configuration" data-testid="llm-configuration">
      <div className="llm-config-header">
        <h4>LlmConfiguration</h4>
        <button
          type="button"
          className="llm-action-button"
          onClick={() => void onResetDefaults()}
          disabled={!canResetDefaults || isResetting}
        >
          Reset defaults
        </button>
      </div>
      <div className="content-block llm-section-content">
        {!settings ? (
          <p className="llm-placeholder">LLM settings unavailable.</p>
        ) : (
          <table className="llm-config-table">
            <tbody>
              {settingKeys.map((key) => {
                const value = settings[key] as EditableValue;
                const isEditing = editingKey === key;
                const isBoolean = BOOLEAN_KEYS.has(key);
                const isEditable = EDITABLE_KEYS.has(key);

                return (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>
                      {isEditing && isEditable ? (
                        <div className="llm-config-editor">
                          {isBoolean ? (
                            <label className="llm-checkbox-field">
                              <input
                                type="checkbox"
                                checked={draftBooleanValue}
                                onChange={(event) => setDraftBooleanValue(event.target.checked)}
                              />
                              <span>{draftBooleanValue ? 'true' : 'false'}</span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(event) => setDraftValue(event.target.value)}
                              aria-label={`Value for ${key}`}
                            />
                          )}
                          <div className="llm-config-editor-actions">
                            <button type="button" className="llm-action-button" onClick={() => void saveEdit()} disabled={isSaving}>
                              Save
                            </button>
                            <button type="button" className="llm-action-button" onClick={cancelEdit} disabled={isSaving}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {isEditable ? (
                            <button
                              type="button"
                              className="llm-config-value-button"
                              onClick={() => beginEdit(key)}
                              aria-label={`Edit setting ${key}`}
                            >
                              {formatValue(value)}
                            </button>
                          ) : (
                            <span className="llm-config-value-text">{formatValue(value)}</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {localError ? <p className="llm-inline-error">{localError}</p> : null}
        {errorMessage ? <p className="llm-inline-error">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
