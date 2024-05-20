import { DRSceneHTML } from './src/DRScene.js';
import { homeHTML } from "./src/home.js";
import { noWebXRHTML } from "./src/noWebXR.js";

function navigate(event) {
    event.preventDefault();
    const path = event.target.getAttribute('href');
    history.pushState({}, "", path);
    handleRoute();
}

function handleRoute() {
    const app = document.getElementById('app');
    const path = window.location.pathname;

    if (path === "/DimSplat" || path === "/DimSplat/") {
        app.innerHTML = homeHTML;
        import('./homeController.js')
    } else if (path === "/DimSplat/scene") {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    app.innerHTML = DRSceneHTML;
                    import('./main.js');
                } else {
                    app.innerHTML = noWebXRHTML;
                }
            }).catch((error) => {
                console.error("Error checking WebXR support:", error);
            });
        } else {
            // app.innerHTML = noWebXRHTML;
            app.innerHTML = DRSceneHTML;
            import('./main.js');
        }
        
    } else {
        app.innerHTML = `<h1>404 - Page Not Found</h1>`;
    }
}

window.addEventListener('popstate', handleRoute);

handleRoute();
