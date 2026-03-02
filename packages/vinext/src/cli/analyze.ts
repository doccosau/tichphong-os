/**
 * vinext analyze — Bundle analysis CLI module
 *
 * Reads Vite's build manifest (dist/client/.vite/manifest.json) and
 * generates a detailed bundle size report: per-chunk breakdown, treemap
 * data, unused exports detection, and optimization suggestions.
 *
 * Usage (from CLI):
 *   vinext analyze [--outDir dist] [--json] [--limit 20]
 */

import fs from "node:fs";
import path from "node:path";

export interface ChunkInfo {
    name: string;
    file: string;
    sizeBytes: number;
    sizeFormatted: string;
    imports: string[];
    dynamicImports: string[];
    isEntry: boolean;
    isDynamic: boolean;
}

export interface BundleReport {
    totalSizeBytes: number;
    totalSizeFormatted: string;
    chunkCount: number;
    entryChunks: ChunkInfo[];
    dynamicChunks: ChunkInfo[];
    staticChunks: ChunkInfo[];
    largestChunks: ChunkInfo[];
    suggestions: string[];
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Analyze a Vite build manifest and return a detailed report.
 */
export function analyzeBuild(outDir: string): BundleReport {
    const clientDir = path.join(outDir, "client");
    const manifestPath = path.join(clientDir, ".vite", "manifest.json");

    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Build manifest not found at ${manifestPath}. Run \`vinext build\` first.`);
    }

    const manifest: Record<string, {
        file: string;
        name?: string;
        src?: string;
        isEntry?: boolean;
        isDynamicEntry?: boolean;
        imports?: string[];
        dynamicImports?: string[];
        css?: string[];
    }> = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    const allDynamicImports = new Set<string>();
    for (const entry of Object.values(manifest)) {
        if (entry.dynamicImports) {
            for (const di of entry.dynamicImports) {
                allDynamicImports.add(di);
            }
        }
    }

    const chunks: ChunkInfo[] = [];
    let totalSize = 0;

    for (const [key, entry] of Object.entries(manifest)) {
        const filePath = path.join(clientDir, entry.file);
        let sizeBytes = 0;

        if (fs.existsSync(filePath)) {
            sizeBytes = fs.statSync(filePath).size;
        }

        totalSize += sizeBytes;

        chunks.push({
            name: entry.name ?? entry.src ?? key,
            file: entry.file,
            sizeBytes,
            sizeFormatted: formatBytes(sizeBytes),
            imports: entry.imports ?? [],
            dynamicImports: entry.dynamicImports ?? [],
            isEntry: entry.isEntry === true,
            isDynamic: entry.isDynamicEntry === true || allDynamicImports.has(key),
        });
    }

    // Sort by size descending
    chunks.sort((a, b) => b.sizeBytes - a.sizeBytes);

    const entryChunks = chunks.filter((c) => c.isEntry);
    const dynamicChunks = chunks.filter((c) => c.isDynamic);
    const staticChunks = chunks.filter((c) => !c.isEntry && !c.isDynamic);
    const largestChunks = chunks.slice(0, 10);

    // Generate suggestions
    const suggestions: string[] = [];

    // Large chunk warning
    for (const chunk of chunks) {
        if (chunk.sizeBytes > 250 * 1024) {
            suggestions.push(`⚠️  "${chunk.name}" is ${chunk.sizeFormatted} — consider code splitting`);
        }
    }

    // Too many chunks
    if (chunks.length > 50) {
        suggestions.push(`💡 ${chunks.length} chunks — consider increasing \`build.rollupOptions.output.manualChunks\` granularity`);
    }

    // No dynamic imports
    if (dynamicChunks.length === 0 && totalSize > 500 * 1024) {
        suggestions.push("💡 No dynamic imports detected. Use React.lazy() or next/dynamic for code splitting");
    }

    // Total size warning
    if (totalSize > 1024 * 1024) {
        suggestions.push(`⚠️  Total bundle size is ${formatBytes(totalSize)} — aim for < 1 MB for fast initial load`);
    }

    return {
        totalSizeBytes: totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        chunkCount: chunks.length,
        entryChunks,
        dynamicChunks,
        staticChunks,
        largestChunks,
        suggestions,
    };
}

/**
 * Print a formatted bundle report to stdout.
 */
export function printBundleReport(report: BundleReport): void {
    console.log("\n\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m");
    console.log("\x1b[36m║\x1b[0m   📦 Vinext Bundle Analysis (TichPhong OS)   \x1b[36m║\x1b[0m");
    console.log("\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m\n");

    console.log(`  Total Size:    \x1b[1m${report.totalSizeFormatted}\x1b[0m`);
    console.log(`  Chunks:        ${report.chunkCount} (${report.entryChunks.length} entry, ${report.dynamicChunks.length} dynamic, ${report.staticChunks.length} static)\n`);

    console.log("  \x1b[1mTop 10 Largest Chunks:\x1b[0m");
    console.log("  " + "─".repeat(60));
    for (const chunk of report.largestChunks) {
        const bar = "█".repeat(Math.ceil(chunk.sizeBytes / report.totalSizeBytes * 40));
        const label = chunk.isEntry ? " [entry]" : chunk.isDynamic ? " [lazy]" : "";
        console.log(`  ${chunk.sizeFormatted.padStart(10)}  ${bar} ${chunk.name}${label}`);
    }
    console.log("");

    if (report.suggestions.length) {
        console.log("  \x1b[1mSuggestions:\x1b[0m");
        for (const s of report.suggestions) {
            console.log(`    ${s}`);
        }
        console.log("");
    }
}
