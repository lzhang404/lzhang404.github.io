const mainFrame = (state, answer, status) => ({
  name: "main()",
  state,
  badge: state === "receiving" ? "received value" : state === "active" ? "running" : "waiting",
  fields: [
    ["local variable", `answer = ${answer}`]
  ],
  status
});

const factorialFrame = (n, state, savedWork, status, received = null) => ({
  name: `factorial(${n})`,
  state,
  badge: state === "receiving"
    ? `received ${received}`
    : state === "departing"
      ? "returning"
      : state === "active"
        ? "running"
        : "waiting",
  fields: [
    ["parameter", `n = ${n}`],
    ["saved work", savedWork],
    ...(received === null ? [] : [["child returned", String(received), "received"]])
  ],
  status
});

const steps = [
  {
    phase: "Ready",
    title: "Before the recursive call",
    line: 10,
    frames: [
      mainFrame("active", "not assigned", "main is about to call factorial(4).")
    ],
    event: null,
    message: "Only main() is active. Calling factorial(4) will pause main and push a new stack frame."
  },
  {
    phase: "Call phase",
    title: "Create the factorial(4) frame",
    line: 2,
    newFrame: "factorial(4)",
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "active", "4 × factorial(3)", "The base case is false, so this call needs factorial(3).")
    ],
    event: { type: "call", from: "main()", to: "factorial(4)", label: "push n = 4" },
    message: "factorial(4) gets its own frame and its own n = 4. main() remains below it, waiting."
  },
  {
    phase: "Call phase",
    title: "Create the factorial(3) frame",
    line: 2,
    newFrame: "factorial(3)",
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "waiting", "4 × ?", "Waiting for factorial(3)."),
      factorialFrame(3, "active", "3 × factorial(2)", "The base case is false, so this call needs factorial(2).")
    ],
    event: { type: "call", from: "factorial(4)", to: "factorial(3)", label: "push n = 3" },
    message: "factorial(4) pauses with 4 × ? saved in its frame. factorial(3) is pushed on top."
  },
  {
    phase: "Call phase",
    title: "Create the factorial(2) frame",
    line: 2,
    newFrame: "factorial(2)",
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "waiting", "4 × ?", "Waiting for factorial(3)."),
      factorialFrame(3, "waiting", "3 × ?", "Waiting for factorial(2)."),
      factorialFrame(2, "active", "2 × factorial(1)", "The base case is false, so this call needs factorial(1).")
    ],
    event: { type: "call", from: "factorial(3)", to: "factorial(2)", label: "push n = 2" },
    message: "factorial(3) saves 3 × ? and pauses. factorial(2) receives a separate n = 2 frame."
  },
  {
    phase: "Base case",
    title: "Create the factorial(1) frame",
    line: 3,
    newFrame: "factorial(1)",
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "waiting", "4 × ?", "Waiting for factorial(3)."),
      factorialFrame(3, "waiting", "3 × ?", "Waiting for factorial(2)."),
      factorialFrame(2, "waiting", "2 × ?", "Waiting for factorial(1)."),
      factorialFrame(1, "active", "return 1", "n <= 1 is true. This call answers directly.")
    ],
    event: { type: "call", from: "factorial(2)", to: "factorial(1)", label: "push n = 1" },
    message: "factorial(1) still gets a frame. It reaches the base case and can return 1 without another call."
  },
  {
    phase: "Return phase",
    title: "Return 1 to factorial(2)",
    line: 6,
    departed: factorialFrame(1, "departing", "return 1", "This frame is popped after returning 1."),
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "waiting", "4 × ?", "Waiting for factorial(3)."),
      factorialFrame(3, "waiting", "3 × ?", "Waiting for factorial(2)."),
      factorialFrame(2, "receiving", "2 × 1 = 2", "Uses the child's 1 and prepares to return 2.", 1)
    ],
    event: { type: "return", from: "factorial(1)", to: "factorial(2)", value: 1 },
    message: "factorial(1) is popped. Its return value 1 fills the ? saved in factorial(2), so 2 × 1 becomes 2."
  },
  {
    phase: "Return phase",
    title: "Return 2 to factorial(3)",
    line: 6,
    departed: factorialFrame(2, "departing", "return 2", "This frame is popped after returning 2."),
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "waiting", "4 × ?", "Waiting for factorial(3)."),
      factorialFrame(3, "receiving", "3 × 2 = 6", "Uses the child's 2 and prepares to return 6.", 2)
    ],
    event: { type: "return", from: "factorial(2)", to: "factorial(3)", value: 2 },
    message: "factorial(2) returns 2 and its frame is removed. factorial(3) resumes and computes 3 × 2 = 6."
  },
  {
    phase: "Return phase",
    title: "Return 6 to factorial(4)",
    line: 6,
    departed: factorialFrame(3, "departing", "return 6", "This frame is popped after returning 6."),
    frames: [
      mainFrame("waiting", "waiting", "Paused until factorial(4) returns."),
      factorialFrame(4, "receiving", "4 × 6 = 24", "Uses the child's 6 and prepares to return 24.", 6)
    ],
    event: { type: "return", from: "factorial(3)", to: "factorial(4)", value: 6 },
    message: "factorial(3) returns 6. The older factorial(4) frame receives it and completes 4 × 6 = 24."
  },
  {
    phase: "Return phase",
    title: "Return 24 to main",
    line: 10,
    departed: factorialFrame(4, "departing", "return 24", "The last factorial frame is popped."),
    frames: [
      mainFrame("receiving", "24", "The returned 24 is assigned to answer.")
    ],
    event: { type: "return", from: "factorial(4)", to: "main()", value: 24 },
    message: "factorial(4) returns 24 and is popped. main() receives 24, so the waiting assignment can finish."
  },
  {
    phase: "Complete",
    title: "main continues",
    line: 11,
    frames: [
      mainFrame("active", "24", "main prints 24 and continues after the call.")
    ],
    event: null,
    message: "All factorial frames are gone. main() continues on the next line with answer = 24."
  }
];

