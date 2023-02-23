import { tinyassert } from "@hiogawa/utils";
import type { API, FileInfo, ImportDeclaration } from "jscodeshift";

// skip transforming node_modules
const { sortBy } = require("lodash") as typeof import("lodash");

//
// usage:
//   npx jscodeshift --parser tsx --transform misc/jscodeshift/isort.ts $(git grep -l . '*.ts' '*.tsx')
//

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const $j = j(file.source);

  // TODO: how split `ImportDeclaration` into sections by continuous lines?
  for (const p of $j.find(j.ImportDeclaration).paths()) {
    const node = p.value;
    sortImportSpecifiers(node);
  }

  return $j.toSource();

  //
  // helper
  //

  // mutates AST
  function sortImportSpecifiers(decl: ImportDeclaration) {
    if (!decl.specifiers) {
      return;
    }
    if (!decl.specifiers.every((node) => j.ImportSpecifier.check(node))) {
      return;
    }
    decl.specifiers = sortBy(decl.specifiers, (node) => {
      tinyassert(j.ImportSpecifier.check(node));
      return node.imported.name;
    });
  }
}
