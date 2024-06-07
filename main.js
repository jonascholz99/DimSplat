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

// general variables
let canvas;
let diminish_button_scene;
let diminish_button_frustum;
let floatingText;
let splat_placed;

let three_camera_setup_position;
let three_camera_setup_rotation;

let first_frame;
let first_frame_splat;
let loaderOverlay;

const ButtonFunction = {
    NONE: 'none',
    AR: 'ar',
    MASK1: 'mask1'
}
let multifunctionalButton;
let multifunctionalButtonFunction = ButtonFunction.NONE;

// AR variables
let xrRefSpace;

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

    multifunctionalButton = document.getElementById("multifunctionalButton");
    multifunctionalButton.addEventListener('click', handleMultifunctionalButtonClick);
    canvas = document.getElementById('diminish-scene');
    canvas.appendChild( three_renderer.domElement );
    diminish_button_scene = document.getElementById("diminish-scene-button")
    diminish_button_frustum = document.getElementById("diminish-frustum-button")
    floatingText = document.getElementById('floatingText');
    loaderOverlay = document.getElementById('loader-overlay');
    splat_placed = false;

    three_camera_setup_position = new THREE.Vector3();
    three_camera_setup_rotation = new THREE.Quaternion();

    first_frame = true;
    first_frame_splat = true;
    
    scale = 1;
    movement_scale = 2;
    initial_z = 0;
    initial_y = 1.8*2; //-15
}

/*
 * =================================================================================================
 *  Section: Explanation
 * =================================================================================================
 *      
 */
let explanationCanvas;

let videos;
let currentExplanationIndex;

let videoSource;
let videoElement;
let textElement;

let explanationButton;

function initExplanationController() {
    currentExplanationIndex = 0;

    explanationButton = document.getElementById('nextButton');
    explanationButton.addEventListener('click', handleExplanationButtonClicked);
    
    explanationCanvas = document.getElementById('card')
    videoSource = document.getElementById('videoSource');
    videoElement = document.getElementById('video');
    textElement = document.getElementById('text');
    
    videos  = [
        {
            url: "./videos/video_keep upright.mp4",
            text: "Bitte achte darauf, dein Handy während dem platzieren immer aufrecht zu halten"
        },
        {
            url: "./videos/video_move.mp4",
            text: "Bewege das Handy umher und versuche das transparente Bild möglichst Deckungsleich mit der realen Szene zu bringen. "
        },
        {
            url: "./videos/video_back and forth.mp4",
            text: "Bewge dich auch nach vorne und Hinten um die Position so gut es geht zu treffen."
        },
        {
            url: "./videos/video_place.mp4",
            text: "Wenn du zufreiden bist, dann drücke den Button um die Szene zu platzieren. Das Erlebnis kann gleich starten"
        },
        {
            url: "./videos/video_select.mp4",
            text: "Um nun gleich ein Objekt verschwinden zu lassen, müssen wir erstmal wissen wo es im Raum liegt. Schaue das Objekt dafür mit der Kamera an. Markiere es indem du zweimal auf den Bildschirm klickst. \n Gehe dann auf die Seite des Objekts und markiere es erneut"
        }
    ];
    
    // set start values
    videoSource.src = videos[currentExplanationIndex].url;
    textElement.innerHTML = `<p>${videos[currentExplanationIndex].text}</p>`;
}

function handleExplanationButtonClicked(event) {
    if(currentExplanationIndex === 3) {
        hideExplanationWindow();
        multifunctionalButtonFunction = ButtonFunction.AR;
        multifunctionalButton.textContent = "Enter AR";
        multifunctionalButton.style.bottom = '30px';
    } else {
        nextExplanation();   
    }
}

function showExplanationWindow() {
    explanationCanvas.style.display = 'inline';
    videoElement.load();
}

function hideExplanationWindow() {
    explanationCanvas.style.display = 'none';
}

function setExplanationIndex(number) {
    currentExplanationIndex = number;
}

