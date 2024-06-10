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

// control the rendering loops
let should_render_start_loop;
let should_render_XR_loop;

// general variables
const DRState = {
    INTRO: 'intro',
    ENTERED: 'entered',
    PLACED: 'placed'
}
let drState = DRState.INTRO;

let canvas;
let diminish_scene;

let splat_placed;

let three_camera_setup_position;
let three_camera_setup_rotation;

let first_frame;
let first_frame_splat;
let loaderOverlay;

let cullByCube;

const ButtonFunction = {
    NONE: 'none',
    AR: 'ar',
    SCENE: 'scene',
    MASK1: 'mask1',
    MASK2: 'mask2',
    TRANSFORM: 'transform',
    DIMINISH: 'diminish',
    REMASK: 'remask'
}

let buttonWrapper;
let multifunctionalButton;
let helpButton;
let replaceButton;
let multifunctionalButtonFunction = ButtonFunction.NONE;

let boxObject;
let boxFrustum;

let initialCenter;
let initialSize;

let blendSlider, sliderContainer;

// AR variables
let xrRefSpace;
let currentSession;
let frustumCreationActive;

let screenPoints;
let touchPoints1, touchPoints2;
let frustum1, frustum2;

let currentRing1, currentRing2;

let transparency_threshold;
let blend_value;

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
    canvas = document.getElementById("canvas");

    should_render_start_loop = true;
    should_render_XR_loop = true;
    
    // three
    three_camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 50 );
    three_scene = new THREE.Scene();
    three_renderer = new THREE.WebGLRenderer({antialias: true, alpha: true });
    three_renderer.setPixelRatio( window.devicePixelRatio );
    three_renderer.setSize( window.innerWidth, window.innerHeight );
    three_renderer.xr.enabled = true;

    
    
    // gaussian splatting
    splat_renderer = new SPLAT.WebGLRenderer(canvas);
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

    document.getElementById('x-position').oninput = function() { updateValue('x-position-value', this.value);};
    document.getElementById('y-position').oninput = function() { updateValue('y-position-value', this.value);};
    document.getElementById('z-position').oninput = function() { updateValue('z-position-value', this.value);};
    document.getElementById('x-scaling').oninput = function() { updateValue('x-scaling-value', this.value);};
    document.getElementById('y-scaling').oninput = function() { updateValue('y-scaling-value', this.value);};
    document.getElementById('z-scaling').oninput = function() { updateValue('z-scaling-value', this.value);};

    sliderContainer = document.getElementById('slider-container'); 
    blendSlider = document.getElementById('blendSlider');
    blendSlider.addEventListener('input', onBlendSliderTouched);
    
    buttonWrapper = document.getElementById('buttonWrapper');
    
    replaceButton = document.getElementById("replaceButton");
    replaceButton.addEventListener('click', handleReplaceButtonClick);
    hideReplaceButton();
    
    helpButton = document.getElementById("help-button");
    helpButton.addEventListener('click', handleHelpButtonClick);
    
    multifunctionalButton = document.getElementById("multifunctionalButton");
    multifunctionalButton.addEventListener('click', handleMultifunctionalButtonClick);
    diminish_scene = document.getElementById('diminish-scene');
    diminish_scene.appendChild( three_renderer.domElement );
    
    loaderOverlay = document.getElementById('loader-overlay');
    splat_placed = false;

    three_camera_setup_position = new THREE.Vector3();
    three_camera_setup_rotation = new THREE.Quaternion();

    first_frame = true;
    first_frame_splat = true;

    frustumCreationActive = false;
    cullByCube = false
    touchPoints1 = [];
    touchPoints2 = [];
    frustum1 = null;
    frustum2 = null;

    transparency_threshold = 1.5;
    blend_value = 1;
    
    boxObject = null;
    boxFrustum = new SPLAT.Frustum();
    
    currentRing1 = null;
    currentRing2 = null;
    
    scale = 1;
    movement_scale = 2;
    initial_z = 0;
    initial_y = 1.8; //-15

    currentSession = null;
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
    videoElement.load();
    textElement.innerHTML = `<p>${videos[currentExplanationIndex].text}</p>`;
}

