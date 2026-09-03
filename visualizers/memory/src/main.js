const addresses = {
  x: 0x1000,
  y: 0x1004,
  pointer: 0x1010,
  array: 0x2000,
  arrayPointer: 0x1100,
  contiguous: 0x6000,
  contiguousPointer: 0x1200,
  pointerTable: 0x7000,
  pointerToPointer: 0x1300,
  rows: [0x8000, 0x9000]
};

const state = {
  lesson: "pointer",
  quizAnswer: null,
  walkthrough: {
    pointer: 0,
    array1d: 0,
    array2d: 0
  },
  pointer: {
    target: "x",
    x: 10,
    y: 20,
    writeValue: 30,
    lastAction: "point"
  },
  array1d: {
    size: 5,
    selected: -1,
    initialized: false,
    allocated: true,
    nulled: false
  },
  array2d: {
    layout: "contiguous",
    rows: 2,
    cols: 3,
    selectedRow: -1,
    selectedCol: -1,
    initialized: false,
    rowsAllocated: 0,
    rowsInitialized: 0,
    cleanupStep: 0
  }
};

const lessons = {
  pointer: {
    kicker: "Address before value",
    title: "A pointer is a variable that stores an address",
    goal: "Point p at x, y, or no object. Then write through p and watch which value changes."
  },
  array1d: {
    kicker: "One allocation, adjacent elements",
    title: "A dynamic 1D array is one contiguous heap block",
    goal: "Allocate the array, initialize its elements, access one index, and release the block."
  },
  array2d: {
    kicker: "Same grid, different memory",
    title: "A 2D view can hide two very different layouts",
    goal: "Select a cell and compare one base-plus-offset calculation with two pointer hops. Then step through the required cleanup."
  }
};

const array2dWalkthroughs = {
  contiguous: [
    {
      label: "Allocate block",
      instruction: "new double[6] creates six adjacent cells. Their addresses increase continuously inside one heap allocation.",
      apply: () => Object.assign(state.array2d, { layout: "contiguous", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 0, cleanupStep: 0 })
    },
    {
      label: "Fill values",
      instruction: "The nested loops write values into the existing contiguous cells. The addresses do not change.",
      apply: () => Object.assign(state.array2d, { layout: "contiguous", selectedRow: -1, selectedCol: -1, initialized: true, rowsAllocated: 0, cleanupStep: 0 })
    },
    {
      label: "Access [1][2]",
      instruction: "Row 1, column 2 maps to the last cell in this one contiguous block.",
      apply: () => Object.assign(state.array2d, { layout: "contiguous", selectedRow: 1, selectedCol: 2, initialized: true, rowsAllocated: 0, cleanupStep: 0 })
    },
    {
      label: "Delete block",
      instruction: "Because there is one allocation, one delete[] releases the entire 2D data block.",
      apply: () => Object.assign(state.array2d, { layout: "contiguous", selectedRow: 1, selectedCol: 2, initialized: true, rowsAllocated: 0, cleanupStep: 1 })
    },
    {
      label: "Clear data",
      instruction: "data = nullptr clears the stale address after the contiguous block is released.",
      apply: () => Object.assign(state.array2d, { layout: "contiguous", selectedRow: 1, selectedCol: 2, initialized: true, rowsAllocated: 0, cleanupStep: 2 })
    }
  ],
  pointer: [
    {
      label: "Allocate table",
      instruction: "new double*[ROWS] creates only the row-pointer table. Both entries are unassigned; no row arrays exist yet.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 0, rowsInitialized: 0, cleanupStep: 0 })
    },
    {
      label: "Allocate row 0",
      instruction: "On the r = 0 iteration, dyn[0] receives the address of the first separate row allocation.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 1, rowsInitialized: 0, cleanupStep: 0 })
    },
    {
      label: "Fill row 0",
      instruction: "The inner c loop fills row 0 before the outer loop advances to r = 1.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 1, rowsInitialized: 1, cleanupStep: 0 })
    },
    {
      label: "Allocate row 1",
      instruction: "On the r = 1 iteration, dyn[1] receives a different row address. The address gap shows that the rows are separate allocations.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 2, rowsInitialized: 1, cleanupStep: 0 })
    },
    {
      label: "Fill row 1",
      instruction: "The inner c loop now fills row 1. Both row allocations are complete.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: -1, selectedCol: -1, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 0 })
    },
    {
      label: "Access dyn[1][2]",
      instruction: "dyn[1] follows its own arrow to row 1; [2] then selects the third cell in that row.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: 1, selectedCol: 2, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 0 })
    },
    {
      label: "Delete row 0",
      instruction: "On the cleanup loop's r = 0 iteration, delete[] dyn[0] releases only row 0.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: 1, selectedCol: 2, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 1 })
    },
    {
      label: "Delete row 1",
      instruction: "On the r = 1 iteration, delete[] dyn[1] releases the other row.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: 1, selectedCol: 2, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 2 })
    },
    {
      label: "Delete table",
      instruction: "After both rows are gone, delete[] dyn releases the row-pointer table.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: 1, selectedCol: 2, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 3 })
    },
    {
      label: "Clear dyn",
      instruction: "dyn = nullptr clears the stale table address. All three heap allocations are gone.",
      apply: () => Object.assign(state.array2d, { layout: "pointer", selectedRow: 1, selectedCol: 2, initialized: false, rowsAllocated: 2, rowsInitialized: 2, cleanupStep: 4 })
    }
  ]
};

