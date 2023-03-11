const STORAGE_KEY = "tab-manager:theme";

export function getTheme() {
  return window.localStorage.getItem(STORAGE_KEY) || "dark";
}

export function setTheme(theme: string) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

// TOOD: move to "head" script
export function initializeTheme() {
  applyTheme(getTheme());
}

function applyTheme(theme: string) {
  disableTransitions(() => {
    const classList = document.documentElement.classList;
    classList.remove("dark", "light");
    classList.add(theme === "dark" ? "dark" : "light");
  });
}

// https://paco.me/writing/disable-theme-transitions
function disableTransitions(callback: () => void) {
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
  callback();
  // force redraw
  if (
    !document.firstElementChild ||
    !window.getComputedStyle(document.firstElementChild).transition
  ) {
    console.debug("disableTransitions:unreachable");
  }
  document.head.removeChild(el);
}
