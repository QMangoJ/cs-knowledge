/** UI v2 gates.
 *  Reader: PROMOTED SITE-WIDE 2026-11-17 — Daniel reviewed the merged
 *  content-area reader form (screenshots from the reader-form-sample branch)
 *  and approved rolling it out to every lesson, so isV2Reader is open for
 *  all topics. The old Player stays in the tree as a rollback path; it is
 *  simply no longer selected.
 *  Home-page subject sections: the v2 gate stays OFF (not part of the
 *  reader promotion). */
export const V2_SUBJECT_ID = "distributed";
export const V2_READER_TOPIC_ID = "distributed/cap-consistency";

export const isV2Subject = (subject: string): boolean => false;
export const isV2Reader = (topicId: string): boolean => true;

/** localStorage key for the reader font-size setting ("std" | "large"). */
export const READER_FS_KEY = "cs-reader-fs";