const walkthroughs = {
  pointer: [
    {
      label: "Declare",
      instruction: "x and y contain ordinary integer values. p starts at nullptr, so it has no pointee yet.",
      apply: () => Object.assign(state.pointer, { target: "null", x: 10, y: 20, writeValue: 30, lastAction: "point" })
    },
    {
      label: "Store &x",
      instruction: "&x produces x's address. That address—not the value 10—is copied into p.",
      apply: () => Object.assign(state.pointer, { target: "x", x: 10, y: 20, writeValue: 30, lastAction: "point" })
    },
    {
      label: "Write *p",
      instruction: "Dereference follows the address in p. Because p points to x, *p = 30 changes x.",
      apply: () => Object.assign(state.pointer, { target: "x", x: 30, y: 20, writeValue: 30, lastAction: "write" })
    },
    {
      label: "Reseat p",
      instruction: "p = &y changes the address stored in p. It does not move or change x.",
      apply: () => Object.assign(state.pointer, { target: "y", x: 30, y: 20, writeValue: 40, lastAction: "point" })
    },
    {
      label: "Write y",
      instruction: "Now the same expression *p reaches y, because p stores y's address.",
      apply: () => Object.assign(state.pointer, { target: "y", x: 30, y: 40, writeValue: 40, lastAction: "write" })
    }
  ],
  array1d: [
    {
      label: "Allocate",
      instruction: "new int[5] creates five adjacent heap cells. arr stores the address of the first cell.",
      apply: () => Object.assign(state.array1d, { size: 5, selected: -1, initialized: false, allocated: true, nulled: false })
    },
    {
      label: "Fill values",
      instruction: "The loop writes a value into each existing array cell. The cells and their addresses stay in place.",
      apply: () => Object.assign(state.array1d, { size: 5, selected: -1, initialized: true, allocated: true, nulled: false })
    },
    {
      label: "Read arr[2]",
      instruction: "Index 2 selects the third cell. Its address is shown with the other adjacent element addresses.",
      apply: () => Object.assign(state.array1d, { size: 5, selected: 2, initialized: true, allocated: true, nulled: false })
    },
    {
      label: "delete[]",
      instruction: "delete[] releases the entire contiguous block. arr still holds the old address and is now dangling.",
      apply: () => Object.assign(state.array1d, { size: 5, selected: 2, initialized: true, allocated: false, nulled: false })
    },
    {
      label: "Clear",
      instruction: "arr = nullptr makes it explicit that the pointer no longer identifies an array.",
      apply: () => Object.assign(state.array1d, { size: 5, selected: 2, initialized: true, allocated: false, nulled: true })
    }
  ],
  array2d: array2dWalkthroughs.contiguous
};

const elements = {
  tabs: [...document.querySelectorAll("[data-lesson]")],
  lessonKicker: document.querySelector("#lesson-kicker"),
  lessonTitle: document.querySelector("#lesson-title"),
  lessonGoal: document.querySelector("#lesson-goal"),
  layoutChoice: document.querySelector("#layout-choice"),
  layoutButtons: [...document.querySelectorAll("[data-2d-layout]")],
  stepPosition: document.querySelector("#step-position"),
  stepTitle: document.querySelector("#step-title"),
  stepList: document.querySelector("#step-list"),
  stepInstruction: document.querySelector("#step-instruction"),
  previousStep: document.querySelector("#previous-step"),
  nextStep: document.querySelector("#next-step"),
  codeLines: document.querySelector("#code-lines"),
  controls: document.querySelector("#lesson-controls"),
  memoryStage: document.querySelector("#memory-stage"),
  stateBadge: document.querySelector("#state-badge"),
  activeExpression: document.querySelector("#active-expression"),
  traceMessage: document.querySelector("#trace-message"),
  checkQuestion: document.querySelector("#check-question"),
  answerOptions: document.querySelector("#answer-options"),
  answerFeedback: document.querySelector("#answer-feedback")
};

