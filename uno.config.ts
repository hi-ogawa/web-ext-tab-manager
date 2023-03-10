import { antdPreset } from "@hiogawa/unocss-preset-antd";
import {
  dummyPreset,
  dummyPresetIconsRules,
  transformerTypescriptDsl,
} from "@hiogawa/unocss-typescript-dsl";
import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    antdPreset(),
    presetUno(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
      },
    }),
    dummyPreset(),
  ],
  rules: [...dummyPresetIconsRules(["ri"])],
  transformers: [
    transformerTypescriptDsl(),
    transformerDirectives(),
    transformerVariantGroup(),
  ],
});