function handleExplanationButtonClicked(event) {
    if(drState === DRState.INTRO) {
        if(currentExplanationIndex === 0) {
            hideExplanationWindow();
            
            multifunctionalButtonFunction = ButtonFunction.AR;
            UpdateMultifunctionalButtonState();

            showHelpButton();
            return;
        }
    } else if (drState === DRState.ENTERED) {
        if(currentExplanationIndex === 3) {
            hideExplanationWindow();
            
            multifunctionalButtonFunction = ButtonFunction.SCENE;
            UpdateMultifunctionalButtonState();

            showHelpButton();
            
            return;
        }
    } else if(drState === DRState.PLACED) {
        if(currentExplanationIndex === 4) {
            hideExplanationWindow();
            
            console.log("Hier")
            multifunctionalButtonFunction = ButtonFunction.MASK1;
            UpdateMultifunctionalButtonState();

            showHelpButton();
            
            return;
        }
    } 
    
    nextExplanation();
}

function showExplanationWindow() {
    hideHelpButton();
    
    explanationCanvas.style.display = 'inline';
    videoElement.load();
}

function hideExplanationWindow() {
    explanationCanvas.style.display = 'none';
}

function setExplanationIndex(number) {
    currentExplanationIndex = number;
    
    if (currentExplanationIndex < videos.length) {
        videoSource.src = videos[currentExplanationIndex].url;
        videoElement.load();
        textElement.innerHTML = `<p>${videos[currentExplanationIndex].text}</p>`;
    } else {
        hideExplanationWindow();
    }
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

function showBlendSlider() {
    sliderContainer.style.right = '10px';
}

function hideBlendSlider() {
    sliderContainer.style.right = '-50px';
}

function onBlendSliderTouched() {
    blend_value = blendSlider.value;
}

function ShowControlPanel() {
    document.getElementById("control-panel").classList.add('show');
}

function HideControlPanel() {
    document.getElementById("control-panel").classList.remove('show');
}

function updateValue(id, value) {
    document.getElementById(id).textContent = value;
    updateCube();
}

function updateCube() {
    const xPosition = parseFloat(document.getElementById('x-position').value);
    const yPosition = parseFloat(document.getElementById('y-position').value);
    const zPosition = parseFloat(document.getElementById('z-position').value);

    const xScaling = parseFloat(document.getElementById('x-scaling').value);
    const yScaling = parseFloat(document.getElementById('y-scaling').value);
    const zScaling = parseFloat(document.getElementById('z-scaling').value);
    
    boxObject.ereaseBox(splat_renderer);

    const newCenter = initialCenter.add(new SPLAT.Vector3(xPosition, yPosition, zPosition));
    const newSize = new SPLAT.Vector3(initialSize.x * xScaling, initialSize.y * yScaling, initialSize.z * zScaling);

    const halfSize = newSize.divide(2);
    const newMin = newCenter.subtract(halfSize);
    const newMax = newCenter.add(halfSize);

    boxObject.min = newMin;
    boxObject.max = newMax;

    boxObject.drawBox(splat_renderer)
}

function showReplaceButton() {
    replaceButton.style.display = 'block';
}

function hideReplaceButton() {
    replaceButton.style.display = 'none';
}

function handleReplaceButtonClick() {
    location.reload()
    
    // AR();
    // drState = DRState.ENTERED;
    // setExplanationIndex(1);
    //
    // cullByCube = false;
    // boxObject = null;
    //
    // touchPoints1 = [];
    // touchPoints2 = [];
    // frustum1 = null;
    // frustum2 = null;
    // frustumCreationActive = false;
    //
    // multifunctionalButtonFunction = ButtonFunction.NONE;
    // UpdateMultifunctionalButtonState();
    //
    // hideReplaceButton();
    //
    // setTimeout(() => {
    //     multifunctionalButtonFunction = ButtonFunction.SCENE;
    //     UpdateMultifunctionalButtonState();
    //    
    //     showHelpButton();
    //    
    // }, 600);
}

function showHelpButton() {
    helpButton.style.right = '10px';
}

function hideHelpButton() {
    helpButton.style.right = '-60px';
}

function handleHelpButtonClick() {
    if(currentExplanationIndex === 3) {
        setExplanationIndex(1);
    }

    if(currentExplanationIndex === 4) {
        cullByCube = false;
        boxObject = null;

        touchPoints1 = [];
        touchPoints2 = [];
        frustum1 = null;
        frustum2 = null;
        frustumCreationActive = false;
    }
    
    showExplanationWindow();
    hideHelpButton();

    multifunctionalButtonFunction = ButtonFunction.NONE;
    UpdateMultifunctionalButtonState();
}

function onWindowResize() {
    splat_renderer.setSize(window.innerWidth, window.innerHeight);
    splat_renderer.setSize(window.innerWidth, window.innerHeight);
}

function UpdateMultifunctionalButtonState() {
    if(multifunctionalButtonFunction === ButtonFunction.AR) {
        multifunctionalButton.textContent = "Enter AR";
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.SCENE) {
        multifunctionalButton.textContent = "Szene Platzieren";
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.MASK1) {
        multifunctionalButton.textContent = "Objekt Markieren";
        console.log("Show markieren button")
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.MASK2) {
        multifunctionalButton.textContent = "Erneut Markieren";
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.TRANSFORM) {
        multifunctionalButton.textContent = "Bestätigen";
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.DIMINISH) {
        multifunctionalButton.textContent = "Diminish";
        buttonWrapper.classList.add('visible');
    } else if(multifunctionalButtonFunction === ButtonFunction.REMASK) {
        multifunctionalButton.textContent = "Neu Maskieren";
        buttonWrapper.classList.add('visible');
    } else {
        buttonWrapper.classList.remove('visible');
        setTimeout(() => {
            multifunctionalButton.textContent = "NONE"
        }, 500);
    }
}

function handleMultifunctionalButtonClick(event) {
    event.stopPropagation();
    if(multifunctionalButtonFunction === ButtonFunction.AR) {
        should_render_start_loop = false;
        AR();
        drState = DRState.ENTERED;
        setExplanationIndex(1);
        showExplanationWindow();
    } else if(multifunctionalButtonFunction === ButtonFunction.SCENE) {
        OnScenePlaced();

        showReplaceButton();
        drState = DRState.PLACED;
    } else if(multifunctionalButtonFunction === ButtonFunction.MASK1) {
        hideReplaceButton();
        frustumCreationActive = true;
        addMouseListener();
    } else if(multifunctionalButtonFunction === ButtonFunction.MASK2) {
        frustumCreationActive = true;
    } else if(multifunctionalButtonFunction === ButtonFunction.TRANSFORM) {
        HideControlPanel();
        setTimeout(() => {
            boxObject.ereaseBox(splat_renderer);
            
            multifunctionalButtonFunction = ButtonFunction.DIMINISH;
            UpdateMultifunctionalButtonState();
        }, 600);
    } else if(multifunctionalButtonFunction === ButtonFunction.DIMINISH) {
        cullByCube = true;

        showBlendSlider();
        
        hideHelpButton();

        setTimeout(() => {
            multifunctionalButtonFunction = ButtonFunction.REMASK;
            UpdateMultifunctionalButtonState();
            
            showReplaceButton();
        }, 2000);
        
    } else if(multifunctionalButtonFunction === ButtonFunction.REMASK) {
        cullByCube = false;
        boxObject = null;

        touchPoints1 = [];
        touchPoints2 = [];
        frustum1 = null;
        frustum2 = null;
        frustumCreationActive = false;

        showHelpButton();
        
        hideReplaceButton();
        hideBlendSlider();

        splat_object.splats.forEach(async singleSplat => {
            singleSplat.Rendered = 0;
        })
        splat_object.applyRendering();

        setTimeout(() => {
            multifunctionalButtonFunction = ButtonFunction.MASK1;
            UpdateMultifunctionalButtonState();
        }, 600);
    }
    
    multifunctionalButtonFunction = ButtonFunction.NONE;
    UpdateMultifunctionalButtonState();
}

function addMouseListener() {
    document.addEventListener('mouseup', handleMouseDown, true);
}

function drawRing(posX, posY, ringNumber) {
    const x1 = ((posX + 1) / 2) * canvas.clientWidth;
    const y1 = ((1 - posY) / 2) * canvas.clientHeight;

    if (ringNumber === 1 && currentRing1) {
        currentRing1.remove();
    }
    if (ringNumber === 2 && currentRing2) {
        currentRing2.remove();
    }

    const ring = document.createElement('div');
    ring.classList.add('ring');
    ring.style.left = `${x1}px`;
    ring.style.top = `${y1}px`;
    document.body.appendChild(ring);

    if (ringNumber === 1) {
        currentRing1 = ring;
    } else if (ringNumber === 2) {
        currentRing2 = ring;
    }
}

function addTouchPoint(touchPoints, number, event) {
    
    let x = (event.clientX / canvas.clientWidth) * 2 - 1;
    let y = -(event.clientY / canvas.clientHeight) * 2 + 1;
    
    touchPoints.push({ x, y });

    drawRing(x, y, number);
}

function hideScreenDrawings() {
    if (currentRing1) {
        currentRing1.remove();
    }

    if (currentRing2) {
        currentRing2.remove();
    }

    // if (currentRectangle) {
    //     currentRectangle.remove();
    // }
}

function createFrustumFromTouchPoints(touchPoints) {
    let nearTopLeft = splat_camera.screenToWorldPoint(touchPoints[0].x, touchPoints[0].y);
    let nearBottomRight = splat_camera.screenToWorldPoint(touchPoints[1].x, touchPoints[1].y);
    let nearTopRight = splat_camera.screenToWorldPoint(touchPoints[1].x, touchPoints[0].y);
    let nearBottomLeft = splat_camera.screenToWorldPoint(touchPoints[0].x, touchPoints[1].y);

    let farTopLeft = nearTopLeft.add(splat_camera.screenPointToRay(touchPoints[0].x, touchPoints[0].y).multiply(15));
    let farTopRight = nearTopRight.add(splat_camera.screenPointToRay(touchPoints[1].x, touchPoints[0].y).multiply(15));
    let farBottomLeft = nearBottomLeft.add(splat_camera.screenPointToRay(touchPoints[0].x, touchPoints[1].y).multiply(15));
    let farBottomRight = nearBottomRight.add(splat_camera.screenPointToRay(touchPoints[1].x, touchPoints[1].y).multiply(15));

    let frustum = new SPLAT.Frustum();
    frustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight,farBottomLeft, farBottomRight);

    return frustum;
}

