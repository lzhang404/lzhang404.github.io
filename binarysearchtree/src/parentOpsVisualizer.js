import { BstBaseVisualizer } from "./baseVisualizer.js";
import { parentOpsSnippet } from "./codeSnippets.js";
import { generateParentOperationSteps } from "./steps.js";

export class BstParentOpsVisualizer extends BstBaseVisualizer {
  constructor() {
    const parseOperationInput = () => {
      const modeSelect = document.querySelector("#parent-mode");
      const mode = modeSelect?.value ?? "insert";
      const keyInput = document.querySelector("#parent-key");
      const key = Number(keyInput?.value ?? "");
      if (!Number.isFinite(key)) {
        return { ok: false, message: "Enter a numeric key for the selected operation." };
      }
      return { ok: true, payload: { mode, key } };
    };

    super({
      parseOperationInput,
      generateSteps: ({ tree, input }) =>
        generateParentOperationSteps(tree, {
          mode: input?.mode ?? "insert",
          keyValue: input?.key,
        }),
      codeSnippet: parentOpsSnippet,
    });

    const modeSelect = document.querySelector("#parent-mode");
    modeSelect?.addEventListener("change", () => this.rebuild());
  }
}
