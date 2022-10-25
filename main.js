import {IfcViewerAPI } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE
} from 'web-ifc';
import {
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector2,
  DepthTexture,
  WebGLRenderTarget, Material, BufferGeometry, BufferAttribute, Mesh
} from 'three';
import { ClippingEdges } from 'web-ifc-viewer/dist/components/display/clipping-planes/clipping-edges';
import Stats from 'stats.js/src/Stats';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.shadowDropper.darkness = 1.5;

// Set up stats
/*const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.right = '0px';
stats.dom.style.left = 'auto';
viewer.context.stats = stats;*/

viewer.context.ifcCamera.cameraControls

const manager = viewer.IFC.loader.ifcManager;



// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');

viewer.IFC.loader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true,
  COORDINATE_TO_ORIGIN: false
});

viewer.context.renderer.postProduction.active = true;

// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let first = true;
let model;

const loadIfc = async (event) => {

  // tests with glTF
  // const file = event.target.files[0];
  // const url = URL.createObjectURL(file);
  // const result = await viewer.GLTF.exportIfcFileAsGltf({ ifcFileUrl: url });
  //
  // const link = document.createElement('a');
  // link.download = `${file.name}.gltf`;
  // document.body.appendChild(link);
  //
  // for(const levelName in result.gltf) {
  //   const level = result.gltf[levelName];
  //   for(const categoryName in level) {
  //     const category = level[categoryName];
  //     link.href = URL.createObjectURL(category.file);
  //     link.click();
  //   }
  // }
  //
  // link.remove();

  const overlay = document.getElementById('loading-overlay');
  const progressText = document.getElementById('loading-progress');

  overlay.classList.remove('hidden');
  progressText.innerText = `Loading`;

  viewer.IFC.loader.ifcManager.setOnProgress((event) => {
    const percentage = Math.floor((event.loaded * 100) / event.total);
    progressText.innerText = `Loaded ${percentage}%`;
  });

  viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });

  model = await viewer.IFC.loadIfc(event.target.files[0], false);
  // model.material.forEach(mat => mat.side = 2);

  if(first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);


  overlay.classList.add('hidden');

};

const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
inputElement.addEventListener('change', loadIfc, false);

const handleKeyDown = async (event) => {
  if (event.code === 'Delete') {
    viewer.clipper.deletePlane();
    viewer.dimensions.delete();
  } 
  if (event.code === 'Escape') {
    viewer.IFC.selector.unHighlightIfcItems();
  }
  if (event.code === 'KeyC') {
    viewer.context.ifcCamera.toggleProjection();
  }
};

window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
window.onkeydown = handleKeyDown;
window.onclick = async () => {
    const result = await viewer.IFC.selector.pickIfcItem(false);
    if (!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);

    const elem = document.getElementById('side-menu-right');
    elem.innerHTML = `<div> <h2>${props["Name"].value}</h2></div>`
    console.log(props)
    console.log(props["Name"].value);
    

    const modeID = viewer.IFC.getModelID();
       
    var c = await viewer.IFC.loader.ifcManager.getAllItemsOfType(modeID,IFCFURNISHINGELEMENT);
    console.log(c);
    const managr = viewer.IFC.loader.ifcManager;
    const config = {
      modelID: modeID,
      ids: c,
      customID:"stuff"
  };


managr.createSubset(config);
console.log("subsets",viewer.IFC.loader.ifcManager.subsets);

 
var mesh = managr.getSubset(modeID,"stuff");

console.log(mesh);
};

window.ondblclick = async () => {

  if (viewer.clipper.active) {
    viewer.clipper.createPlane();
  } 
};

//Setup UI
const loadButton = createSideMenuButton('./resources/folder-icon.svg');
loadButton.addEventListener('click', () => {
  loadButton.blur();
  inputElement.click();
});

const sectionButton = createSideMenuButton('./resources/section-plane-down.svg');
sectionButton.addEventListener('click', () => {
  sectionButton.blur();
  viewer.clipper.toggle();
});

const dropBoxButton = createSideMenuButton('./resources/dropbox-icon.svg');
dropBoxButton.addEventListener('click', () => {
  dropBoxButton.blur();
  viewer.dropbox.loadDropboxIfc();
});