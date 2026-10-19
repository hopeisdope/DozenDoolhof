/**
 * Which levels have been completed during this visit.
 *
 * Deliberately in memory only: progress is lost on reload. Durable storage
 * (localStorage with a versioned format) is planned for a later phase.
 */
export class Progress {
  private readonly completed = new Set<string>();

  isCompleted(levelId: string): boolean {
    return this.completed.has(levelId);
  }

  markCompleted(levelId: string): void {
    this.completed.add(levelId);
  }

  countCompleted(levelIds: readonly string[]): number {
    return levelIds.filter((id) => this.completed.has(id)).length;
  }
}