const elements = {
  phaseLabel: document.querySelector("#phase-label"),
  stepTitle: document.querySelector("#step-title"),
  stepCounter: document.querySelector("#step-counter"),
  lineBadge: document.querySelector("#line-badge"),
  codeLines: [...document.querySelectorAll(".code-line")],
  depthBadge: document.querySelector("#depth-badge"),
  eventFlow: document.querySelector("#event-flow"),
  frames: document.querySelector("#frames"),
  stackSummary: document.querySelector("#stack-summary"),
  explanation: document.querySelector(".explanation"),
  stepMessage: document.querySelector("#step-message"),
  previous: document.querySelector("#previous-step"),
  next: document.querySelector("#next-step"),
  dots: document.querySelector("#step-dots")
};

let currentStep = 0;

function frameMarkup(frame, extraClass = "") {
  const fields = frame.fields.map(([label, value, className = ""]) => `
    <div class="frame-field ${className}">
      <span>${label}</span>
      <code>${value}</code>
    </div>`).join("");

  return `
    <article class="stack-frame ${frame.state} ${extraClass}" aria-label="${frame.name}, ${frame.badge}">
      <div class="frame-header">
        <code>${frame.name}</code>
        <span class="frame-state">${frame.badge}</span>
      </div>
      <div class="frame-body">
        ${fields}
        <p class="frame-status">${frame.status}</p>
      </div>
    </article>`;
}

function renderEvent(event) {
  if (!event) {
    elements.eventFlow.className = "event-flow idle";
    elements.eventFlow.innerHTML = "No frame crosses the stack boundary in this step.";
    return;
  }

  elements.eventFlow.className = "event-flow";
  if (event.type === "call") {
    elements.eventFlow.innerHTML = `
      <span class="event-node">${event.from}</span>
      <span class="event-arrow call"><span class="event-label">${event.label}</span></span>
      <span class="event-node">${event.to}</span>`;
    return;
  }

  elements.eventFlow.innerHTML = `
    <span class="event-node">${event.from}</span>
    <span class="event-arrow return"><span class="event-label">return <span class="value-pill">${event.value}</span></span></span>
    <span class="event-node">${event.to}</span>`;
}

function renderFrames(step) {
  const activeFramesTopFirst = [...step.frames].reverse();
  const content = [];

  if (step.departed) {
    content.push(frameMarkup(step.departed));
    content.push(`<div class="return-connector">value moves to parent; frame is removed</div>`);
  }

  activeFramesTopFirst.forEach((frame) => {
    const isNew = frame.name === step.newFrame ? "entering" : "";
    content.push(frameMarkup(frame, isNew));
  });

  elements.frames.innerHTML = content.join("");
}

function renderDots() {
  elements.dots.innerHTML = steps.map((step, index) => {
    const current = index === currentStep ? ' aria-current="step"' : "";
    const returnClass = step.phase === "Return phase" ? " return-dot" : "";
    return `<button class="step-dot${returnClass}" type="button" data-step="${index}" aria-label="Go to step ${index + 1}: ${step.title}"${current}>${index + 1}</button>`;
  }).join("");
}

function render() {
  const step = steps[currentStep];
  const isReturn = step.phase === "Return phase";
  const activeCount = step.frames.length;

  elements.phaseLabel.textContent = step.phase;
  elements.stepTitle.textContent = step.title;
  elements.stepCounter.textContent = `Step ${currentStep + 1} of ${steps.length}`;
  elements.lineBadge.textContent = `Line ${step.line}`;
  elements.depthBadge.textContent = `${activeCount} active frame${activeCount === 1 ? "" : "s"}`;
  elements.stepMessage.textContent = step.message;
  elements.explanation.classList.toggle("return-phase", isReturn);

  elements.codeLines.forEach((line) => {
    const isActive = Number(line.dataset.line) === step.line;
    line.classList.toggle("active", isActive && !isReturn);
    line.classList.toggle("returning", isActive && isReturn);
  });

  renderEvent(step.event);
  renderFrames(step);
  renderDots();

  const stackNames = [...step.frames].reverse().map((frame) => frame.name).join(", then ");
  elements.stackSummary.textContent = `${step.title}. Stack from top to bottom: ${stackNames}. ${step.message}`;

  elements.previous.disabled = currentStep === 0;
  elements.next.disabled = currentStep === steps.length - 1;
  elements.next.textContent = currentStep === steps.length - 2 ? "Finish →" : "Next →";
}

elements.previous.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    render();
  }
});

elements.next.addEventListener("click", () => {
  if (currentStep < steps.length - 1) {
    currentStep += 1;
    render();
  }
});

elements.dots.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step]");
  if (!button) return;
  currentStep = Number(button.dataset.step);
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && currentStep > 0) {
    currentStep -= 1;
    render();
  }
  if (event.key === "ArrowRight" && currentStep < steps.length - 1) {
    currentStep += 1;
    render();
  }
});

render();
