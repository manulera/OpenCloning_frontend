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

const graph = pathsToGraph(paths);
openCycleAtNode(graph, 'CCCT-AACG');

console.log('Topological generations:');
console.log(topologicalGenerations(graph));

console.log('\nMSA-like alignment:');
const msa = dagToMSA(graph);
msa.forEach((row, i) => {
  console.log(row.join(' | '));
});
