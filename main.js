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
    splat_camera.data.near =  0.03;
    splat_camera.data.far =  100;
    splat_camera._position = new SPLAT.Vector3(0, -1.8, 0);


    ARButton = document.getElementById("ArButton");
    canvas = document.createElement('div');
    document.body.appendChild( canvas );
    canvas.appendChild( three_renderer.domElement );

    scale = 1;
    movement_scale = 2;
    initial_z = 0;
    initial_y = 0; //-15
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


/*
 * =================================================================================================
 *  Section: AR
 * =================================================================================================
 *      
 */

function AR()
{
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

    // if ( hitTestSourceRequested === false ) {
    //
    //     session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
    //
    //         session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
    //
    //             hitTestSource = source;
    //         } );
    //     } );
    //
    //     session.addEventListener( 'end', function () {
    //
    //         hitTestSourceRequested = false;
    //         hitTestSource = null;
    //
    //     } );
    //
    //     hitTestSourceRequested = true;
    // }

    // if ( hitTestSource && searchforhit ) {
    //
    //     const hitTestResults = frame.getHitTestResults( hitTestSource );
    //
    //     if ( hitTestResults.length ) {
    //
    //         const hit = hitTestResults[ 0 ];
    //
    //         reticle.visible = true;
    //         reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
    //
    //     } else {
    //
    //         reticle.visible = false;
    //
    //     }
    // }

    const baseLayer = session.renderState.baseLayer;
    const pose = frame.getViewerPose(xrRefSpace);

    three_renderer.render( three_scene, three_camera );
    splat_camera._position.x = scale*movement_scale*three_camera.position.x;
    splat_camera._position.y = -scale*movement_scale*three_camera.position.y;
    splat_camera._position.z = -scale*movement_scale*three_camera.position.z-initial_z;

    // let x_position = scale*movement_scale*tcamera.position.x;
    // let y_position = -scale*movement_scale*tcamera.position.y;
    // let z_position = scale*movement_scale*tcamera.position.z-initial_z;
    //
    // let translation = new SPLAT.Vector3(x_position, y_position, z_position);
    // camera.position = camera.position.add(translation);

    splat_camera._rotation.x = three_camera.quaternion.x;
    splat_camera._rotation.y = -three_camera.quaternion.y;
    splat_camera._rotation.z = -three_camera.quaternion.z;
    splat_camera._rotation.w = three_camera.quaternion.w;
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
ARButton.addEventListener( 'click',x=> AR() )