import { tinyassert } from "@hiogawa/utils";
import type { StatementKind } from "ast-types/gen/kinds";
import type { API, FileInfo, ImportDeclaration } from "jscodeshift";
import { sortBy } from "lodash";

//
// usage:
//   NODE_OPTIONS='-r esbuild-register' npx jscodeshift --no-babel --parser tsx --transform misc/jscodeshift/isort.ts $(git grep -l . '*.ts' '*.tsx' '*.js' '*.jsx')
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
    const groups: [boolean, StatementKind[]][] = groupNeighborBy(
      statements,
      (stmt) =>
        stmt.type === "ImportDeclaration" &&
        !stmt.comments?.some((c) => c.value.includes("isort-ignore"))
    );

    for (const group of groups) {
      if (!group[0]) {
        continue;
      }
      tinyassert(group[1].every((stmt) => j.ImportDeclaration.check(stmt)));
      group[1] = sortImportDeclarations(group[1] as ImportDeclaration[]);
    }

    return groups.map((group) => group[1]).flat();
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

function groupNeighborBy<T, K>(ls: T[], f: (x: T) => K): [K, T[]][] {
  if (ls.length === 0) {
    return [];
  }
  const first = ls.shift() as T;
  const groups: [K, T[]][] = [[f(first), [first]]];
  for (const x of ls) {
    const y = f(x);
    if (y === groups.at(-1)![0]) {
      groups.at(-1)![1].push(x);
    } else {
      groups.push([y, [x]]);
    }
  }
  return groups;
}