function hex(value) {
  return `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function makeButton(label, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = options.className || "button";
  button.textContent = label;
  if (options.pressed !== undefined) {
    button.setAttribute("aria-pressed", String(options.pressed));
  }
  if (options.disabled) {
    button.disabled = true;
  }
  if (options.onClick) {
    button.addEventListener("click", options.onClick);
  }
  return button;
}

function makeControlGroup(label) {
  const group = document.createElement("div");
  group.className = "control-group";
  const heading = document.createElement("span");
  heading.className = "control-label";
  heading.textContent = label;
  group.append(heading);
  return group;
}

function renderCode(lines, activeIndex) {
  elements.codeLines.replaceChildren();
  lines.forEach((line, index) => {
    const row = document.createElement("span");
    row.className = `code-line${index === activeIndex ? " active" : ""}`;
    row.dataset.line = String(index + 1);
    row.textContent = line || " ";
    elements.codeLines.append(row);
  });
}

function cellMarkup({ name, value, address, region = "heap", selected = false, freed = false, button = false, extra = "" }) {
  const tag = button ? "button" : "div";
  const type = button ? ' type="button"' : "";
  const disabled = button && freed ? " disabled" : "";
  const classes = ["memory-cell", button ? "memory-cell-button" : "", `${region}-cell`, selected ? "selected" : "", freed ? "freed" : ""]
    .filter(Boolean)
    .join(" ");
  return `<${tag}${type}${disabled} class="${classes}" ${extra}>
    <span class="cell-name">${name}</span>
    <strong class="cell-value">${value}</strong>
    <span class="cell-address">at ${address}</span>
  </${tag}>`;
}

function clearQuiz() {
  state.quizAnswer = null;
  state.walkthrough[state.lesson] = null;
}

function applyStepState(lesson, index) {
  const steps = walkthroughs[lesson];
  const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
  state.walkthrough[lesson] = safeIndex;
  state.quizAnswer = null;
  steps[safeIndex].apply();
}

function selectStep(index) {
  applyStepState(state.lesson, index);
  render();
}

function setLesson(lesson) {
  if (!lessons[lesson]) return;
  state.lesson = lesson;
  const savedStep = state.walkthrough[lesson];
  applyStepState(lesson, savedStep === null ? 0 : savedStep);
  const url = new URL(window.location.href);
  url.searchParams.set("lesson", lesson);
  window.history.replaceState({}, "", url);
  render();
}

function setArray2dLayout(layout) {
  if (!array2dWalkthroughs[layout]) return;
  state.array2d.layout = layout;
  walkthroughs.array2d = array2dWalkthroughs[layout];
  applyStepState("array2d", 0);
  render();
}

function renderWalkthrough() {
  const steps = walkthroughs[state.lesson];
  const current = state.walkthrough[state.lesson];
  const activeStep = current === null ? null : steps[current];

  elements.stepPosition.textContent = current === null ? "Explore:" : `Step ${current + 1} of ${steps.length}:`;
  elements.stepTitle.textContent = activeStep ? activeStep.label : "custom state";
  elements.stepInstruction.textContent = activeStep
    ? activeStep.instruction
    : "You changed the memory directly. Choose any numbered step to return to the guided walkthrough.";

  elements.stepList.replaceChildren();
  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `step-button${index === current ? " active" : ""}`;
    button.textContent = `${index + 1}. ${step.label}`;
    button.setAttribute("aria-pressed", String(index === current));
    button.addEventListener("click", () => selectStep(index));
    elements.stepList.append(button);
  });

  elements.previousStep.disabled = current === null || current === 0;
  elements.nextStep.disabled = false;
  elements.nextStep.textContent = current === null
    ? "Start steps →"
    : current === steps.length - 1 ? "Restart →" : "Next →";
}

function renderHeader() {
  const lesson = lessons[state.lesson];
  elements.lessonKicker.textContent = lesson.kicker;
  elements.lessonTitle.textContent = lesson.title;
  elements.lessonGoal.textContent = lesson.goal;
  elements.tabs.forEach((tab) => {
    const selected = tab.dataset.lesson === state.lesson;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  elements.layoutChoice.hidden = state.lesson !== "array2d";
  elements.layoutButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.getAttribute("data-2d-layout") === state.array2d.layout));
  });
}

function renderPointer() {
  const pointer = state.pointer;
  const targetAddress = pointer.target === "x" ? addresses.x : pointer.target === "y" ? addresses.y : null;
  const guidedStep = state.walkthrough.pointer;
  const activeLine = guidedStep === null
    ? pointer.target === "null" ? 2 : pointer.lastAction === "write" ? pointer.target === "x" ? 4 : 6 : pointer.target === "x" ? 3 : 5
    : [2, 3, 4, 5, 6][guidedStep];

  renderCode([
    "int x = 10;",
    "int y = 20;",
    "int* p = nullptr;",
    "p = &x;",
    "*p = 30;",
    "p = &y;",
    "*p = 40;"
  ], activeLine);

  elements.controls.replaceChildren();
  const pointGroup = makeControlGroup("Point p to");
  [
    ["x", "&x"],
    ["y", "&y"],
    ["null", "nullptr"]
  ].forEach(([target, label]) => {
    pointGroup.append(makeButton(label, {
      pressed: pointer.target === target,
      onClick: () => {
        pointer.target = target;
        pointer.lastAction = "point";
        clearQuiz();
        render();
      }
    }));
  });

  const writeGroup = makeControlGroup("Write through *p");
  const input = document.createElement("input");
  input.className = "number-input";
  input.type = "number";
  input.value = String(pointer.writeValue);
  input.setAttribute("aria-label", "Value to write through p");
  input.addEventListener("input", () => {
    pointer.writeValue = Number(input.value);
  });
  writeGroup.append(input);
  writeGroup.append(makeButton("Run *p = value", {
    className: "button primary",
    disabled: pointer.target === "null",
    onClick: () => {
      if (pointer.target === "x") pointer.x = pointer.writeValue;
      if (pointer.target === "y") pointer.y = pointer.writeValue;
      pointer.lastAction = "write";
      clearQuiz();
      render();
    }
  }));
  elements.controls.append(pointGroup, writeGroup);

  const hop = targetAddress === null
    ? '<div class="pointer-hop null-hop"><strong>stores nullptr</strong><span aria-hidden="true">&times;</span><small>no pointee</small></div>'
    : `<div class="pointer-hop"><strong>stores ${hex(targetAddress)}</strong><span aria-hidden="true">&rarr;</span><small>dereference follows this address</small></div>`;

  elements.memoryStage.innerHTML = `<div class="memory-flow pointer-flow">
    <div class="memory-region">
      <p class="region-label">Stack: pointer p</p>
      ${cellMarkup({ name: "p", value: targetAddress === null ? "nullptr" : hex(targetAddress), address: hex(addresses.pointer), region: "stack" })}
    </div>
    ${hop}
    <div class="memory-region">
      <p class="region-label">Stack: integer values</p>
      <div class="variable-stack">
        ${cellMarkup({ name: "x", value: pointer.x, address: hex(addresses.x), region: "stack", selected: pointer.target === "x" })}
        ${cellMarkup({ name: "y", value: pointer.y, address: hex(addresses.y), region: "stack", selected: pointer.target === "y" })}
      </div>
    </div>
  </div>`;

  if (targetAddress === null) {
    elements.stateBadge.textContent = "No pointee";
    elements.stateBadge.className = "state-badge warning";
    elements.activeExpression.textContent = "p == nullptr";
    elements.traceMessage.innerHTML = "The value stored in <code>p</code> is not an address of an object. Dereferencing <code>*p</code> would be undefined behavior.";
  } else {
    elements.stateBadge.textContent = "Valid pointer";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = `*p is ${pointer.target}`;
    elements.traceMessage.innerHTML = `<code>p</code> stores ${hex(targetAddress)}. Follow that address to <code>${pointer.target}</code>; <code>*p</code> is another way to access the value ${pointer.target === "x" ? pointer.x : pointer.y}.`;
  }

  const choices = targetAddress === null
    ? [
        { label: "nullptr (no object address)", correct: true },
        { label: hex(addresses.pointer), correct: false },
        { label: "0", correct: false }
      ]
    : [
        { label: `${pointer.target === "x" ? pointer.x : pointer.y} (the pointee's value)`, correct: false },
        { label: `${hex(targetAddress)} (the pointee's address)`, correct: true },
        { label: `${hex(addresses.pointer)} (p's own address)`, correct: false }
      ];
  renderQuiz("What value is stored inside the pointer variable p?", choices, "A pointer stores its pointee's address. The pointer variable also has a separate address of its own.");
}

