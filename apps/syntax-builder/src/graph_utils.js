import { DirectedGraph } from 'graphology';
import { topologicalGenerations } from 'graphology-dag';
import { allSimplePaths } from 'graphology-simple-path';

export const GRAPH_SPACER = '---------';

// Convert overhang paths to a directed graph where nodes are "edges" (e.g., "CCCT-AACG")
export function pathsToGraph(paths) {
  const graph = new DirectedGraph();
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      graph.addNode(`${path[i]}-${path[i + 1]}`);
    }
  }
  // Connect nodes that share an overhang (right of one = left of another)
  graph.forEachNode((node) => {
    const [, right] = node.split('-');
    graph.forEachNode((node2) => {
      if (node !== node2 && node2.startsWith(right + '-')) {
        graph.mergeEdge(node, node2);
      }
    });
  });
  return graph;
}
  
// Break cycles by removing incoming edges to a node
export function openCycleAtNode(graph, cutNode) {
  for (const edge of graph.inEdges(cutNode)) {
    graph.dropEdge(edge);
  }
}
  
// Convert DAG to MSA-like matrix (rows = paths, columns = topological generations)
export function dagToMSA(graph) {
  const generations = topologicalGenerations(graph);
  const nodeToCol = new Map();
  generations.forEach((gen, col) => gen.forEach(node => nodeToCol.set(node, col)));
  
  const sources = graph.nodes().filter(n => graph.inDegree(n) === 0);
  const sinks = graph.nodes().filter(n => graph.outDegree(n) === 0);
  
  const allPaths = sources.flatMap(src => sinks.flatMap(sink => allSimplePaths(graph, src, sink)));
  
  return allPaths.map(path => {
    const row = new Array(generations.length).fill(GRAPH_SPACER);
    path.forEach(node => { row[nodeToCol.get(node)] = node; });
    return row;
  });
}
  
// Find independent segments in the MSA
// Two adjacent columns are in the same segment if they're correlated (vary together)
// They're independent if all combinations of values exist
export function getIndependentSegments(msa) {
  if (msa.length === 0) return [];
  
  const numCols = msa[0].length;
  const uniqueValues = col => new Set(msa.map(row => row[col]));
  const isStable = col => uniqueValues(col).size === 1;
  
  // Check if two columns vary independently
  const areIndependent = (col1, col2) => {
    const pairs = new Set(msa.map(row => `${row[col1]}|${row[col2]}`));
    return pairs.size > Math.max(uniqueValues(col1).size, uniqueValues(col2).size);
  };
  
  // Find segment boundaries
  const boundaries = [0];
  for (let col = 0; col < numCols - 1; col++) {
    const stable1 = isStable(col), stable2 = isStable(col + 1);
    if (stable1 !== stable2 || (!stable1 && !stable2 && areIndependent(col, col + 1))) {
      boundaries.push(col + 1);
    }
  }
  boundaries.push(numCols);
  
  // Build segments
  return boundaries.slice(0, -1).map((start, i) => {
    const end = boundaries[i + 1] - 1;
    const alts = [...new Set(msa.map(row => row.slice(start, end + 1).join(' | ')))];
    return { start, end, stable: isStable(start), alternatives: alts };
  });
}
  
// Find minimum set of rows that covers all unique alternatives (greedy set cover)
export function minimumCoveringRows(msa) {
  if (msa.length === 0) return [];
  
  const segments = getIndependentSegments(msa).filter(s => !s.stable);
  if (segments.length === 0) return [msa[0]];
  
  // All alternatives that need to be covered
  const allAlts = new Set(segments.flatMap((seg, i) => seg.alternatives.map(alt => `${i}:${alt}`)));
  
  // Count non-gap elements in a row (gap is '---------')
  const countElements = row => row.filter(cell => cell !== GRAPH_SPACER).length;

  // What each row covers + element count
  const rowCoverage = msa.map(row => ({
    row,
    elements: countElements(row),
    covered: new Set(segments.map((seg, i) => `${i}:${row.slice(seg.start, seg.end + 1).join(' | ')}`))
  }));
  
  // Greedy: pick rows that cover the most uncovered alternatives
  // When tied, prefer rows with more elements (fewer gaps)
  const selected = [];
  const covered = new Set();
  
  while (covered.size < allAlts.size) {
    const best = rowCoverage.reduce((best, rc) => {
      const newCount = [...rc.covered].filter(a => !covered.has(a)).length;
      // Prefer higher coverage, then more elements as tiebreaker
      if (newCount > best.count) return { rc, count: newCount, elements: rc.elements };
      if (newCount === best.count && rc.elements > best.elements) return { rc, count: newCount, elements: rc.elements };
      return best;
    }, { rc: null, count: 0, elements: -1 });
  
    if (!best.rc) break;
    selected.push(best.rc.row);
    best.rc.covered.forEach(a => covered.add(a));
  }
  
  // Sort by number of elements (most elements first)
  return selected.sort((a, b) => countElements(b) - countElements(a));
}

export function pathToMSA(path) {
  const graph = pathsToGraph(path);
  openCycleAtNode(graph, `${path[0][0]}-${path[0][1]}`);
  return minimumCoveringRows(dagToMSA(graph));
}
