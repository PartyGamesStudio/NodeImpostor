const supportedLanguages = {
  de: () => import("./de/index.js")
};

function resolveLanguage() {
  const langAttr = document.documentElement.getAttribute("lang") || "de";
  const [primary] = langAttr.split("-");
  return (primary || "de").toLowerCase();
}

const language = resolveLanguage();
const loader = supportedLanguages[language] || supportedLanguages.de;

const modulePromise = loader().catch((error) => {
  console.warn(`Falling back to German word list because "${language}" failed to load.`, error);
  if (loader !== supportedLanguages.de) {
    return supportedLanguages.de();
  }
  return { default: [] };
});

const wordPoolPromise = modulePromise.then((module) => {
  const words = module?.default;
  if (!Array.isArray(words)) {
    return [];
  }
  window.wordPool = words;
  return words;
});

export default wordPoolPromise;
export { wordPoolPromise };