function renderArray1d() {
  const array = state.array1d;
  const values = Array.from({ length: array.size }, (_, index) => index * index);
  const guidedStep = state.walkthrough.array1d;
  const guidedActiveLines = [0, 2, 4, 5, 6];
  const activeLine = guidedStep === null
    ? array.allocated
      ? array.initialized ? array.selected >= 0 ? 4 : 2 : 0
      : array.nulled ? 6 : 5
    : guidedActiveLines[guidedStep];

  renderCode([
    `int* arr = new int[${array.size}];`,
    `for (int i = 0; i < ${array.size}; ++i) {`,
    "  arr[i] = i * i;",
    "}",
    "cout << arr[2];",
    "delete[] arr;",
    "arr = nullptr;"
  ], activeLine);

  elements.controls.replaceChildren();

  const cells = values.map((value, index) => cellMarkup({
    name: `arr[${index}]`,
    value: array.allocated ? array.initialized ? value : "?" : "freed",
    address: hex(addresses.array + index * 4),
    selected: array.allocated && array.initialized && index === array.selected,
    freed: !array.allocated,
    button: true,
    extra: `data-array-index="${index}" aria-label="Array index ${index}, address ${hex(addresses.array + index * 4)}"`
  })).join("");

  elements.memoryStage.innerHTML = `<div class="memory-flow array-flow">
    <div class="memory-region">
      <p class="region-label">Stack: array pointer</p>
      ${cellMarkup({ name: "arr", value: array.nulled ? "nullptr" : hex(addresses.array), address: hex(addresses.arrayPointer), region: "stack", freed: !array.allocated && !array.nulled })}
    </div>
    <div class="pointer-hop${array.allocated ? "" : " null-hop"}">
      <strong>${array.nulled ? "nullptr" : array.allocated && array.selected >= 0 ? `arr[${array.selected}]` : array.allocated ? "arr → first cell" : "old address"}</strong>
      <span aria-hidden="true">&rarr;</span>
      <small>${array.allocated ? array.selected >= 0 ? `select index ${array.selected}` : "one allocation" : array.nulled ? "no array" : "dangling pointer"}</small>
    </div>
    <div class="memory-region">
      <p class="region-label">Heap: contiguous int array</p>
      <div class="heap-grid one-d-grid${array.allocated ? "" : " freed-block"}" style="--cols:${array.size}">${cells}</div>
    </div>
  </div>`;

  elements.memoryStage.querySelectorAll("[data-array-index]").forEach((cell) => {
    cell.addEventListener("click", () => {
      array.selected = Number(cell.dataset.arrayIndex);
      clearQuiz();
      render();
    });
  });

  if (array.allocated) {
    elements.stateBadge.textContent = array.initialized
      ? array.selected >= 0 ? `Read arr[${array.selected}]` : "Initialized"
      : "Allocated · values unset";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = array.selected >= 0 ? `arr[${array.selected}]` : "arr";
    elements.traceMessage.innerHTML = array.selected >= 0
      ? `<code>arr[${array.selected}]</code> reads value ${values[array.selected]} at ${hex(addresses.array + array.selected * 4)}.`
      : `<code>arr</code> stores the first element address ${hex(addresses.array)}.`;
  } else if (array.nulled) {
    elements.stateBadge.textContent = "Released safely";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = "arr == nullptr";
    elements.traceMessage.innerHTML = "The heap block was released and the array pointer was cleared.";
  } else {
    elements.stateBadge.textContent = "Dangling pointer";
    elements.stateBadge.className = "state-badge warning";
    elements.activeExpression.textContent = "delete[] arr";
    elements.traceMessage.innerHTML = `<code>delete[]</code> destroyed the whole array, but <code>arr</code> still contains its old address.`;
  }
}

