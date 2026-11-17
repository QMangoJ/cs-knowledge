/** UI v2 sample gate (C 版阅读器重构样板).
 *  The v2 layouts exist ONLY behind these gates: the distributed subject
 *  section on the home page and the cap-consistency reader. Every other page
 *  renders through the exact same code paths as before. Promoting the sample
 *  site-wide = widening these two predicates (and then removing them). */
export const V2_SUBJECT_ID = "distributed";
export const V2_READER_TOPIC_ID = "distributed/cap-consistency";

/** Sample pulled from production 2026-11-17 (Daniel: mixed old/new sections
 *  on mobile read as a mess). Code stays in tree; gates off until the sample
 *  is reworked as a coherent whole (nav + mobile + desktop) and approved
 *  from screenshots before going live again. */
export const isV2Subject = (subject: string): boolean => false;
export const isV2Reader = (topicId: string): boolean => false;

/** localStorage key for the reader font-size setting ("std" | "large"). */
export const READER_FS_KEY = "cs-reader-fs";
