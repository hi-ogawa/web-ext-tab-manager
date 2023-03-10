import React from "react";
import { getTheme, setTheme } from "../utils/theme-script";

export function ThemeSelect() {
  const [theme, setTheme] = useThemeState();
  return (
    <button
      className="flex items-center antd-btn antd-btn-ghost"
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      <span className="!w-5 !h-5 light:i-ri-sun-line dark:i-ri-moon-line"></span>
    </button>
  );
}

function useThemeState() {
  const [state, setState] = React.useState(getTheme);

  function setStateWrapper(state: string) {
    setState(state);
    setTheme(state);
  }

  return [state, setStateWrapper] as const;
}
