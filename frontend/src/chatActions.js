/**
 * Chat quick actions shared across components.
 *
 * Usage:
 *   import { startConversationWithUsername, markAllRead } from "./chatActions";
 *   await startConversationWithUsername("another_user");
 *   await markAllRead(conversationId);
 */
import api from "./api/apiClient";

/**
 * Open (or create) a 1:1 conversation by username and navigate to it.
 * @param {string} username   target username (no leading @)
 * @param {Function} navigate React Router navigate
 * @returns {Promise<string|null>} conversation id on success, null on failure
 */
export async function startConversationWithUsername(username, navigate) {
  if (!username) return null;
  try {
    const res = await api.get("/api/chat/conversations/get_or_create/", {
      params: { username },
    });
    const cid = res.data?.id;
    if (navigate && cid) navigate(`/messages/${cid}`);
    return cid;
  } catch {
    return null;
  }
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markAllRead(conversationId) {
  if (!conversationId) return;
  try {
    await api.post(`/api/chat/conversations/${conversationId}/mark_as_read/`);
  } catch { /* fire-and-forget */ }
}
