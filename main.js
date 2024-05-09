import * as SPLAT from '@jonascholz/gaussian-splatting'
import * as THREE from 'three'

/*
 * =================================================================================================
 *  Section: Configuration
 * =================================================================================================
 *      In this section, important variables and constants for the entire program are defined. This
 *      includes setting global settings, constants used across different modules, and key variables
 *      that control the application behavior throughout its runtime.
 */

// loading from base path
let basePath;

if (window.location.hostname === "localhost") {
    basePath = "./DimSplat/public/";
} else {
    basePath = "./";
}

// general variables
let canvas;

// three-js variables
let three_renderer;
let three_scene;
let three_camera;

// gsplat-js variables
let splat_renderer;
let splat_scene;
let splat_camera;
let splat_object;


/*
 * =================================================================================================
 *  Section: Initialize
 * =================================================================================================
 *      In this section, the initialization is carried out. The Three.js scene for the AR content 
 *      and the SPLAT scene for displaying the Gaussian splats are initially configured."
 */
function init() {
    // three
    three_camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 50 );
    three_scene = new THREE.Scene();
    three_renderer = new THREE.WebGLRenderer({antialias: true, alpha: true });
    three_renderer.setPixelRatio( window.devicePixelRatio );
    three_renderer.setSize( window.innerWidth, window.innerHeight );
    three_renderer.xr.enabled = true;

    
    
    // gaussian splatting
    splat_renderer = new SPLAT.WebGLRenderer();
    splat_renderer.backgroundColor = new SPLAT.Color32(0, 0, 0, 0);
    splat_renderer.setSize(window.innerWidth, window.innerHeight);
    
    splat_scene = new SPLAT.Scene();
    splat_camera = new SPLAT.Camera();
    splat_camera._position = new SPLAT.Vector3(0, -1.8, 0);


    canvas = document.createElement('div');
    document.body.appendChild( canvas );
    canvas.appendChild( three_renderer.domElement );
}

/*
 * =================================================================================================
 *  Section: Utilities
 * =================================================================================================
 *      In this section, utility functions that support the main functionality of the program are 
 *      defined and maintained.
 */
function onWindowResize() {
    splat_renderer.setSize(window.innerWidth, window.innerHeight);
    splat_renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize)

function updateLoadingProgress(progress) {
    var loadingProgressElement = document.getElementById('loadingProgress');

    loadingProgressElement.textContent = `Lädt... ${progress}%`;

    if (progress >= 100) {
        loadingProgressElement.style.display = 'none';
    }
}

document.getElementById("ArButton").addEventListener( 'click',x=> console.log("Enter AR")) //AR() )

/*
 * =================================================================================================
 *  Section: Main Execution
 * =================================================================================================
 *      In this section, the core program logic is executed. This includes invoking the previously
 *      defined functions and managing the flow of the application.
 */
async function main()
{
    const url = `${basePath}splats/edit_living_room.splat`;
    splat_object = await SPLAT.Loader.LoadAsync(url, splat_scene, (progress) => (updateLoadingProgress(Math.round(progress * 100))));

    const frame = () => {
        splat_renderer.render(splat_scene, splat_camera);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}


init();
main();