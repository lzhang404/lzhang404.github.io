import { BstBaseVisualizer } from "./baseVisualizer.js";
import { heightSnippet } from "./codeSnippets.js";
import { generateHeightSteps } from "./steps.js";

export class BstHeightVisualizer extends BstBaseVisualizer {
  constructor() {
    super({
      parseOperationInput: () => ({ ok: true, payload: {} }),
      generateSteps: ({ tree }) => generateHeightSteps(tree),
      codeSnippet: heightSnippet,
    });
  }
}