function handleMouseDown(event) {
    if (event.button === 0) {
        if (frustumCreationActive && touchPoints1.length < 2) {
            if(touchPoints1.length === 0) {
                addTouchPoint(touchPoints1, 1, event);
            } else {
                addTouchPoint(touchPoints1, 2, event);
            }

            if (touchPoints1.length === 2) {
                frustum1 = createFrustumFromTouchPoints(touchPoints1);
                console.log("First Frustum Created");

                multifunctionalButtonFunction = ButtonFunction.MASK2;
                UpdateMultifunctionalButtonState();
                
                frustumCreationActive = false;

                setTimeout(function() {
                    hideScreenDrawings();
                }, 2000);
            }
        } 
        else if (frustumCreationActive && touchPoints2.length < 2) {
            if(touchPoints2.length === 0) {
                addTouchPoint(touchPoints2, 1, event);
            } else {
                addTouchPoint(touchPoints2, 2, event);
            }

            if (touchPoints2.length === 2) {
                frustum2 = createFrustumFromTouchPoints(touchPoints2);
                console.log("Second Frustum Created");

                if (frustum1 && frustum2) {
                    // frustum1.drawFrustum(splat_renderer);
                    // frustum2.drawFrustum(splat_renderer);
                    const intersectionPoints = frustum1.intersectFrustum(frustum2);
                    drawIntersectionVolume(intersectionPoints);
                }
            }
        }
    }
}

