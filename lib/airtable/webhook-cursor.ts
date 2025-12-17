/**
 * Webhook Cursor Persistence
 * Stores the cursor position for idempotent webhook processing.
 * For now, uses file-based storage. Can be upgraded to Airtable or SQLite.
 */

import { promises as fs } from 'fs'
import path from 'path'

const CURSOR_FILE = path.join(process.cwd(), '.cursor-state.json')

interface CursorState {
  lastCursor: string | null
  lastProcessed: string | null
  processedIds: Set<string>
}

let cursorState: CursorState | null = null

/**
 * Load cursor state from file
 */
async function loadCursorState(): Promise<CursorState> {
  if (cursorState) {
    return cursorState
  }

  try {
    const data = await fs.readFile(CURSOR_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    cursorState = {
      lastCursor: parsed.lastCursor || null,
      lastProcessed: parsed.lastProcessed || null,
      processedIds: new Set(parsed.processedIds || []),
    }
  } catch (error) {
    // File doesn't exist or is invalid, start fresh
    cursorState = {
      lastCursor: null,
      lastProcessed: null,
      processedIds: new Set(),
    }
  }

  return cursorState
}

/**
 * Save cursor state to file
 */
export async function saveCursor(cursor: string, processedId?: string): Promise<void> {
  const state = await loadCursorState()
  state.lastCursor = cursor
  if (processedId) {
    state.lastProcessed = processedId
    state.processedIds.add(processedId)
  }

  // Persist to file
  await fs.writeFile(
    CURSOR_FILE,
    JSON.stringify({
      lastCursor: state.lastCursor,
      lastProcessed: state.lastProcessed,
      processedIds: Array.from(state.processedIds),
    }),
    'utf-8'
  )
}

/**
 * Get the last cursor position
 */
export async function getLastCursor(): Promise<string | null> {
  const state = await loadCursorState()
  return state.lastCursor
}

/**
 * Check if an ID has already been processed (idempotency check)
 */
export async function isProcessed(id: string): Promise<boolean> {
  const state = await loadCursorState()
  return state.processedIds.has(id)
}

/**
 * Mark an ID as processed
 */
export async function markProcessed(id: string): Promise<void> {
  const state = await loadCursorState()
  state.processedIds.add(id)
  state.lastProcessed = id
  await fs.writeFile(
    CURSOR_FILE,
    JSON.stringify({
      lastCursor: state.lastCursor,
      lastProcessed: state.lastProcessed,
      processedIds: Array.from(state.processedIds),
    }),
    'utf-8'
  )
}
