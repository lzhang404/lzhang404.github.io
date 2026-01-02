const bagTree = {
  id: "bag-root",
  label: "[]",
  annotation: "currBag []",
  children: [
    {
      id: "bag-b",
      label: "[B]",
      annotation: "remaining {A,G}",
      children: [
        {
          id: "bag-ba",
          label: "[B,A]",
          annotation: "remaining {G}",
          children: [
            { id: "bag-bag", label: "BAG", annotation: "full permutation" }
          ],
        },
        {
          id: "bag-bg",
          label: "[B,G]",
          annotation: "remaining {A}",
          children: [
            { id: "bag-bga", label: "BGA", annotation: "full permutation" }
          ],
        },
      ],
    },
    {
      id: "bag-a",
      label: "[A]",
      annotation: "remaining {B,G}",
      children: [
        {
          id: "bag-ab",
          label: "[A,B]",
          annotation: "remaining {G}",
          children: [
            { id: "bag-abg", label: "ABG", annotation: "full permutation" }
          ],
        },
        {
          id: "bag-ag",
          label: "[A,G]",
          annotation: "remaining {B}",
          children: [
            { id: "bag-agb", label: "AGB", annotation: "full permutation" }
          ],
        },
      ],
    },
    {
      id: "bag-g",
      label: "[G]",
      annotation: "remaining {A,B}",
      children: [
        {
          id: "bag-ga",
          label: "[G,A]",
          annotation: "remaining {B}",
          children: [
            { id: "bag-gab", label: "GAB", annotation: "full permutation" }
          ],
        },
        {
          id: "bag-gb",
          label: "[G,B]",
          annotation: "remaining {A}",
          children: [
            { id: "bag-gba", label: "GBA", annotation: "full permutation" }
          ],
        },
      ],
    },
  ],
};

const travelTree = {
  id: "trip-root",
  label: "Start",
  annotation: "currPath []",
  children: [
    {
      id: "trip-nyc",
      label: "NYC",
      annotation: "need {SFO, DEN}",
      children: [
        {
          id: "trip-nyc-sfo",
          label: "NYC→SFO",
          annotation: "need {DEN}",
          children: [
            { id: "trip-nyc-sfo-den", label: "NYC→SFO→DEN", annotation: "route complete" }
          ],
        },
        {
          id: "trip-nyc-den",
          label: "NYC→DEN",
          annotation: "need {SFO}",
          children: [
            { id: "trip-nyc-den-sfo", label: "NYC→DEN→SFO", annotation: "route complete" }
          ],
        },
      ],
    },
    {
      id: "trip-sfo",
      label: "SFO",
      annotation: "need {NYC, DEN}",
      children: [
        {
          id: "trip-sfo-nyc",
          label: "SFO→NYC",
          annotation: "need {DEN}",
          children: [
            { id: "trip-sfo-nyc-den", label: "SFO→NYC→DEN", annotation: "route complete" }
          ],
        },
        {
          id: "trip-sfo-den",
          label: "SFO→DEN",
          annotation: "need {NYC}",
          children: [
            { id: "trip-sfo-den-nyc", label: "SFO→DEN→NYC", annotation: "route complete" }
          ],
        },
      ],
    },
    {
      id: "trip-den",
      label: "DEN",
      annotation: "need {NYC, SFO}",
      children: [
        {
          id: "trip-den-nyc",
          label: "DEN→NYC",
          annotation: "need {SFO}",
          children: [
            { id: "trip-den-nyc-sfo", label: "DEN→NYC→SFO", annotation: "route complete" }
          ],
        },
        {
          id: "trip-den-sfo",
          label: "DEN→SFO",
          annotation: "need {NYC}",
          children: [
            { id: "trip-den-sfo-nyc", label: "DEN→SFO→NYC", annotation: "route complete" }
          ],
        },
      ],
    },
  ],
};

export const examples = [
  {
    id: "shopping",
    title: "Shopping bag permutations",
    description:
      "Backtracking reuses the same bag as we permute the letters B, A, and G into every order.",
    note:
      "Undoing the pick simply pops the last letter off currBag and restores it to the remaining items list.",
    tree: bagTree,
    steps: [
      {
        title: "Make choice",
        detail: "Make choice: put B into currBag.",
        highlight: {
          current: "bag-b",
          visited: ["bag-root"],
          edgeActive: ["bag-root-bag-b"],
        },
      },
      {
        title: "Explore",
        detail: "Explore: recursive call to fill the rest, producing BAG on this branch.",
        highlight: {
          current: "bag-bag",
          visited: ["bag-root", "bag-b", "bag-ba"],
          edgePath: ["bag-root-bag-b", "bag-b-bag-ba", "bag-ba-bag-bag"],
        },
      },
      {
        title: "Undo",
        detail: "Undo: remove G from currBag, restore it to remainingItems, and try BG next.",
        highlight: {
          current: "bag-b",
          visited: ["bag-root", "bag-b"],
          target: ["bag-bg"],
          edgePath: ["bag-root-bag-b"],
          edgeActive: ["bag-b-bag-bg"],
        },
      },
    ],
  },
  {
    id: "travel",
    title: "Travel paths between cities",
    description:
      "Each node represents a partial itinerary through NYC, SFO, and DEN. Backtracking reuses the same currPath array.",
    note:
      "The most recent city is popped off before visiting the next option, so needToVisit always stays accurate.",
    tree: travelTree,
    steps: [
      {
        title: "Make choice",
        detail: "Make choice: visit a new city by pushing NYC into currPath.",
        highlight: {
          current: "trip-nyc",
          visited: ["trip-root"],
          edgeActive: ["trip-root-trip-nyc"],
        },
      },
      {
        title: "Explore",
        detail: "Explore: recursive call that commits to NYC→SFO→DEN as one possible route.",
        highlight: {
          current: "trip-nyc-sfo-den",
          visited: ["trip-root", "trip-nyc", "trip-nyc-sfo"],
          edgePath: [
            "trip-root-trip-nyc",
            "trip-nyc-trip-nyc-sfo",
            "trip-nyc-sfo-trip-nyc-sfo-den",
          ],
        },
      },
      {
        title: "Undo",
        detail:
          "Undo: remove DEN from currPath, restore it to needToVisit, and backtrack to try NYC→DEN next.",
        highlight: {
          current: "trip-nyc",
          visited: ["trip-root", "trip-nyc"],
          target: ["trip-nyc-den"],
          edgePath: ["trip-root-trip-nyc"],
          edgeActive: ["trip-nyc-trip-nyc-den"],
        },
      },
    ],
  },
];
