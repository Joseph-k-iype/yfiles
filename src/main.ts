import './assets/icons/icons.css';
import './style.css';
import './dialog.css';
import {
  GraphComponent,
  GraphViewerInputMode,
  ICommand,
  ScrollBarVisibility,
  OrganicLayout,
  LayoutExecutor,
  IEnumerable,
  Rect,
  ShapeNodeStyle,
  DefaultLabelStyle,
} from 'yfiles';
import { enableFolding } from './lib/FoldingSupport';
import loadGraph from './lib/loadGraph';
import './lib/yFilesLicense';
import { initializeGraphOverview } from './graph-overview';
import { initializeTooltips } from './tooltips';
import { enableGraphML } from './graph-io';
import { initializeContextMenu } from './context-menu';
import { initializeGraphSearch } from './graph-search';

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
  const graphComponent = new GraphComponent(document.querySelector('.graph-component-container')!);
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
  let groupsInput;
  try {
    groupsInput = JSON.parse(document.getElementById('groupsInput').value);
  } catch (e) {
    groupsInput = null; // Groups input is optional
  }

  const graph = graphComponent.graph;
  graph.clear();

  nodesInput.forEach(nodeData => {
    const layoutRect = new Rect(Math.random() * 400, Math.random() * 400, 30, 20); // Random position and default size
    const createdNode = graph.createNode({ layout: layoutRect, style: new ShapeNodeStyle({ fill: 'lightblue', stroke: 'black' }), tag: nodeData.id });

    graph.addLabel(createdNode, nodeData.label);
  });

  edgesInput.forEach(edgeData => {
    const sourceNode = graph.nodes.find(node => node.tag === edgeData.source);
    const targetNode = graph.nodes.find(node => node.tag === edgeData.target);
    if (sourceNode && targetNode) {
      const edge = graph.createEdge(sourceNode, targetNode);
      graph.addLabel(edge, edgeData.label);
    }
  });

  // if (groupsInput) {
  //   groupsInput.forEach(groupData => {
  //     const childNodes = groupData.nodes.map(nodeId => graph.nodes.find(node => node.tag === nodeId)).filter(node => node);
  //     const groupNode = graph.createGroupNode();
  //     childNodes.forEach(node => graph.groupNodes(groupNode, node));
  //     if (groupData.label) {
  //       graph.addLabel(groupNode, groupData.label);
  //     }
  //   });
  // }

  if (groupsInput) {
    groupsInput.forEach(groupData => {
        const childNodes = groupData.nodes.map(nodeId => graph.nodes.find(node => node.tag === nodeId)).filter(node => node !== undefined);
        if (childNodes.length > 0) {
            const groupNode = graph.createGroupNode();
            // Use IEnumerable.from to correctly pass an IEnumerable<INode>
            graph.groupNodes(groupNode, IEnumerable.from(childNodes));
            if (groupData.label) {
                graph.addLabel(groupNode, groupData.label);
            }
        }
    });
}


  applyLayout();
}

function applyLayout() {
  const layout = new OrganicLayout({
    minimumNodeDistance: 50,
    preferredEdgeLength: 100,
    deterministic: true,
    nodeOverlapsAllowed: false,
    considerNodeLabels: true,
  });
  const layoutExecutor = new LayoutExecutor({
    graphComponent: graphComponent,
    layout: layout,
    duration: '700ms',
  });
  layoutExecutor.start().catch(error => console.error('Layout execution failed:', error));
}

window.processInputs = processInputs;
document.addEventListener('DOMContentLoaded', run);
