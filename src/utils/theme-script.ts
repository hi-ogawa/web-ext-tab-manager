// copied from https://github.com/hi-ogawa/unocss-preset-antd/blob/main/packages/app/index.html

export function getTheme() {
  return window.localStorage.getItem("theme") || "system";
}

export function setTheme(theme: string) {
  window.localStorage.setItem("theme", theme);
  applyTheme(theme);
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

// TODO: move to index.html
export function initializeTheme() {
  applyTheme(getTheme());
  prefersDark.addEventListener("change", () => {
    applyTheme(getTheme());
  });
}

function applyTheme(theme: string) {
  const classList = document.documentElement.classList;
  classList.remove("dark", "light");
  if (theme === "system") {
    theme = prefersDark.matches ? "dark" : "light";
  }
  disableTransitions(() => {
    classList.add(theme === "dark" ? "dark" : "light");
  });
}

// https://paco.me/writing/disable-theme-transitions
function disableTransitions(f: () => void) {
  const el = document.createElement("style");
  el.setAttribute("type", "text/css");
  el.appendChild(
    document.createTextNode(`
      * {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }
    `)
  );
  document.head.appendChild(el);
  f();
  if (
    !document.firstElementChild ||
    !window.getComputedStyle(document.firstElementChild).transition
  ) {
    console.debug("disableTransitions:unreachable");
  }
  document.head.removeChild(el);
}
