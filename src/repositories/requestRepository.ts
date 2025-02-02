import sqlite3 from "sqlite3";

import db from "../db.js";
import { RequestRow } from "../models/index.js";
import { RequestStatus } from "../models/enums.js";

export function insertRequest(originalUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO requests (original_url, canonical_url, status) VALUES (?, ?, ?)",
      [originalUrl, null, RequestStatus.Pending],
      function (this: sqlite3.RunResult, err: Error) {
        if (err) {
          return reject(err);
        }

        resolve(this.lastID);
      }
    );
  });
}

export function findRequestById(id: number): Promise<RequestRow | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM requests WHERE id = ?",
      [id],
      (err: Error, row: RequestRow) => {
        if (err) {
          return reject(err);
        }

        resolve(row);
      }
    );
  });
}

export function setRequestCanonical(
  requestId: number,
  canonical: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE requests SET canonical_url = ? WHERE id = ?",
      [canonical, requestId],
      function (err: Error) {
        if (err) {
          return reject(err);
        }

        resolve();
      }
    );
  });
}

export function updateRequestStatus(
  requestId: number,
  status: RequestStatus
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE requests SET status = ? WHERE id = ?",
      [status, requestId],
      function (err: Error) {
        if (err) {
          return reject(err);
        }

        resolve();
      }
    );
  });
}
