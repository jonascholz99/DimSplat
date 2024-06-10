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
    
    <button id="help-button">?</button>
        
    <div class="button-wrapper" id="buttonWrapper">
        <button class="multifunctional-button" id="multifunctionalButton">Floating Button</button>
        <button class="multifunctional-button" id="replaceButton">Neu Platzieren</button>
    </div>
    
    <div class="slider-container" id="slider-container">
        <input type="range" class="slider" id="blendSlider" min="0" max="1" value="1" step="0.01">
    </div>


        
    <!-- control panel -->        
    <div class="control-panel" id="control-panel">
        <h1>Control Panel</h1>
        <div class="sections-container">
            <div class="section">
                <h2>Position</h2>
                <label for="x-position">X-Position</label>
                <input type="range" id="x-position" min="-5" max="5" value="0" step="0.1">
                <span id="x-position-value">0</span>

                <label for="y-position">Y-Position</label>
                <input type="range" id="y-position" min="-5" max="5" value="0" step="0.1">
                <span id="y-position-value">0</span>

                <label for="z-position">Z-Position</label>
                <input type="range" id="z-position" min="-5" max="5" value="0" step="0.1">
                <span id="z-position-value">0</span>
            </div>
            <div class="section">
                <h2>Skalierung</h2>
                <label for="x-scaling">X-Skalierung</label>
                <input type="range" id="x-scaling" min="0.1" max="5" step="0.1" value="1">
                <span id="x-scaling-value">1</span>

                <label for="y-scaling">Y-Skalierung</label>
                <input type="range" id="y-scaling" min="0.1" max="5" step="0.1" value="1">
                <span id="y-scaling-value">1</span>

                <label for="z-scaling">Z-Skalierung</label>
                <input type="range" id="z-scaling" min="0.1" max="5" step="0.1" value="1">
                <span id="z-scaling-value">1</span>
            </div>
        </div>
    </div>
</div>
`;
