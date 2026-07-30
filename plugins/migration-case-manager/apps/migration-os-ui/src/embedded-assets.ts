import indexHtml from "../dist/index.html" with { type: "file" };
import appScript from "../dist/assets/app.js" with { type: "file" };
import appStyles from "../dist/assets/app.css" with { type: "file" };

export const embeddedAssets: Record<string, string> = {
  "/": indexHtml,
  "/index.html": indexHtml,
  "/assets/app.js": appScript,
  "/assets/app.css": appStyles
};
