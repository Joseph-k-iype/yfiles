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
  DefaultLabelStyle,
  ShapeNodeStyle, Size,
  InteriorLabelModel, InteriorLabelModelPosition,
  GroupNodeStyle,
  FoldingManager,
  IFoldingView,
  IRenderContext,
  SvgVisual,
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
const groupColors = {}; // Store group colors

async function run() {
  graphComponent = await initializeGraphComponent();
  initializeToolbar(graphComponent);
  initializeGraphOverview(graphComponent);
  initializeTooltips(graphComponent);
  initializeContextMenu(graphComponent);
  initializeGraphSearch(graphComponent);
  enableGraphML(graphComponent);
  document.addEventListener('DOMContentLoaded', () => {
    processInputs();
  });
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

class FolderGroupNodeStyle extends GroupNodeStyle {
  constructor(fillColor) {
    super();
    this.fillColor = fillColor;
  }
    createVisual(context, groupNode) {
      // Creates a visual representation of the group node with a folder-like appearance
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const groupSize = groupNode.layout.toSize();
  
      // Create the folder tab shape
      const tabHeight = 20;
      const tab = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tab.setAttribute('fill', '#90C3D4'); // Tab color
      tab.setAttribute('x', '0');
      tab.setAttribute('y', '0');
      tab.setAttribute('width', groupSize.width.toString());
      tab.setAttribute('height', tabHeight.toString());
      g.appendChild(tab);
  
      // Create the main folder rectangle
      const folder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      folder.setAttribute('fill', '#D2E5E9'); // Folder color
      folder.setAttribute('x', '0');
      folder.setAttribute('y', tabHeight.toString());
      folder.setAttribute('width', groupSize.width.toString());
      folder.setAttribute('height', (groupSize.height - tabHeight).toString());
      g.appendChild(folder);
  

      const button = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      button.setAttribute('cx', (groupNode.layout.width - 10).toString());
      button.setAttribute('cy', '10');
      button.setAttribute('r', '5');
      button.setAttribute('fill', 'lightgrey');
      button.setAttribute('stroke', 'black');
      button.style.cursor = 'pointer'; // Change cursor to pointer on hover
      g.appendChild(button);
  
      // Store reference to the groupNode in the button DOM element
      button['data-groupNode'] = groupNode;
  
      // Add click listener to the button
      button.addEventListener('click', (event) => {
        const btn = event.target;
        const gn = btn['data-groupNode'];
        const foldedGraph = graphComponent.graph.foldingView.manager.masterGraph;
  
        if (foldedGraph.isGroupNode(gn)) {
          if (foldedGraph.isCollapsed(gn)) {
            foldedGraph.expandGroup(gn);
          } else {
            foldedGraph.collapseGroup(gn);
          }
          graphComponent.invalidate();
        }
      });


      return new SvgVisual(g);
    }
  }
    // You can add additional properties if needed


  


function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getColorForGroup(groupId) {
  if (!groupColors[groupId]) {
    groupColors[groupId] = getRandomColor();
  }
  return groupColors[groupId];
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
    const estimatedSize = new Size(50, 20); // Simplified for demo
    const layoutRect = new Rect(Math.random() * 400, Math.random() * 400, estimatedSize.width, estimatedSize.height);
    const createdNode = graph.createNode({
      layout: layoutRect,
      style: new ShapeNodeStyle({ fill: getColorForGroup(nodeData.groupId), stroke: 'black', shape: 'rectangle' }),
      tag: nodeData.id
    });
    graph.addLabel(createdNode, nodeData.label);
  });

  edgesInput.forEach(edgeData => {
    const sourceNode = graph.nodes.find(node => node.tag === edgeData.source);
    const targetNode = graph.nodes.find(node => node.tag === edgeData.target);
    if (sourceNode && targetNode) {
      graph.createEdge(sourceNode, targetNode);
    }
  });

  if (groupsInput) {
    groupsInput.forEach(groupData => {
      const childNodes = groupData.nodes.map(nodeId => graph.nodes.find(node => node.tag === nodeId)).filter(node => node);

      if (childNodes.length > 0) {
        // Create a FolderGroupNodeStyle instance with the desired color
        const folderGroupNodeStyle = new FolderGroupNodeStyle(getColorForGroup(groupData.id));

        // Create a group node with the custom folder style
        const groupNode = graph.createGroupNode(null, null, folderGroupNodeStyle);

        // Group the child nodes
        graph.groupNodes(groupNode, IEnumerable.from(childNodes));

        // Add the label to the group node at the top right position
        const labelModel = new InteriorLabelModel({ insets: 3 });
        const labelModelParameter = labelModel.createParameter(InteriorLabelModelPosition.NORTH_EAST);
        const labelStyle = new DefaultLabelStyle({
          textFill: 'black',
          backgroundFill: getColorForGroup(groupData.id),
          backgroundStroke: 'none',
          insets: [3, 3, 3, 3], // Small padding around the text
        });

        // Add a label to the group node
        graph.addLabel(groupNode, groupData.label, labelModelParameter, labelStyle);
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
  layoutExecutor.start().catch(console.error);
}

window.processInputs = processInputs;
document.addEventListener('DOMContentLoaded', run);
