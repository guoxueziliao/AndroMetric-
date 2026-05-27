import type { Snapshot } from '../../domain';

const MIN_READBACK_LENGTH_RATIO = 0.95;

type SnapshotStore = {
  add: (snapshot: Snapshot) => Promise<number>;
  get: (id: number) => Promise<Snapshot | undefined>;
  delete: (id: number) => Promise<void>;
};

const getDataJsonLength = (snapshot: Snapshot) => JSON.stringify(snapshot.data).length;

export const assertSnapshotReadback = (expected: Snapshot, readback: Snapshot | undefined, id: number) => {
  if (!readback) {
    throw new Error('快照写入自检失败：无法读回刚创建的快照');
  }

  if (readback.id !== id) {
    throw new Error('快照写入自检失败：读回快照 ID 不一致');
  }

  const expectedLength = getDataJsonLength(expected);
  const readbackLength = getDataJsonLength(readback);
  if (readbackLength < expectedLength * MIN_READBACK_LENGTH_RATIO) {
    throw new Error('快照写入自检失败：读回数据长度异常');
  }

  if (readback.data.logs.length !== expected.data.logs.length) {
    throw new Error('快照写入自检失败：日志数量不一致');
  }

  if (readback.data.partners.length !== expected.data.partners.length) {
    throw new Error('快照写入自检失败：伴侣数量不一致');
  }
};

export const addSnapshotWithReadbackCheck = async (snapshot: Snapshot, store: SnapshotStore) => {
  const id = await store.add(snapshot);
  const readback = await store.get(id);

  try {
    assertSnapshotReadback(snapshot, readback, id);
    return id;
  } catch (error) {
    await store.delete(id).catch(() => undefined);
    throw error;
  }
};
