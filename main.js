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
let diminish_button;
let floatingText;
let splat_placed;

let three_camera_setup_position;
let three_camera_setup_rotation;

// AR variables
let xrRefSpace;
let ARButton;

let scale;
let movement_scale;
let initial_z;
let initial_y;

// three-js variables
let three_renderer;
let three_scene;
let three_camera;

// gsplat-js variables
let splat_renderer;
let splat_scene;
let splat_camera;
let splat_object;
let splat_raycaster;

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
    splat_camera.data.fx =  2232 / 4;
    splat_camera.data.fy =  2232 / 4;
    splat_camera.data.near =  0.01;
    splat_camera.data.far =  50;
    splat_camera._position = new SPLAT.Vector3(0, -1.8, 0);

    splat_raycaster = new SPLAT.Raycaster(splat_renderer, false);

    ARButton = document.getElementById("ArButton");
    canvas = document.createElement('div');
    document.body.appendChild( canvas );
    canvas.appendChild( three_renderer.domElement );
    diminish_button = document.getElementById("diminish")
    floatingText = document.getElementById('floatingText');
    splat_placed = false;

    three_camera_setup_position = new THREE.Vector3();
    three_camera_setup_rotation = new THREE.Quaternion();
    
    scale = 1;
    movement_scale = 2;
    initial_z = 0;
    initial_y = 1.8*2; //-15
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


function updateLoadingProgress(progress) {
    var loadingProgressElement = document.getElementById('loadingProgress');

    loadingProgressElement.textContent = `Lädt... ${progress}%`;

    if (progress >= 100) {
        loadingProgressElement.style.display = 'none';
    }
}

function DiminishView() {
    var selectedSplat = splat_raycaster.testCameraViewFrustum(splat_camera);
    if (selectedSplat !== null){
        console.log("found: " + selectedSplat.length)
        splat_object.splats.forEach(async singleSplat => {
            singleSplat.Render(false);
        })
        selectedSplat.forEach(singleSplat => {
            singleSplat.Render(true)
        });
        splat_object.updateRenderingOfSplats();
    }
}

function showHint() {
    floatingText.style.display = 'block';
}

function hideHint() {
    floatingText.style.display = 'none';
}

function handleTouchOrClick() {
    console.log('Bildschirm wurde berührt oder geklickt!');
    hideHint();
    document.removeEventListener('touchstart', handleTouchOrClick);
    document.removeEventListener('click', handleTouchOrClick);

    three_camera_setup_position = three_camera.position.clone();
    three_camera_setup_rotation = three_camera.quaternion.clone();
    
    splat_placed = true;
}

/*
 * =================================================================================================
 *  Section: AR
 * =================================================================================================
 *      
 */

function AR()
{
    // when entering AR show no splats at the beginning
    showHint();
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.ChangeColor(new SPLAT.Vector4(singleSplat.Color[0], singleSplat.Color[1], singleSplat.Color[2], 25));
    })
    splat_object.updateRenderingOfSplats();

    document.addEventListener('touchstart', handleTouchOrClick, { once: true });
    document.addEventListener('click', handleTouchOrClick, { once: true });
    
    var currentSession = null;

    if( currentSession == null )
    {
        let options = {
            requiredFeatures: ['dom-overlay', 'hit-test'],
            domOverlay: { root: document.body },
        };
        var sessionInit = getXRSessionInit( 'immersive-ar', {
            mode: 'immersive-ar',
            referenceSpaceType: 'local', // 'local', 'local-floor'
            sessionInit: options
        });

        navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
    } else {
        currentSession.end();
    }

    three_renderer.xr.addEventListener('sessionstart', function(ev) {
        console.log('sessionstart', ev);
    });
    three_renderer.xr.addEventListener('sessionend', function(ev) {
        console.log('sessionend', ev);
    });

    function onSessionStarted( session ) {
        session.addEventListener( 'end', onSessionEnded );
        three_renderer.xr.setSession( session );
        ARButton.style.display = 'none';
        ARButton.textContent = 'EXIT AR';
        currentSession = session;
        session.requestReferenceSpace('local').then((refSpace) => {
            xrRefSpace = refSpace;
            session.requestAnimationFrame(onXRFrame);
        });
    }
    function onSessionEnded( /*event*/ ) {
        currentSession.removeEventListener( 'end', onSessionEnded );
        three_renderer.xr.setSession( null );
        ARButton.textContent = 'ENTER AR' ;
        currentSession = null;
    }
}

function getXRSessionInit(mode, options) {
    if ( options && options.referenceSpaceType ) {
        three_renderer.xr.setReferenceSpaceType( options.referenceSpaceType );
    }
    var space = (options || {}).referenceSpaceType || 'local-floor';
    var sessionInit = (options && options.sessionInit) || {};

    // Nothing to do for default features.
    if ( space == 'viewer' )
        return sessionInit;
    if ( space == 'local' && mode.startsWith('immersive' ) )
        return sessionInit;

    // If the user already specified the space as an optional or required feature, don't do anything.
    if ( sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space) )
        return sessionInit;
    if ( sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space) )
        return sessionInit;

    var newInit = Object.assign( {}, sessionInit );
    newInit.requiredFeatures = [ space ];
    if ( sessionInit.requiredFeatures ) {
        newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
    }
    return newInit;
}

function onXRFrame(t, frame) {

    const session = frame.session;
    session.requestAnimationFrame(onXRFrame);
    const referenceSpace = three_renderer.xr.getReferenceSpace();

    const baseLayer = session.renderState.baseLayer;
    const pose = frame.getViewerPose(xrRefSpace);

    three_renderer.render( three_scene, three_camera );
    if(splat_placed) {
        let deltaPosition = three_camera.position - three_camera_setup_position;
        let deltaRotation =  three_camera.quaternion.multiply(three_camera_setup_rotation.invert());
        
        splat_camera._position.x = scale*movement_scale*deltaPosition.x;
        splat_camera._position.y = -scale*movement_scale*deltaPosition.y-initial_y;
        splat_camera._position.z = -scale*movement_scale*deltaPosition.z-initial_z;

        splat_camera._rotation = splat_camera._rotation.multiply(new SPLAT.Quaternion(three_camera.quaternion.x, three_camera.quaternion.y, three_camera.quaternion.z, three_camera.quaternion.w))
        // splat_camera._rotation.x = three_camera.quaternion.x;
        // splat_camera._rotation.y = -three_camera.quaternion.y;
        // splat_camera._rotation.z = -three_camera.quaternion.z;
        // splat_camera._rotation.w = three_camera.quaternion.w;   
    }
}


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

window.addEventListener("resize", onWindowResize)
ARButton.addEventListener( 'click',function (event) {
    event.stopPropagation();
    AR();
})
diminish_button.addEventListener( 'click', x => DiminishView() )