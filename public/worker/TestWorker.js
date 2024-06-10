// worker.js
self.onmessage = function(event) {
    const { iterator, boxFrustum, transparency_threshold, blend_value } = event.data;

    const processedNodes = [];

    for (let node of iterator) {
        const nodeData = node.data;
        if (nodeData && nodeData.data) {
            const nodeDataArray = nodeData.data;

            for (let i = 0, len = nodeDataArray.length; i < len; i++) {
                const singleSplat = nodeDataArray[i];

                if (boxFrustum.containsBox(singleSplat.bounds)) {
                    singleSplat.Rendered = 1;

                    const distance = boxFrustum.distanceToPoint(singleSplat.PositionVec3);
                    const transparency = Math.min(distance / transparency_threshold, 1.0);

                    singleSplat.transparency = transparency;
                    singleSplat.blending = blend_value;

                    processedNodes.push(singleSplat);
                }
            }
        }
    }

    self.postMessage(processedNodes);
};
