import fs from 'fs';
import path from 'path';

export interface ScoreSnapshot {
  id: string;
  userId: string;
  resumeId: string;
  version: number;
  score: number;
  categoryScores?: Record<string, number>;
  timestamp: string;
}

export class ScoreSnapshotDatabase {
  private snapshots: Map<string, ScoreSnapshot[]> = new Map(); // resumeId -> snapshots[]
  private storageFile: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {}
    }
    this.storageFile = path.join(dataDir, 'score_snapshots.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          for (const [resumeId, list] of Object.entries(parsed)) {
            if (Array.isArray(list)) {
              this.snapshots.set(resumeId, list as ScoreSnapshot[]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ScoreSnapshotDb] Failed to load from disk, using in-memory store:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const obj: Record<string, ScoreSnapshot[]> = {};
      for (const [k, v] of this.snapshots.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[ScoreSnapshotDb] Failed to persist snapshots to disk:', err);
    }
  }

  public saveSnapshot(
    userId: string,
    resumeId: string,
    score: number,
    categoryScores?: Record<string, number>
  ): { snapshot: ScoreSnapshot; delta: number; totalSnapshots: number } {
    const list = this.snapshots.get(resumeId) || [];
    const version = list.length + 1;
    const now = new Date().toISOString();

    const snapshot: ScoreSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId || 'anonymous_user',
      resumeId,
      version,
      score,
      categoryScores,
      timestamp: now,
    };

    const prevScore = list.length > 0 ? list[list.length - 1].score : score;
    const delta = score - prevScore;

    list.push(snapshot);
    this.snapshots.set(resumeId, list);
    this.saveToDisk();

    return {
      snapshot,
      delta,
      totalSnapshots: list.length,
    };
  }

  public getSnapshots(resumeId: string): { snapshots: ScoreSnapshot[]; delta: number } {
    const list = this.snapshots.get(resumeId) || [];
    let delta = 0;
    if (list.length >= 2) {
      delta = list[list.length - 1].score - list[list.length - 2].score;
    }
    return { snapshots: list, delta };
  }
}

export const scoreSnapshotDb = new ScoreSnapshotDatabase();
