// Lets tests load TSX files that import "@/..." (the tsconfig path alias used
// by shadcn/ui components) by mapping it to ../src/.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export function installSrcAlias() {
  const Module = createRequire(import.meta.url)("node:module");
  if (Module._kiteAlias) return;
  const src = fileURLToPath(new URL("../src/", import.meta.url));
  const resolve = Module._resolveFilename;
  Module._resolveFilename = function (request, ...rest) {
    return resolve.call(this, request.startsWith("@/") ? src + request.slice(2) : request, ...rest);
  };
  Module._kiteAlias = true;
}
