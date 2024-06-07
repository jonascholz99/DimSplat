import { DRSceneHTML } from './src/DRScene.js';
import { homeHTML } from "./src/home.js";
import { noWebXRHTML } from "./src/noWebXR.js";

function navigate(event) {
    event.preventDefault();
    const path = event.target.getAttribute('href');
    history.pushState({}, "", path);
    handleRoute();
}

function handleRoute(path) {
    const app = document.getElementById('app');

    if (path === "home" || path === "/DimSplat" || path === "/DimSplat/") {
        // app.innerHTML = homeHTML;
        // import('./homeController.js')
        app.innerHTML = DRSceneHTML;
        import('./main.js');
    } else if (path === "scene" || path === "/DimSplat/scene") {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    app.innerHTML = DRSceneHTML;
                    import('./main.js');
                } else {
                    app.innerHTML = DRSceneHTML;
                    import('./main.js');
                }
            }).catch((error) => {
                console.error("Error checking WebXR support:", error);
            });
        } else {
            app.innerHTML = noWebXRHTML;
            // app.innerHTML = DRSceneHTML;
            // import('./main.js');
        }
        
    } else {
        app.innerHTML = `<h1>404 - Page Not Found</h1>`;
    }
}

document.body.addEventListener('click', event => {
    if (event.target.matches('a.button')) {
        event.preventDefault();
        const path = event.target.getAttribute('href');
        handleRoute(path === "/DimSplat/scene" ? "scene" : "home");
    }
});
handleRoute("/DimSplat/"); // Initialer Aufruf