function cleanupLabel2d() {
  const grid = state.array2d;
  if (grid.layout === "contiguous") {
    return ["Run delete[] data", "Set data to nullptr", "Cleanup complete"][Math.min(grid.cleanupStep, 2)];
  }
  return ["Delete row 0", "Delete row 1", "Delete pointer table", "Set dyn to nullptr", "Cleanup complete"][Math.min(grid.cleanupStep, 4)];
}

function renderArray2d() {
  const grid = state.array2d;
  const index = grid.selectedRow * grid.cols + grid.selectedCol;
  const isContiguous = grid.layout === "contiguous";
  const cleanupComplete = isContiguous ? grid.cleanupStep >= 2 : grid.cleanupStep >= 4;

  const code = isContiguous
    ? [
        `double* data = new double[${grid.rows} * ${grid.cols}];`,
        `for (size_t r = 0; r < ${grid.rows}; ++r) {`,
        `  for (size_t c = 0; c < ${grid.cols}; ++c)`,
        `    data[r * ${grid.cols} + c] = r * ${grid.cols} + c + 1;`,
        "}",
        `cout << data[1 * ${grid.cols} + 2];`,
        "delete[] data;",
        "data = nullptr;"
      ]
    : [
        `size_t ROWS = ${grid.rows};`,
        `size_t COLS = ${grid.cols};`,
        "double** dyn = new double*[ROWS];",
        "for (size_t r = 0; r < ROWS; r++) {",
        "  dyn[r] = new double[COLS];",
        "  for (size_t c = 0; c < COLS; c++) {",
        "    dyn[r][c] = r * COLS + c + 1;",
        "  }",
        "}",
        "cout << dyn[1][2] << \"\\n\";",
        "for (size_t r = 0; r < ROWS; r++) {",
        "  delete[] dyn[r];",
        "}",
        "delete[] dyn;",
        "dyn = nullptr;"
      ];
  const guidedStep = state.walkthrough.array2d;
  const guidedActiveLines = isContiguous ? [0, 3, 5, 6, 7] : [2, 4, 6, 4, 6, 9, 11, 11, 13, 14];
  const activeIndex = guidedStep === null
    ? isContiguous
      ? grid.cleanupStep === 0 ? grid.selectedRow >= 0 ? 5 : grid.initialized ? 3 : 0 : grid.cleanupStep === 1 ? 6 : 7
      : grid.cleanupStep === 0
        ? grid.selectedRow >= 0 ? 9
          : grid.rowsAllocated === 0 ? 2
            : grid.rowsAllocated === 1 ? grid.rowsInitialized === 0 ? 4 : 6
              : grid.rowsInitialized === 1 ? 4 : 6
        : grid.cleanupStep <= 2 ? 11 : grid.cleanupStep === 3 ? 13 : 14
    : guidedActiveLines[guidedStep];
  renderCode(code, activeIndex);

  elements.controls.replaceChildren();
  const layoutGroup = makeControlGroup("Layout");
  [
    ["contiguous", "One contiguous block"],
    ["pointer", "Pointer-to-pointer"]
  ].forEach(([layout, label]) => {
    layoutGroup.append(makeButton(label, {
      pressed: grid.layout === layout,
      onClick: () => {
        grid.layout = layout;
        grid.cleanupStep = 0;
        clearQuiz();
        render();
      }
    }));
  });

  const cleanupGroup = makeControlGroup("Cleanup");
  cleanupGroup.append(makeButton(cleanupLabel2d(), {
    className: cleanupComplete ? "button" : "button danger",
    disabled: cleanupComplete,
    onClick: () => {
      grid.cleanupStep += 1;
      clearQuiz();
      render();
    }
  }));
  cleanupGroup.append(makeButton("Reset memory", {
    onClick: () => {
      grid.cleanupStep = 0;
      clearQuiz();
      render();
    }
  }));
  elements.controls.append(layoutGroup, cleanupGroup);

  if (isContiguous) {
    renderContiguous2d(grid, index);
  } else {
    renderPointer2d(grid);
  }

  const allocationCount = isContiguous ? 1 : grid.rows + 1;
  const choices = isContiguous
    ? [
        { label: "1 allocation: the data block", correct: true },
        { label: "2 allocations: one per row", correct: false },
        { label: "3 allocations: rows plus a pointer table", correct: false }
      ]
    : [
        { label: "1 allocation: the whole grid", correct: false },
        { label: "2 allocations: one per row", correct: false },
        { label: `${allocationCount} allocations: ${grid.rows} rows + the pointer table`, correct: true }
      ];
  renderQuiz("How many heap allocations must be released for this 2D layout?", choices, isContiguous
    ? "The grid is one allocation, so one delete[] releases it."
    : "Each row is a separate allocation, and the row-pointer table is another allocation. Release the rows first.");
}

