import { BstBaseVisualizer } from "./baseVisualizer.js";
import { removalSnippet } from "./codeSnippets.js";
import { generateRemovalSteps } from "./steps.js";

export class BstRemovalVisualizer extends BstBaseVisualizer {
  constructor() {
    const parseOperationInput = () => {
      const keyInput = document.querySelector("#remove-key");
      const key = Number(keyInput?.value ?? "");
      if (!Number.isFinite(key)) {
        return { ok: false, message: "Enter a numeric key to remove." };
      }
      return { ok: true, payload: { key } };
    };

    super({
      parseOperationInput,
      generateSteps: ({ tree, input }) =>
        generateRemovalSteps(tree, input?.key),
      codeSnippet: removalSnippet,
    });
  }
}
