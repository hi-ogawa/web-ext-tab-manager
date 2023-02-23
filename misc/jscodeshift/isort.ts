import { tinyassert } from "@hiogawa/utils";
import type { StatementKind } from "ast-types/gen/kinds";
import type { API, FileInfo, ImportDeclaration } from "jscodeshift";

// skip transforming node_modules
const { sortBy, range } = require("lodash") as typeof import("lodash");

//
// usage:
//   npx jscodeshift --parser tsx --transform misc/jscodeshift/isort.ts $(git grep -l . '*.ts' '*.tsx')
//

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const $j = j(file.source);

  // sort Program.body array
  const program = $j.find(j.Program).nodes()[0];
  tinyassert(program);
  program.body = sortStatements(program.body);

  // sorty ImportDeclaration.specifiers array
  for (const decl of $j.find(j.ImportDeclaration).nodes()) {
    sortImportSpecifiers(decl);
  }

  return $j.toSource();

  //
  // helper
  //

  function sortStatements(statements: StatementKind[]): StatementKind[] {
    // group neighboring statements
    const groups = groupNeighborBy(
      statements,
      (stmt) => stmt.type === "ImportDeclaration"
    );

    // sort each ImportDeclaration group
    for (const i of range(groups.length)) {
      const group = groups[i]!;
      if (group[0]?.type !== "ImportDeclaration") {
        continue;
      }
      groups[i] = sortImportDeclarations(groups[i] as ImportDeclaration[]);
    }

    // concat groups
    return groups.flat();
  }

  function sortImportDeclarations(
    decls: ImportDeclaration[]
  ): ImportDeclaration[] {
    return sortBy(decls, (decl) => {
      tinyassert(j.StringLiteral.check(decl.source));
      return decl.source.value;
    });
  }

  // mutate
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

//
// utils
//

function groupNeighborBy<T, K>(ls: T[], f: (x: T) => K): T[][] {
  if (ls.length === 0) {
    return [];
  }
  const groups: T[][] = [[ls.shift()!]];
  for (const x of ls) {
    if (f(x) === f(groups.at(-1)![0]!)) {
      groups.at(-1)!.push(x);
    } else {
      groups.push([x]);
    }
  }
  return groups;
}
