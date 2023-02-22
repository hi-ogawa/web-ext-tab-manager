import { EXTENSION_URL, test } from "./helper";
import EXAMPLE_EXPORT_JSON from "../misc/data/example-export.json";
import { expect } from "@playwright/test";

// TODO: test popup

test("options page", async ({ page }) => {
  // open "options" page
  await page.goto(EXTENSION_URL + "/options/index.html");

  //
  // import example data
  //

  // - open modal
  await page.getByRole("button", { name: "Import | Export" }).click();

  // - fill input and submit
  await page
    .getByPlaceholder("Please input exported data")
    .fill(JSON.stringify(EXAMPLE_EXPORT_JSON, null, 2));
  await page.getByRole("button", { name: "Import", exact: true }).click();

  // - wait for success message
  await page.waitForSelector(".testid-toaster >> 'Successfuly imported data'");

  // - dismiss modal
  await page.keyboard.press("Escape");

  //
  // click item and open new tab
  //
  await expect(page.getByTestId("tab-group-item-count").nth(1)).toHaveText(
    "2 tabs"
  );
  const newPagePromise = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "hi-ogawa/web-ext-tab-manager", exact: true })
    .click();
  {
    // check url of new tab
    const page = await newPagePromise;
    await expect(page).toHaveURL(
      "https://github.com/hi-ogawa/web-ext-tab-manager"
    );
    await page.close();
  }
  await expect(page.getByTestId("tab-group-item-count").nth(1)).toHaveText(
    "1 tab"
  );
});
