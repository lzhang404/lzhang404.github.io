import { BstBaseVisualizer } from "./baseVisualizer.js";
import { insertSnippet } from "./codeSnippets.js";
import { generateInsertionSteps } from "./steps.js";

export class BstInsertionVisualizer extends BstBaseVisualizer {
  constructor() {
    const parseOperationInput = () => {
      const keyInput = document.querySelector("#insert-key");
      const key = Number(keyInput?.value ?? "");
      if (!Number.isFinite(key)) {
        return { ok: false, message: "Enter a numeric key to insert." };
      }
      return { ok: true, payload: { key } };
    };

    super({
      parseOperationInput,
      generateSteps: ({ tree, input }) =>
        generateInsertionSteps(tree, input?.key),
      codeSnippet: insertSnippet,
    });
  }
}
