const fs = require("fs");
const files = [
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/form.tsx",
  "src/components/ui/navigation-menu.tsx",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/sonner.tsx",
  "src/components/ui/toggle.tsx"
];
const text = "/* eslint-disable react-refresh/only-export-components */\n";

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.startsWith("/* eslint-disable")) {
    fs.writeFileSync(file, text + content);
  }
}
console.log("Prepended eslint-disable comments");
