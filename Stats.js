/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

    var mode = 0;

    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    container.addEventListener('click', function (event) {
        event.preventDefault();
        showPanel(++mode % container.children.length);
    }, false);

    //

    function addPanel(panel) {
        container.appendChild(panel.dom);
        return panel;
    }

    function hidePanel() {
        for (var i = 0; i < container.children.length; i++) {
            container.children[i].style.display = 'none';
        }
    }
    function showPanel(id) {
        for (var i = 0; i < container.children.length; i++) {
            container.children[i].style.display = i === id ? 'block' : 'none';
        }
        mode = id;
    }

    //

    var beginTime = (performance || Date).now(), prevTime = beginTime, frames = 0;
    var fpsPanel = addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    var msPanel = addPanel(new Stats.Panel('MS', '#0f0', '#020'));

    var fpsHistory = [];
    var frameTimes = [];
    var frameChanges = [];
    var splatCounts = [];
    var collecting = false;
    var startCollectingTime = 0;

    if (self.performance && self.performance.memory) {
        var memPanel = addPanel(new Stats.Panel('MB', '#f08', '#201'));
    }

    showPanel(0);

    return {
        REVISION: 16,
        dom: container,
        addPanel: addPanel,
        showPanel: showPanel,
        hidePanel: hidePanel,

        begin: function () {
            beginTime = (performance || Date).now();
        },

        end: function (changedFrames = 0, numberOfSplats = 0) {
            frames++;
            var time = (performance || Date).now();
            var frameTime = time - beginTime;
            msPanel.update(frameTime, 200);

            if (time >= prevTime + 1000) {
                var fps = (frames * 1000) / (time - prevTime);
                fpsPanel.update(fps, 100);

                if (collecting) {
                    fpsHistory.push({ time: time - startCollectingTime, fps: fps });
                    frameTimes.push({ time: time - startCollectingTime, frameTime: frameTime });
                    frameChanges.push({ time: time - startCollectingTime, changedFrames: changedFrames });
                    splatCounts.push({ time: time - startCollectingTime, splats: numberOfSplats });
                }

                prevTime = time;
                frames = 0;

                if (memPanel) {
                    var memory = performance.memory;
                    memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
                }
            }
            return time;
        },

        update: function (changedFrames = 0, numberOfSplats = 0) {
            beginTime = this.end(changedFrames, numberOfSplats);
        },

        startCollectingFPS: function () {
            fpsHistory = [];
            frameTimes = [];
            frameChanges = [];
            splatCounts = [];
            startCollectingTime = performance.now();
            collecting = true;
        },

        stopCollectingFPS: function () {
            collecting = false;
        },

        downloadFPSData: function () {
            var data = {
                fpsHistory: fpsHistory,
                frameTimes: frameTimes,
                frameChanges: frameChanges,
                splatCounts: splatCounts
            };
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'fps_data.json';
            a.click();
            URL.revokeObjectURL(url);
        },

        getAverageFPS: function (duration) {
            // Calculate average FPS over the given duration (in milliseconds)
            var now = performance.now();
            var sum = 0, count = 0;

            for (var i = fpsHistory.length - 1; i >= 0; i--) {
                if (now - fpsHistory[i].time <= duration) {
                    sum += fpsHistory[i].fps;
                    count++;
                } else {
                    break;
                }
            }

            return count > 0 ? sum / count : 0;
        },

        // Backwards Compatibility
        domElement: container,
        setMode: showPanel
    };
};

Stats.Panel = function (name, fg, bg) {
    var min = Infinity, max = 0, round = Math.round;
    var PR = round(window.devicePixelRatio || 1);
    var WIDTH = 80 * PR, HEIGHT = 48 * PR,
        TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
        GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
        GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

    var canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:80px;height:48px';

    var context = canvas.getContext('2d');
    context.font = 'bold ' + (9 * PR) + 'px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';

    context.fillStyle = bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = fg;
    context.fillText(name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    return {
        dom: canvas,

        update: function (value, maxValue) {
            min = Math.min(min, value);
            max = Math.max(max, value);

            context.fillStyle = bg;
            context.globalAlpha = 1;
            context.fillRect(0, 0, WIDTH, GRAPH_Y);
            context.fillStyle = fg;
            context.fillText(round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')', TEXT_X, TEXT_Y);

            context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);

            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

            context.fillStyle = bg;
            context.globalAlpha = 0.9;
            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round((1 - (value / maxValue)) * GRAPH_HEIGHT));
        }
    };
};

export { Stats as default };