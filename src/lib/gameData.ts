export function getRandomColor() {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F033FF",
    "#FF33F0",
    "#33FFF0",
    "#F0FF33",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomFoodColor() {
  const colors = [
    "#FFD700",
    "#FF6347",
    "#7FFF00",
    "#00FFFF",
    "#FF00FF",
    "#FFFF00",
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
