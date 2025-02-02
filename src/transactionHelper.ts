import db from "./db.js";
import { TransactionStatus } from "./models/enums.js";

export async function runInTransaction(fn: () => Promise<void>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.run(TransactionStatus.Begin, async (beginErr: Error | null) => {
      if (beginErr) {
        return reject(beginErr);
      }

      try {
        await fn();
        db.run(TransactionStatus.Commit, (commitErr: Error | null) => {
          if (commitErr) {
            return reject(commitErr);
          }

          resolve();
        });
      } catch (error) {
        db.run(TransactionStatus.Rollback, (rollbackErr: Error | null) => {
          if (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
          }

          reject(error);
        });
      }
    });
  });
}
