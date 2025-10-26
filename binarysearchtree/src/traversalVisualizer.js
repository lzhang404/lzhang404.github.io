import { BstBaseVisualizer } from "./baseVisualizer.js";
import { traversalSnippet } from "./codeSnippets.js";
import { generateTraversalSteps } from "./steps.js";

export class BstTraversalVisualizer extends BstBaseVisualizer {
  constructor() {
    const parseOperationInput = () => {
      const orderInput = document.querySelector("#traversal-order");
      const mode = orderInput?.value ?? "inorder";
      return { ok: true, payload: { mode } };
    };

    super({
      parseOperationInput,
      generateSteps: ({ tree, input }) =>
        generateTraversalSteps(tree, input?.mode),
      codeSnippet: traversalSnippet,
    });

    const orderInput = document.querySelector("#traversal-order");
    orderInput?.addEventListener("change", () => this.rebuild());
  }
}
