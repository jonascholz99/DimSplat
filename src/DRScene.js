export const DRSceneHTML = `
<div id="diminish-scene">
    <div class="card" id="card">
        <video class="video" id="video" width="300" height="300" autoplay muted playsinline loop>
            <source id="videoSource" src="./videos/video_keep upright.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
        <div class="text" id="text">
            <p>Bitte achte darauf, dein Handy während dem platzieren immer aufrecht zu halten</p>
        </div>
        <button class="button" id="nextButton">Ok verstanden!</button>
    </div>
    
    <div id="loader-overlay">
        <div id="spinner"></div>
        <div id="loading-text">Loading data and creating splat scene...</div>
        <ul id="completed-sections"></ul>
    </div>
        
    <button class="multifunctional-button" id="multifunctionalButton">Floating Button</button>     

    <button id="diminish-scene-button"><img src="./icons/home.svg" alt="Icon"></button>
    <button id="diminish-frustum-button"><img src="./icons/camera.svg" alt="Icon"></button>       

    <div id="floatingText">Please position the transparent representation of the <br> room as precisely as possible over the real one. <br><br> Tab screen to place</div>       
</div>
`;