function renderContiguous2d(grid, index) {
  const blockFreed = grid.cleanupStep >= 1;
  const pointerNulled = grid.cleanupStep >= 2;
  const showingAccess = grid.selectedRow >= 0 && grid.selectedCol >= 0;
  const cells = Array.from({ length: grid.rows * grid.cols }, (_, cellIndex) => {
    const row = Math.floor(cellIndex / grid.cols);
    const col = cellIndex % grid.cols;
    return cellMarkup({
      name: `[${row}][${col}]`,
      value: blockFreed ? "freed" : grid.initialized ? cellIndex + 1 : "?",
      address: hex(addresses.contiguous + cellIndex * 8),
      selected: !blockFreed && showingAccess && cellIndex === index,
      freed: blockFreed,
      button: true,
      extra: `data-grid-cell="${row},${col}" aria-label="Select row ${row}, column ${col}"`
    });
  }).join("");

  elements.memoryStage.innerHTML = `<div class="memory-flow two-d-flow">
    <div class="memory-region">
      <p class="region-label">Stack: data</p>
      ${cellMarkup({ name: "data", value: pointerNulled ? "nullptr" : hex(addresses.contiguous), address: hex(addresses.contiguousPointer), region: "stack", freed: blockFreed && !pointerNulled })}
    </div>
    <div class="pointer-hop${blockFreed ? " null-hop" : ""}">
      <strong>${showingAccess ? `${grid.selectedRow} &times; ${grid.cols} + ${grid.selectedCol} = ${index}` : "data → first cell"}</strong>
      <span aria-hidden="true">&rarr;</span>
      <small>${showingAccess ? "select one cell" : "one allocation"}</small>
    </div>
    <div class="memory-region">
      <p class="region-label">Heap: contiguous doubles</p>
      <div class="heap-grid${blockFreed ? " freed-block" : ""}" style="--cols:${grid.cols}">${cells}</div>
    </div>
  </div>`;

  attachGridCellEvents();

  if (!blockFreed) {
    elements.stateBadge.textContent = "1 allocation";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = showingAccess ? `data[${grid.selectedRow} * ${grid.cols} + ${grid.selectedCol}]` : "data";
    elements.traceMessage.innerHTML = showingAccess
      ? `The selected cell is at ${hex(addresses.contiguous + index * 8)} and stores ${index + 1}.`
      : `The six cell addresses form one continuous sequence beginning at ${hex(addresses.contiguous)}.`;
  } else if (!pointerNulled) {
    elements.stateBadge.textContent = "Dangling pointer";
    elements.stateBadge.className = "state-badge warning";
    elements.activeExpression.textContent = "delete[] data";
    elements.traceMessage.innerHTML = "One <code>delete[]</code> releases the whole block. The grid is gone, although <code>data</code> still contains its old address until you clear it.";
  } else {
    elements.stateBadge.textContent = "Cleanup complete";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = "data = nullptr";
    elements.traceMessage.innerHTML = "The one heap allocation is released and the pointer no longer stores a stale address.";
  }
}

