export function getRandomColor() {
  const colors = [
    "#4bc0c0",
    "#e6d800",
    "#9b19f5",
    "#ffa300",
    "#dc0ab4",
    "#b3d4ff",
    "#00bfa0",
    "#e60049",
    "#0bb4ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomFoodColor() {
  const colors = [
    "#2662D9",
    "#2EB88A",
    "#E23670",
    "#E88C30",
    "#AF57DB",

    "#2A9D90",
    "#E76E50",
    "#274754",
    "#E8C468",
    "#F4A462",
    "#4bc0c0",
    "#e6d800",
    "#9b19f5",
    "#ffa300",
    "#dc0ab4",
    "#b3d4ff",
    "#00bfa0",
    "#e60049",
    "#0bb4ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomName() {
  const names = [
    "Slithery",
    "Wiggles",
    "Noodle",
    "Viper",
    "Cobra",
    "Python",
    "Mamba",
    "Fang",
    "Scales",
    "Hissy",
  ];
  return names[Math.floor(Math.random() * names.length)];
}
