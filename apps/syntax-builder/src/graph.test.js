import {topologicalGenerations} from 'graphology-dag';
import { DirectedGraph } from 'graphology';
import { allSimplePaths } from 'graphology-simple-path';


const paths = [
  ["CCCT",
    "AACG",
    "TATG",
    "ATCC",
    "GCTG",
    "TACA",
    "GAGT",
    "CCGA",
    "CGCT",
    "CCCT",],
  [
    "TATG",
    "TTCT",
    "ATCC",
  ],
  [
    "ATCC",
    "TGGC",
    "GCTG",
    "CCGA",
    "CAAT",
    "CCCT",
  ],
]

function openCycleAtNode(graph, cutNode) {
  const inEdges = graph.inEdges(cutNode);
  for (const edge of inEdges) {
    graph.dropEdge(edge);
  }
}


function pathsToGraph(paths) {
  const graph = new DirectedGraph();
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      graph.addNode(`${path[i]}-${path[i + 1]}`);
    }
  }
  graph.forEachNode((node) => {
    const [left, right] = node.split('-');
    graph.forEachNode((node2) => {
      if (node2.startsWith(right)) {
        graph.mergeEdge(node, node2);
      }
      if (node2.endsWith(left)) {
        graph.mergeEdge(node2, node);
      }
    });
  });
  return graph;
}

function dagToMSA(graph) {
  const generations = topologicalGenerations(graph);
  
  // Create a map from node to column index
  const nodeToColumn = new Map();
  generations.forEach((gen, colIndex) => {
    gen.forEach(node => {
      nodeToColumn.set(node, colIndex);
    });
  });
  
  // Find source nodes (no incoming edges) and sink nodes (no outgoing edges)
  const sources = graph.nodes().filter(n => graph.inDegree(n) === 0);
  const sinks = graph.nodes().filter(n => graph.outDegree(n) === 0);
  
  // Get all paths from any source to any sink
  const allPathsInGraph = [];
  for (const source of sources) {
    for (const sink of sinks) {
      const pathsFound = allSimplePaths(graph, source, sink);
      allPathsInGraph.push(...pathsFound);
    }
  }
  
  // Convert paths to MSA rows
  const numColumns = generations.length;
  const msa = allPathsInGraph.map(path => {
    const row = new Array(numColumns).fill('---------');
    for (const node of path) {
      const col = nodeToColumn.get(node);
      row[col] = node;
    }
    return row;
  });
  
  return msa;
}

// Check if two columns have independent variation (all combinations exist)
// vs correlated variation (one determines the other)
function areColumnsIndependent(msa, col1, col2) {
  const uniqueCol1 = new Set(msa.map(row => row[col1]));
  const uniqueCol2 = new Set(msa.map(row => row[col2]));
  const uniquePairs = new Set(msa.map(row => `${row[col1]}|||${row[col2]}`));
  
  // If columns are correlated, # of pairs ≈ max(unique in col1, unique in col2)
  // If columns are independent, # of pairs = unique1 × unique2
  // We consider them independent if pairs > max (meaning not perfectly correlated)
  const maxSingle = Math.max(uniqueCol1.size, uniqueCol2.size);
  
  return uniquePairs.size > maxSingle;
}

function getIndependentSegments(msa) {
  if (msa.length === 0) return [];
  
  const numCols = msa[0].length;
  
  // Find which columns are "stable" (all rows have same value)
  const isStable = [];
  for (let col = 0; col < numCols; col++) {
    const values = new Set(msa.map(row => row[col]));
    isStable[col] = values.size === 1;
  }
  
  // Find segment boundaries: where columns become independent
  // A boundary exists between col i and col i+1 if:
  // 1. One is stable and the other is not, OR
  // 2. Both are variable but independent of each other
  const boundaries = [0]; // Always start at 0
  
  for (let col = 0; col < numCols - 1; col++) {
    const bothStable = isStable[col] && isStable[col + 1];
    const bothVariable = !isStable[col] && !isStable[col + 1];
    
    if (bothStable) {
      // No boundary within stable region
      continue;
    } else if (bothVariable) {
      // Check if they're independent
      if (areColumnsIndependent(msa, col, col + 1)) {
        boundaries.push(col + 1);
      }
    } else {
      // One stable, one variable - boundary
      boundaries.push(col + 1);
    }
  }
  boundaries.push(numCols); // End boundary
  
  // Create segments from boundaries
  const segments = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1] - 1;
    const stable = isStable[start]; // All cols in segment have same stability
    
    const alternatives = new Set();
    for (const row of msa) {
      const slice = row.slice(start, end + 1).join(' | ');
      alternatives.add(slice);
    }
    
    segments.push({
      start,
      end,
      stable,
      segIndex: i,
      alternatives: Array.from(alternatives)
    });
  }
  
  return segments;
}

// Find minimum set of rows that covers all unique alternatives
function minimumCoveringRows(msa) {
  if (msa.length === 0) return [];
  
  const segments = getIndependentSegments(msa);
  const variableSegments = segments.filter(s => !s.stable);
  
  if (variableSegments.length === 0) {
    // All columns are stable, just return first row
    return [msa[0]];
  }
  
  // Build a set of all (segmentIndex, alternative) pairs that need to be covered
  const allAlternatives = new Set();
  for (const seg of variableSegments) {
    for (const alt of seg.alternatives) {
      allAlternatives.add(`${seg.segIndex}:${alt}`);
    }
  }
  
  // For each row, compute which alternatives it covers
  const rowCoverage = msa.map((row, rowIndex) => {
    const covered = new Set();
    for (const seg of variableSegments) {
      const slice = row.slice(seg.start, seg.end + 1).join(' | ');
      covered.add(`${seg.segIndex}:${slice}`);
    }
    return { rowIndex, row, covered };
  });
  
  // Greedy set cover: pick rows that cover the most uncovered alternatives
  const selectedRows = [];
  const coveredSoFar = new Set();
  
  while (coveredSoFar.size < allAlternatives.size) {
    // Find the row that covers the most new alternatives
    let bestRow = null;
    let bestNewCount = 0;
    
    for (const rc of rowCoverage) {
      const newCovered = [...rc.covered].filter(a => !coveredSoFar.has(a));
      if (newCovered.length > bestNewCount) {
        bestNewCount = newCovered.length;
        bestRow = rc;
      }
    }
    
    if (!bestRow || bestNewCount === 0) break;
    
    selectedRows.push(bestRow.row);
    for (const a of bestRow.covered) {
      coveredSoFar.add(a);
    }
  }
  
  return selectedRows;
}

const graph = pathsToGraph(paths);
openCycleAtNode(graph, 'CCCT-AACG');

console.log('Topological generations:');
console.log(topologicalGenerations(graph));

console.log('\nAll paths (MSA):');
const msa = dagToMSA(graph);
msa.forEach((row) => {
  console.log(row.join(' | '));
});

console.log('\n--- Independent segments ---');
const segments = getIndependentSegments(msa);
for (const seg of segments) {
  if (seg.stable) {
    console.log(`[Cols ${seg.start}-${seg.end}] STABLE: ${seg.alternatives[0]}`);
  } else {
    console.log(`[Cols ${seg.start}-${seg.end}] ${seg.alternatives.length} alternatives:`);
    seg.alternatives.forEach((alt, i) => console.log(`  ${i + 1}. ${alt}`));
  }
}

console.log('\n--- Minimum covering rows ---');
const minRows = minimumCoveringRows(msa);
minRows.forEach((row) => {
  console.log(row.join(' | '));
});

console.log(`\nReduced from ${msa.length} paths to ${minRows.length} representative rows`);