function drawIntersectionVolume(box) {
    multifunctionalButtonFunction = ButtonFunction.TRANSFORM;
    UpdateMultifunctionalButtonState();
    
    boxObject = box;
    hideScreenDrawings();

    initialCenter = boxObject.center();
    initialSize = boxObject.size();

    boxObject.drawBox(splat_renderer);
    
    ShowControlPanel();
}

let nearTopLeft, nearBottomRight, nearTopRight, nearBottomLeft;
let farTopLeft, farTopRight, farBottomLeft, farBottomRight;

const myWorker = new Worker('./worker/TestWorker.js');

myWorker.onmessage = function(event) {
    const processedNodes = event.data;

    // Anwenden der verarbeiteten Daten auf das splat_object
    for (const singleSplat of processedNodes) {
        singleSplat.setTransparency(singleSplat.transparency);
        singleSplat.setBlending(singleSplat.blending);
    }

    splat_object.applyRendering();
    console.timeEnd("Set SingleSplats");
};

function updateBoxFrustum() {
    
    console.time("update")
    console.time("getCorners")
    screenPoints = boxObject.getCorners().map(corner => splat_camera.worldToScreenPoint(corner));
    // cullByCube = false;     
    console.timeEnd("getCorners")

    console.time("minMax")
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of screenPoints) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }
    console.timeEnd("minMax")

    console.time("createFrustum")
    nearTopLeft = splat_camera.screenToWorldPoint(minX, maxY);
    nearBottomRight = splat_camera.screenToWorldPoint(maxX, minY);
    nearTopRight = splat_camera.screenToWorldPoint(maxX, maxY);
    nearBottomLeft = splat_camera.screenToWorldPoint(minX, minY);

    farTopLeft = nearTopLeft.add(splat_camera.screenPointToRay(minX, maxY).multiply(splat_camera.data.far));
    farTopRight = nearTopRight.add(splat_camera.screenPointToRay(maxX, maxY).multiply(splat_camera.data.far));
    farBottomLeft = nearBottomLeft.add(splat_camera.screenPointToRay(minX, minY).multiply(splat_camera.data.far));
    farBottomRight = nearBottomRight.add(splat_camera.screenPointToRay(maxX, minY).multiply(splat_camera.data.far));

    // boxFrustum.ereaseFrustum(renderer);
    boxFrustum.setFromPoints(nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight, farTopLeft, farTopRight,farBottomLeft, farBottomRight);
    // boxFrustum.drawFrustum(renderer);    

    console.timeEnd("createFrustum")

    console.time("calculate iterator")
    const iterator = new SPLAT.OctreeIterator(splat_object._octree.root, boxFrustum);
    console.timeEnd("calculate iterator")

    console.time("Set SingleSplats")
    splat_object.data.resetRendering();


    // myWorker.postMessage({
    //     iterator,
    //     boxFrustum,
    //     transparency_threshold,
    //     blend_value
    // });
    
    
    for (let node of iterator) {
        const nodeData = node.data;
        if (nodeData && nodeData.data) {
            const nodeDataArray = nodeData.data; // Cache die Array-Referenz

            for (let i = 0, len = nodeDataArray.length; i < len; i++) {
                const singleSplat = nodeDataArray[i];

                if (boxFrustum.containsBox(singleSplat.bounds)) {
                    singleSplat.Rendered = 1;

                    const distance = boxFrustum.distanceToPoint(singleSplat.PositionVec3);
                    const transparency = Math.min(distance / transparency_threshold, 1.0);

                    singleSplat.setTransparency(transparency);
                    singleSplat.setBlending(blend_value);
                }
            }
        }
    }

    // updateInWorker(boxObject, splat_camera, splat_object, transparency_threshold, blend_value);
    splat_object.applyRendering();
    console.timeEnd("Set SingleSplats")
    console.timeEnd("update")
}

