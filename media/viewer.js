
(function () {
    const vscode = acquireVsCodeApi();
    const zoomElement = document.querySelector(".zoom");
    let zoom = 1;
    const ZOOM_SPEED = 0.1;

    document.addEventListener("wheel", function (e) {
        if (e.deltaY > 0) {
            zoomElement.style.transform = `scale(${zoom -= ZOOM_SPEED})`;
        } else {
            zoomElement.style.transform = `scale(${zoom += ZOOM_SPEED})`;
        }
    });
}());