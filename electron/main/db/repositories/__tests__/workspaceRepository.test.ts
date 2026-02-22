import { describe, expect, it } from 'vitest';
import { WorkspaceRepository } from '../workspaceRepository';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('WorkspaceRepository', () => {
  it('reuses folder id by absolute path and keeps stale filename rows on re-attach', async () => {
    const repository = new WorkspaceRepository({ now: () => '2026-02-20T00:00:00.000Z' });

    const folder = await repository.setCurrentFolder('/user/selected');
    expect(folder.path).toBe('/user/selected');
    expect(UUID_PATTERN.test(folder.id)).toBe(true);

    await repository.upsertFiles(folder.id, [
      {
        id: 'ignored',
        folderId: folder.id,
        name: 'mydoc.docx',
        path: '/user/selected/subfolder/mydoc.docx',
        kind: 'docx'
      },
      {
        id: 'ignored2',
        folderId: folder.id,
        name: 'draft.pdf',
        path: '/user/selected/draft.pdf',
        kind: 'pdf'
      }
    ]);

    const firstList = await repository.listFiles(folder.id);
    expect(firstList).toHaveLength(2);
    for (const file of firstList) {
      expect(UUID_PATTERN.test(file.id)).toBe(true);
      expect(file.folderId).toBe(folder.id);
    }
    expect(firstList.find((file) => file.name === 'mydoc.docx')?.path).toBe('/user/selected/subfolder/mydoc.docx');

    const folderAgain = await repository.setCurrentFolder('/user/selected');
    expect(folderAgain.id).toBe(folder.id);

    const previousDraft = firstList.find((file) => file.name === 'draft.pdf');
    await repository.upsertFiles(folder.id, [
      {
        id: 'ignored3',
        folderId: folder.id,
        name: 'draft.pdf',
        path: '/user/selected/draft.pdf',
        kind: 'pdf'
      }
    ]);

    const secondList = await repository.listFiles(folder.id);
    expect(secondList).toHaveLength(2);
    const currentDraft = secondList.find((file) => file.name === 'draft.pdf');
    expect(currentDraft?.id).toBe(previousDraft?.id);
    expect(secondList.some((file) => file.name === 'mydoc.docx')).toBe(true);
  });
});
