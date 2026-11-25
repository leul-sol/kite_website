import { translate, type MessageKey, type Params } from "./translate";

/**
 * An error raised by our own checks. Its message is the English text (so logs
 * and tests read naturally), and it keeps the key so screens can show it in the
 * reader's language. Errors from the server stay as the server wrote them.
 */
export class TextError extends Error {
  constructor(public readonly key: MessageKey, public readonly params?: Params) {
    super(translate("en", key, params));
    this.name = "TextError";
  }
}

/** The text to show for a caught error, in the reader's language when we wrote it. */
export function errorText(t: (key: MessageKey, params?: Params) => string, cause: unknown, fallback: MessageKey): string {
  if (cause instanceof TextError) return t(cause.key, cause.params);
  if (cause instanceof Error && cause.message) return cause.message;
  return t(fallback);
}
