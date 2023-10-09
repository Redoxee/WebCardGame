import { Vec2, Vec3 } from './vec.js';
import { addCardPresentationCapability } from './cardTool.js';
import { setupSandboxCurves } from './curveSandbox.js';
import { getElementBounds } from './domUtils.js';
const container = document.getElementById('container');
const card = document.getElementById('card');
const cardItem = document.getElementById('card-item');
const shine = document.getElementById('shine');
const shade = document.getElementById('unshine');
var containerRect = getElementBounds(container);
const cardElements = {
    root: card,
    cardItem: cardItem,
    shine: shine,
    shade: shade,
};
const cardOptions = {
    lightDirection: (new Vec3(.15, -1, .25)).normalize(),
    simHeight: 190,
    lightPower: 1.5,
    shadowDistance: 5
};
const presentationCard = addCardPresentationCapability(cardElements, cardOptions);
container.isDragging = false;
function startMove() {
    presentationCard.setZoom(2);
    presentationCard.setSmoothOrientation(false);
    container.isDragging = true;
}
function endMove() {
    if (container.isDragging) {
        presentationCard.setZoom(1);
        presentationCard.setSmoothOrientation(true);
        presentationCard.setOrientation(Vec2.Zero);
        container.isDragging = false;
    }
}
container.addEventListener('mousedown', (ev) => {
    startMove();
});
container.addEventListener('mouseup', (ev) => {
    endMove();
});
container.addEventListener('pointerleave', (ev) => {
    endMove();
});
container.addEventListener('mousemove', (ev) => {
    if (container.isDragging) {
        const target = ev.target;
        const targetRect = getElementBounds(target);
        const evPosition = new Vec2(ev.clientX - targetRect.centerX, ev.clientY - targetRect.centerY);
        presentationCard.setOrientation(evPosition);
    }
});
container.addEventListener("touchstart", (ev) => {
    startMove();
}, false);
container.addEventListener("touchcancel", (ev) => {
    endMove();
}, false);
container.addEventListener("touchend", (ev) => {
    endMove();
}, false);
container.addEventListener('touchmove', (ev) => {
    ev.preventDefault();
    if (container.isDragging) {
        const target = ev.target;
        const targetRect = getElementBounds(target);
        const evPosition = new Vec2(ev.touches[0].clientX - targetRect.centerX, ev.touches[0].clientY - targetRect.centerY);
        presentationCard.setOrientation(evPosition);
    }
});
presentationCard.setOrientation(Vec2.Zero);
const testButton = document.getElementById('test-button');
const targets = [
    document.getElementById('target-1'),
    document.getElementById('target-2'),
    document.getElementById('target-3'),
    document.getElementById('target-4'),
];
let currentIndex = 0;
testButton.addEventListener('click', (_ev) => {
    currentIndex = (currentIndex + 1) % targets.length;
    const targetPosition = getElementBounds(targets[currentIndex]);
    container.style.left = `${targetPosition.centerX}px`;
    container.style.top = `${targetPosition.centerY}px`;
    console.log(currentIndex);
});
setupSandboxCurves();
