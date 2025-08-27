export function generateQuestBoardName(seed = "") {
  const left = [
    "Fellowship",
    "Guild",
    "Order",
    "Cabal",
    "Company",
    "Circle",
    "Band",
  ];
  const right = [
    "Focus",
    "Flow",
    "Momentum",
    "Milestones",
    "Endeavor",
    "Progress",
    "Quests",
  ];
  const l = left[Math.floor(Math.random() * left.length)];
  const r = right[Math.floor(Math.random() * right.length)];
  const of = ["of", "of the"][Math.floor(Math.random() * 2)];
  return `The ${l} ${of} ${r}`;
}
