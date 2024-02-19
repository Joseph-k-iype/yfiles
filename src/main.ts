import './assets/icons/icons.css'
import './style.css'
import './dialog.css'
import {
  GraphComponent,
  GraphViewerInputMode,
  ICommand,
  ScrollBarVisibility,
  IEdgeStyle,
  ShapeNodeStyle,
  DefaultLabelStyle,
  Size,
  Rect,
  Point,
  Insets,
  IEnumerable,
  HierarchicLayout,
  LayoutExecutor
} from 'yfiles'
import { enableFolding } from './lib/FoldingSupport'
import loadGraph from './lib/loadGraph'
import './lib/yFilesLicense'
import { initializeGraphOverview } from './graph-overview'
import { initializeTooltips } from './tooltips'
import { enableGraphML } from './graph-io'
import { initializeContextMenu } from './context-menu'
import { initializeGraphSearch } from './graph-search'

let graphComponent: GraphComponent;

async function run() {
  graphComponent = await initializeGraphComponent();
  initializeToolbar(graphComponent);
  initializeGraphOverview(graphComponent);
  initializeTooltips(graphComponent);
  initializeContextMenu(graphComponent);
  initializeGraphSearch(graphComponent);
  enableGraphML(graphComponent);
}

async function initializeGraphComponent(): Promise<GraphComponent> {
  const graphComponent = new GraphComponent(
    document.querySelector('.graph-component-container')!
  );
  graphComponent.horizontalScrollBarPolicy = ScrollBarVisibility.AS_NEEDED_DYNAMIC;
  graphComponent.verticalScrollBarPolicy = ScrollBarVisibility.AS_NEEDED_DYNAMIC;
  const mode = new GraphViewerInputMode();
  mode.navigationInputMode.allowCollapseGroup = true;
  mode.navigationInputMode.allowEnterGroup = true;
  mode.navigationInputMode.allowExitGroup = true;
  mode.navigationInputMode.allowExpandGroup = true;
  graphComponent.inputMode = mode;
  graphComponent.graph = enableFolding(await loadGraph());
  graphComponent.fitGraphBounds();
  return graphComponent;
}

function initializeToolbar(graphComponent: GraphComponent) {
  document.getElementById('btn-increase-zoom')!.addEventListener('click', () => {
    ICommand.INCREASE_ZOOM.execute(null, graphComponent);
  });
  document.getElementById('btn-decrease-zoom')!.addEventListener('click', () => {
    ICommand.DECREASE_ZOOM.execute(null, graphComponent);
  });
  document.getElementById('btn-fit-graph')!.addEventListener('click', () => {
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent);
  });
  document.getElementById('btn-open')!.addEventListener('click', () => {
    ICommand.OPEN.execute(null, graphComponent);
  });
  document.getElementById('btn-save')!.addEventListener('click', () => {
    ICommand.SAVE.execute(null, graphComponent);
  });
}

function processInputs() {
  const nodesInput = JSON.parse(document.getElementById('nodesInput').value);
  const edgesInput = JSON.parse(document.getElementById('edgesInput').value);
  const groupsInput = JSON.parse(document.getElementById('groupsInput').value);

  const graph = graphComponent.graph;
  graph.clear();

  const nodesMap = new Map();

  nodesInput.forEach(nodeData => {
    const createdNode = graph.createNode({ labels: [nodeData.label] });
    nodesMap.set(nodeData.id, createdNode);
  });

  edgesInput.forEach(edgeData => {
    const sourceNode = nodesMap.get(edgeData.source);
    const targetNode = nodesMap.get(edgeData.target);
    if (sourceNode && targetNode) {
      const edge = graph.createEdge(sourceNode, targetNode);
      if (edgeData.label) {
        graph.addLabel(edge, edgeData.label);
      }
    }
  });

  groupsInput.forEach(groupData => {
    const groupNode = graph.createGroupNode();
    const childNodes = groupData.nodes.map(nodeId => nodesMap.get(nodeId)).filter(node => node);
    if (childNodes.length > 0) {
      graph.groupNodes(groupNode, IEnumerable.from(childNodes));
    }
    if (groupData.label) {
      graph.addLabel(groupNode, groupData.label);
    }
  });

  // Apply a hierarchic layout to visualize the graph nicely
  const layout = new HierarchicLayout();
  const layoutExecutor = new LayoutExecutor({
    graphComponent: graphComponent,
    layout: layout
  });
  layoutExecutor.start();
}

window.processInputs = processInputs;

document.addEventListener('DOMContentLoaded', run);
