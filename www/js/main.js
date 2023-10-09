import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { getElementBounds } from './domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from './math';
const container = document.getElementById('container');
const card = document.getElementById('card');
const cardItem = document.getElementById('card-item');
const shine = document.getElementById('shine');
const shade = document.getElementById('unshine');
const cardElements = {
    root: container,
    zoomable: card,
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
let isDragging = false;
function startMove() {
    presentationCard.setZoom(2);
    presentationCard.setSmoothOrientation(false);
    isDragging = true;
}
function endMove() {
    if (isDragging) {
        presentationCard.setZoom(1);
        presentationCard.setSmoothOrientation(true);
        presentationCard.setOrientation(Vec2.Zero);
        isDragging = false;
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
    if (isDragging) {
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
    if (isDragging) {
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
function getBezierParams(distance) {
    return {
        p1x: .32,
        p1y: .0,
        p2x: .5,
        p2y: 1
    };
}
function lerpCardElement(target, t, p0, p1) {
    if (Vec2.equal(p0, p1)) {
        return;
    }
    const travel = Vec2.sub(p1, p0);
    console.log(`${p0} - ${p1} = ${travel}`);
    const bezierParams = getBezierParams(travel.length());
    const direction = travel.norm();
    const transformedTime = cubicInterpolationBezier(t, bezierParams);
    const currentPos = Vec2.add(p0, travel.scale(transformedTime.y));
    target.root.style.left = `${currentPos.x}px`;
    target.root.style.top = `${currentPos.y}px`;
    const transformedAcceleration = cubicInterpolationBezierFirstDerivative(t, bezierParams).scale(100);
    target.setOrientation(direction.scale(transformedAcceleration.y));
}
class CardLerpAnimation {
    constructor(target, duration) {
        this.target = target;
        this.duration = duration * 1000;
        this.p0 = Vec2.Zero;
        this.p1 = Vec2.Zero;
        this.endTime = 0;
        this.startTime = -1;
    }
    ;
    playAnimation(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;
        this.startTime = performance.now();
        this.endTime = this.startTime + this.duration;
        requestAnimationFrame(lerpCardAnimationCallback);
    }
}
;
const testAnimation = new CardLerpAnimation(presentationCard, 2);
function lerpCardAnimationCallback(timeStamp) {
    if (testAnimation.endTime < timeStamp || testAnimation.duration === 0) {
        // TODO FINISH Animation
        return;
    }
    const t = (timeStamp - testAnimation.startTime) / testAnimation.duration;
    lerpCardElement(testAnimation.target, t, testAnimation.p0, testAnimation.p1);
    requestAnimationFrame(lerpCardAnimationCallback);
}
testButton.addEventListener('click', (_ev) => {
    currentIndex = (currentIndex + 1) % targets.length;
    const startPosition = getElementBounds(presentationCard.root);
    const targetPosition = getElementBounds(targets[currentIndex]);
    testAnimation.playAnimation(new Vec2(startPosition.centerX, startPosition.centerY), new Vec2(targetPosition.centerX, targetPosition.centerY));
});
