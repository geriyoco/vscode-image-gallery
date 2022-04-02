import lozad from 'lozad';

(function() {
    const vscode = acquireVsCodeApi();
    const observer = lozad(); // lazy loads elements with default selector as '.lozad'
    observer.observe();

    window.addEventListener('scroll', () => {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = document.documentElement;
        console.log(scrollHeight, scrollTop, clientHeight);

        if (scrollTop + clientHeight >= scrollHeight - 5) {
            console.log("help");
            vscode.postMessage({
                command: 'alert',
                text: '🐛  on line ' + currentCount
            });
        }
    }, {
        passive: true
    });
}());