function renderPointer2d(grid) {
  const tableFreed = grid.cleanupStep >= 3;
  const pointerNulled = grid.cleanupStep >= 4;
  const showingAccess = grid.selectedRow >= 0 && grid.selectedCol >= 0;
  const rowFreed = (row) => grid.cleanupStep >= row + 1;
  const pointerRows = Array.from({ length: grid.rows }, (_, row) => {
    const rowExists = row < grid.rowsAllocated;
    const pointerCell = cellMarkup({
      name: `dyn[${row}]`,
      value: tableFreed ? "freed" : rowExists ? hex(addresses.rows[row]) : "unassigned",
      address: hex(addresses.pointerTable + row * 8),
      freed: tableFreed,
      extra: `data-pointer-entry="${row}"`
    });

    if (!rowExists) {
      return `<div class="pointer-row-link">${pointerCell}</div>`;
    }

    const cells = Array.from({ length: grid.cols }, (_, col) => cellMarkup({
      name: `[${row}][${col}]`,
      value: rowFreed(row) ? "freed" : row < grid.rowsInitialized ? row * grid.cols + col + 1 : "?",
      address: hex(addresses.rows[row] + col * 8),
      selected: !rowFreed(row) && showingAccess && row === grid.selectedRow && col === grid.selectedCol,
      freed: rowFreed(row),
      button: true,
      extra: `data-grid-cell="${row},${col}" aria-label="Select row ${row}, column ${col}"`
    })).join("");
    const selectedRow = showingAccess && row === grid.selectedRow;
    const arrow = `<div class="pointer-hop row-pointer-hop${rowFreed(row) ? " null-hop" : ""}${selectedRow ? " selected-hop" : ""}">
      <strong>${selectedRow ? `2) [${grid.selectedCol}]` : `dyn[${row}]`}</strong>
      <span aria-hidden="true">&rarr;</span>
      <small>${rowFreed(row) ? "row released" : selectedRow ? `inside row ${row}` : `to row ${row}`}</small>
    </div>`;
    const rowBlock = `<div class="row-block${rowFreed(row) ? " freed-block" : ""}" style="--cols:${grid.cols}">${cells}</div>`;
    return `<div class="pointer-row-link">${pointerCell}${arrow}${rowBlock}</div>`;
  }).join("");

  elements.memoryStage.innerHTML = `<div class="memory-flow two-d-flow">
    <div class="memory-region">
      <p class="region-label">Stack: dyn</p>
      ${cellMarkup({ name: "dyn", value: pointerNulled ? "nullptr" : hex(addresses.pointerTable), address: hex(addresses.pointerToPointer), region: "stack", freed: tableFreed && !pointerNulled })}
    </div>
    <div class="pointer-hop${tableFreed ? " null-hop" : ""}">
      <strong>${showingAccess ? `1) dyn[${grid.selectedRow}]` : "dyn"}</strong>
      <span aria-hidden="true">&rarr;</span>
      <small>${showingAccess ? "find row" : "pointer table"}</small>
    </div>
    <div class="memory-region pointer-map">
      <div class="pointer-map-headings" aria-hidden="true">
        <p class="region-label">Heap: pointer table</p>
        <span></span>
        <p class="region-label">Heap: separate rows</p>
      </div>
      <div class="pointer-row-links${tableFreed ? " freed-block" : ""}">${pointerRows}</div>
    </div>
  </div>`;

  attachGridCellEvents();

  if (grid.cleanupStep === 0) {
    elements.stateBadge.textContent = `${grid.rowsAllocated + 1} allocation${grid.rowsAllocated === 0 ? "" : "s"}`;
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = showingAccess ? `dyn[${grid.selectedRow}][${grid.selectedCol}]` : "dyn";
    elements.traceMessage.innerHTML = showingAccess
      ? `dyn[${grid.selectedRow}] stores ${hex(addresses.rows[grid.selectedRow])}; the selected cell is at ${hex(addresses.rows[grid.selectedRow] + grid.selectedCol * 8)}.`
      : `${grid.rowsAllocated} of ${grid.rows} row arrays currently exist.`;
  } else if (!tableFreed) {
    elements.stateBadge.textContent = `${Math.min(grid.cleanupStep, grid.rows)} row${grid.cleanupStep === 1 ? "" : "s"} released`;
    elements.stateBadge.className = "state-badge warning";
    elements.activeExpression.textContent = `delete[] dyn[${grid.cleanupStep - 1}]`;
    elements.traceMessage.innerHTML = "Each row is its own heap allocation. Release every row block before releasing the pointer table that stores their addresses.";
  } else if (!pointerNulled) {
    elements.stateBadge.textContent = "Dangling double pointer";
    elements.stateBadge.className = "state-badge warning";
    elements.activeExpression.textContent = "delete[] dyn";
    elements.traceMessage.innerHTML = "The row blocks and pointer table are gone. The stack variable <code>dyn</code> still contains the old table address until you clear it.";
  } else {
    elements.stateBadge.textContent = "Cleanup complete";
    elements.stateBadge.className = "state-badge";
    elements.activeExpression.textContent = "dyn = nullptr";
    elements.traceMessage.innerHTML = "All row blocks were released first, then the pointer table, and finally the double pointer was cleared.";
  }
}

