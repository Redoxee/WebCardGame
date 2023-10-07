import { Vec2, Vec3 } from './vec.js';
import { addCardPresentationCapability } from './cardTool.js';
const container = document.getElementById('container');
const card = document.getElementById('card');
const cardItem = document.getElementById('card-item');
const shine = document.getElementById('shine');
const shade = document.getElementById('unshine');
function getElementCoord(elem) {
    let box = elem.getBoundingClientRect();
    return {
        top: box.top + window.pageYOffset,
        right: box.right + window.pageXOffset,
        bottom: box.bottom + window.pageYOffset,
        left: box.left + window.pageXOffset,
        centerX: box.left + window.pageXOffset + (box.right - box.left) / 2,
        centerY: box.top + window.pageYOffset + (box.bottom - box.top) / 2,
        width: box.right - box.left,
        height: box.top - box.bottom,
    };
}
var containerRect = getElementCoord(container);
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
        const targetRect = getElementCoord(target);
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
        const targetRect = getElementCoord(target);
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
    const targetPosition = getElementCoord(targets[currentIndex]);
    container.style.left = `${targetPosition.centerX}px`;
    container.style.top = `${targetPosition.centerY}px`;
    console.log(currentIndex);
});
function CubicInterpolationBezier(t, p1, p2) {
    const tSquare = t * t;
    const tCube = tSquare * t;
    const p1Factor = (3 * tCube - 6 * tSquare - 3 * t);
    const p2Factor = (-3 * tCube + 3 * tSquare);
    const posX = p1.x * p1Factor + p2.x * p2Factor + tCube;
    const posY = p1.y * p1Factor + p2.y * p2Factor + tCube;
    return { x: posX, y: posY };
}
const svg = document.getElementById('curve-svg');
const curveLine = svg.getElementsByTagName('polyline')[0];
curveLine.points.clear();
const nbIteration = 10;
for (let i = 0; i < nbIteration; ++i) {
    const t = i / nbIteration;
    const p1 = { x: 0.57, y: 0.17 };
    const p2 = { x: 0.55, y: 0.84 };
    const p = CubicInterpolationBezier(t, p1, p2);
    const point = svg.createSVGPoint();
    point.x = p.x;
    point.y = p.y;
    curveLine.points.appendItem(point);
}