function nextExplanation() {
    currentExplanationIndex++;

    if (currentExplanationIndex < videos.length) {
        videoSource.src = videos[currentExplanationIndex].url;
        videoElement.load();
        textElement.innerHTML = `<p>${videos[currentExplanationIndex].text}</p>`;
    } else {
        hideExplanationWindow();
    }
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

function handleMultifunctionalButtonClick(event) {
    event.stopPropagation();
    if(multifunctionalButtonFunction === ButtonFunction.AR) {
        AR();
    } else if(multifunctionalButtonFunction === ButtonFunction.MASK1) {
        console.log("Mask 1");
    }

    multifunctionalButton.style.bottom = '-100px';
    multifunctionalButton.textContent = "NONE"
    multifunctionalButtonFunction = ButtonFunction.NONE;
}
function DiminishScene() {
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.Rendered = 1;
    })
    splat_object.updateRenderingOfSplats();
}

function DiminishFrustum() {
    var selectedSplat = splat_raycaster.testCameraViewFrustum(splat_camera);
    if (selectedSplat !== null){
        console.log("found: " + selectedSplat.length)
        selectedSplat.forEach(singleSplat => {
            singleSplat.Rendered = 1;
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

    // show diminish buttons
    diminish_button_scene.style.display = 'block';
    diminish_button_frustum.style.display = 'block';
    
    document.removeEventListener('touchstart', handleTouchOrClick);
    document.removeEventListener('click', handleTouchOrClick);

    // set transparency back to normal
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.ResetColor();
    })
    
    // render none
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.Rendered = 0;
    })
    splat_object.updateRenderingOfSplats();
    
    three_camera_setup_position = three_camera.position.clone();
    three_camera_setup_rotation = three_camera.quaternion.clone();
    console.log("three_camera_setup_position: (" + three_camera_setup_position.x + ", " + three_camera_setup_position.y + ", " + three_camera_setup_position.z + ")")
    splat_placed = true;
}

/*
 * =================================================================================================
 *  Section: AR
 * =================================================================================================
 *      This section will provide all functionality for AR and DR experience
 */

function AR()
{
    // when entering AR show no splats at the beginning
    showHint();
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.Color = new Uint8Array([singleSplat.Color[0], singleSplat.Color[1], singleSplat.Color[2], 25]);
    })
    splat_object.applyRendering();

    // document.addEventListener('touchstart', handleTouchOrClick, { once: true });
    // document.addEventListener('click', handleTouchOrClick, { once: true });
    
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

        try {
            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );            
        } catch (e) {
            console.error("Starting AR Session is not possible (" + e + ")")
        }
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
        
        currentSession = session;
        session.requestReferenceSpace('local').then((refSpace) => {
            xrRefSpace = refSpace;
            session.requestAnimationFrame(onXRFrame);
        });
    }
    function onSessionEnded( /*event*/ ) {
        currentSession.removeEventListener( 'end', onSessionEnded );
        three_renderer.xr.setSession( null );
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
        let deltaPosition = three_camera.position.clone().sub(three_camera_setup_position);
        let deltaRotation = three_camera.quaternion.clone().multiply(three_camera_setup_rotation.clone().invert());
        
        splat_camera._position.x = scale*movement_scale*deltaPosition.x;
        splat_camera._position.y = -scale*movement_scale*deltaPosition.y-initial_y;
        splat_camera._position.z = -scale*movement_scale*deltaPosition.z-initial_z;
        
        // rotation needs to be changed
        splat_camera._rotation.x = three_camera.quaternion.x;
        splat_camera._rotation.y = -three_camera.quaternion.y;
        splat_camera._rotation.z = -three_camera.quaternion.z;
        splat_camera._rotation.w = three_camera.quaternion.w;
    }

    if(first_frame) {
        first_frame = false;
        console.log("firstFrame");
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
    const url = `./splats/zw1027_4.splat`;
    console.log("path: " + url)
    splat_object = await SPLAT.Loader.LoadAsync(url, splat_scene);

    const frame = () => {
        splat_renderer.render(splat_scene, splat_camera);
        requestAnimationFrame(frame);
        
        if(first_frame_splat) {
            first_frame_splat = false;
            showExplanationWindow();
            loaderOverlay.style.display = 'none';
        }
    };

    requestAnimationFrame(frame);
}


init();
initExplanationController();
main();

window.addEventListener("resize", onWindowResize)
diminish_button_scene.addEventListener( 'click', x => DiminishScene() )
diminish_button_frustum.addEventListener( 'click', x => DiminishFrustum() )