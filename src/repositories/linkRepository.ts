import db from "../db.js";
import { LinkRow, LinkTag } from "../models/index.js";

export function saveLinkTags(
  requestId: number,
  linkTags: LinkTag[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM links WHERE request_id = ?",
      [requestId],
      (delErr: Error) => {
        if (delErr) {
          return reject(delErr);
        }

        const stmt = db.prepare(
          "INSERT INTO links (request_id, rel, href) VALUES (?, ?, ?)"
        );
        for (const tag of linkTags) {
          stmt.run(requestId, tag.rel ?? "", tag.href ?? "");
        }
        stmt.finalize((err: Error) => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      }
    );
  });
}

export function fetchLinksByRequestId(requestId: number): Promise<LinkRow[]> {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM links WHERE request_id = ?",
      [requestId],
      (err: Error, rows: LinkRow[]) => {
        if (err) {
          return reject(err);
        }

        resolve(rows);
      }
    );
  });
}