function attachGridCellEvents() {
  elements.memoryStage.querySelectorAll("[data-grid-cell]").forEach((cell) => {
    cell.addEventListener("click", () => {
      const [row, col] = cell.dataset.gridCell.split(",").map(Number);
      state.array2d.selectedRow = row;
      state.array2d.selectedCol = col;
      clearQuiz();
      render();
    });
  });
}

function renderQuiz(question, choices, explanation) {
  elements.checkQuestion.textContent = question;
  elements.answerOptions.replaceChildren();
  choices.forEach((choice, index) => {
    const selected = state.quizAnswer === index;
    const className = selected ? `choice-button ${choice.correct ? "correct" : "incorrect"}` : "choice-button";
    const button = makeButton(choice.label, {
      className,
      onClick: () => {
        state.quizAnswer = index;
        render();
      }
    });
    if (selected) {
      button.setAttribute("aria-pressed", "true");
    }
    elements.answerOptions.append(button);
  });

  elements.answerFeedback.className = "answer-feedback";
  if (state.quizAnswer === null) {
    elements.answerFeedback.textContent = "Choose an answer, then compare it with the diagram.";
    return;
  }

  const selectedChoice = choices[state.quizAnswer];
  elements.answerFeedback.textContent = `${selectedChoice.correct ? "Correct. " : "Not yet. "}${explanation}`;
  elements.answerFeedback.classList.add(selectedChoice.correct ? "correct" : "incorrect");
}

function render() {
  renderHeader();
  renderWalkthrough();
  if (state.lesson === "pointer") renderPointer();
  if (state.lesson === "array1d") renderArray1d();
  if (state.lesson === "array2d") renderArray2d();
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setLesson(tab.dataset.lesson));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const currentIndex = elements.tabs.indexOf(tab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + elements.tabs.length) % elements.tabs.length;
    elements.tabs[nextIndex].focus();
    setLesson(elements.tabs[nextIndex].dataset.lesson);
  });
});

elements.layoutButtons.forEach((button) => {
  button.addEventListener("click", () => setArray2dLayout(button.getAttribute("data-2d-layout")));
});

elements.previousStep.addEventListener("click", () => {
  const current = state.walkthrough[state.lesson];
  if (current !== null && current > 0) selectStep(current - 1);
});

elements.nextStep.addEventListener("click", () => {
  const steps = walkthroughs[state.lesson];
  const current = state.walkthrough[state.lesson];
  if (current === null || current === steps.length - 1) {
    selectStep(0);
  } else {
    selectStep(current + 1);
  }
});

const requestedLesson = new URL(window.location.href).searchParams.get("lesson");
if (requestedLesson && lessons[requestedLesson]) {
  state.lesson = requestedLesson;
}
applyStepState(state.lesson, 0);
render();