function OnScenePlaced() {
    // show tutorial
    setExplanationIndex(4);
    showExplanationWindow();
    

    // set transparency back to normal
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.ResetColor();
    })
    
    // render none
    splat_object.splats.forEach(async singleSplat => {
        singleSplat.Rendered = 0;
    })
    splat_object.applyRendering();
    
    three_camera_setup_position = three_camera.position.clone();
    three_camera_setup_rotation = three_camera.quaternion.clone();
    // console.log("three_camera_setup_position: (" + three_camera_setup_position.x + ", " + three_camera_setup_position.y + ", " + three_camera_setup_position.z + ")")
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
    if( currentSession == null )
    {
        let options = {
            requiredFeatures: ['dom-overlay'],
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

    var newInit = Object.assign( {}, sessionInit );
    newInit.requiredFeatures = [ space ];
    if ( sessionInit.requiredFeatures ) {
        newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
    }
    return newInit;
    
}

let frameCounter = 0;
const updateInterval = 15;

function onXRFrame(t, frame) {
    if(!should_render_XR_loop) return;
    const session = frame.session;

    if(cullByCube && frameCounter % updateInterval === 0) {
        updateBoxFrustum();
    }
    
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

    three_renderer.render( three_scene, three_camera );
    splat_renderer.render( splat_scene, splat_camera );

    if(first_frame) {
        first_frame = false;
        console.log("firstFrame");
    }
    
    frameCounter++;
    session.requestAnimationFrame(onXRFrame);
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
    const url = `./splats/edit_zw1027_4.splat`;
    console.log("path: " + url)
    splat_object = await SPLAT.Loader.LoadAsync(url, splat_scene);
    
    const frame = () => {
        if(!should_render_start_loop) return;
        
        splat_renderer.render(splat_scene, splat_camera);
        requestAnimationFrame(frame);
        
        if(first_frame_splat) {
            first_frame_splat = false;
            showExplanationWindow();
            loaderOverlay.style.display = 'none';

            splat_object.splats.forEach(singleSplat => {
                singleSplat.setTransparency(0.15)
            })
            // splat_object.applyRendering();
        }
    };

    requestAnimationFrame(frame);
}


init();
initExplanationController();

main();

window.addEventListener("resize", onWindowResize)