import type { EntityId } from '../../../types/primitives';

export interface SelectFolderCommand {
  path: string;
}

export interface SelectFileCommand {
  fileId: EntityId;
}
