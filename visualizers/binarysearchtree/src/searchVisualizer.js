import { BstBaseVisualizer } from "./baseVisualizer.js";
import { searchSnippet } from "./codeSnippets.js";
import { generateSearchSteps } from "./steps.js";

export class BstSearchVisualizer extends BstBaseVisualizer {
  constructor() {
    const parseOperationInput = () => {
      const keyInput = document.querySelector("#key-input");
      const raw = keyInput?.value ?? "";
      const key = Number(raw);
      if (!Number.isFinite(key)) {
        return { ok: false, message: "Enter a numeric key to search for." };
      }
      return { ok: true, payload: { key } };
    };

    super({
      parseOperationInput,
      generateSteps: ({ tree, input }) =>
        generateSearchSteps(tree, input?.key),
      codeSnippet: searchSnippet,
    });
  }
}
