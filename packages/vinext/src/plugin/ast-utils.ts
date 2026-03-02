/**
 * AST parsing utilities for static analysis.
 *
 * Extracted from index.ts to improve maintainability.
 * Uses Vite's parseAst (Rollup/acorn) to safely parse static JS object literals.
 */
import { parseAst } from "vite";

/**
 * Safely parse a static JS object literal string into a plain object.
 * Uses Vite's parseAst (Rollup/acorn) so no code is ever evaluated.
 * Returns null if the expression contains anything dynamic (function calls,
 * template literals, identifiers, computed properties, etc.).
 *
 * Supports: string literals, numeric literals, boolean literals,
 * arrays of the above, and nested object literals.
 */
export function parseStaticObjectLiteral(objectStr: string): Record<string, unknown> | null {
    let ast: ReturnType<typeof parseAst>;
    try {
        // Wrap in parens so the parser treats `{…}` as an expression, not a block
        ast = parseAst(`(${objectStr})`);
    } catch {
        return null;
    }

    // The AST should be: Program > ExpressionStatement > ObjectExpression
    const body = ast.body;
    if (body.length !== 1 || body[0].type !== "ExpressionStatement") return null;

    const expr = body[0].expression;
    if (expr.type !== "ObjectExpression") return null;

    const result = extractStaticValue(expr);
    return result === undefined ? null : (result as Record<string, unknown>);
}

/**
 * Recursively extract a static value from an ESTree AST node.
 * Returns undefined (not null) if the node contains any dynamic expression.
 *
 * Uses `any` for the node parameter because Rollup's internal ESTree types
 * (estree.Expression, estree.ObjectExpression, etc.) aren't re-exported by Vite,
 * and the recursive traversal touches many different node shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractStaticValue(node: any): unknown {
    switch (node.type) {
        case "Literal":
            // String, number, boolean, null
            return node.value;

        case "UnaryExpression":
            // Handle negative numbers: -1, -3.14
            if (node.operator === "-" && node.argument?.type === "Literal" && typeof node.argument.value === "number") {
                return -node.argument.value;
            }
            return undefined;

        case "ArrayExpression": {
            const arr: unknown[] = [];
            for (const elem of node.elements) {
                if (!elem) return undefined; // sparse array
                const val = extractStaticValue(elem);
                if (val === undefined) return undefined;
                arr.push(val);
            }
            return arr;
        }

        case "ObjectExpression": {
            const obj: Record<string, unknown> = {};
            for (const prop of node.properties) {
                if (prop.type !== "Property") return undefined; // SpreadElement etc.
                if (prop.computed) return undefined; // [expr]: val

                // Key can be Identifier (unquoted) or Literal (quoted)
                let key: string;
                if (prop.key.type === "Identifier") {
                    key = prop.key.name;
                } else if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
                    key = prop.key.value;
                } else {
                    return undefined;
                }

                const val = extractStaticValue(prop.value);
                if (val === undefined) return undefined;
                obj[key] = val;
            }
            return obj;
        }

        default:
            // TemplateLiteral, CallExpression, Identifier, etc. — reject
            return undefined;
    }
}
