import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { getElementBounds } from './domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, DefaultBezierParams } from './math';
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
class CardLerpAnimation {
    constructor(target, speed, rotationFactor) {
        this.target = target;
        this.speed = speed;
        this.rotationFactor = rotationFactor;
        this.duration = 0;
        this.p0 = Vec2.Zero;
        this.p1 = Vec2.Zero;
        this.travel = Vec2.Zero;
        this.endTime = 0;
        this.startTime = -1;
        this.bezierParams = DefaultBezierParams;
        this.direction = Vec2.Zero;
    }
    ;
    playAnimation(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;
        const distance = (Vec2.sub(p1, p0).length());
        this.duration = distance / this.speed;
        console.log(this.duration);
        this.startTime = performance.now();
        this.endTime = this.startTime + this.duration;
        this.travel = Vec2.sub(p1, p0);
        this.direction = this.travel.norm();
        this.bezierParams = getBezierParams(this.travel.length());
        requestAnimationFrame(lerpCardAnimationCallback);
    }
}
;
const testAnimation = new CardLerpAnimation(presentationCard, .75, 150);
function lerpCardAnimationCallback(timeStamp) {
    const p1 = testAnimation.p1;
    const target = testAnimation.target;
    if (testAnimation.endTime < timeStamp || testAnimation.duration === 0) {
        target.root.style.left = `${p1.x}px`;
        target.root.style.top = `${p1.y}px`;
        target.setOrientation(Vec2.Zero);
        return;
    }
    const t = (timeStamp - testAnimation.startTime) / testAnimation.duration;
    const p0 = testAnimation.p0;
    const rotationFactor = testAnimation.rotationFactor;
    const travel = testAnimation.travel;
    const bezierParams = testAnimation.bezierParams;
    const direction = testAnimation.direction;
    const transformedTime = cubicInterpolationBezier(t, bezierParams);
    const currentPos = Vec2.add(p0, travel.scale(transformedTime.y));
    target.root.style.left = `${currentPos.x}px`;
    target.root.style.top = `${currentPos.y}px`;
    const transformedAcceleration = cubicInterpolationBezierFirstDerivative(t, bezierParams).scale(rotationFactor);
    target.setOrientation(direction.scale(transformedAcceleration.y));
    requestAnimationFrame(lerpCardAnimationCallback);
}
testButton.addEventListener('click', (_ev) => {
    currentIndex = (currentIndex + 1) % targets.length;
    const startPosition = getElementBounds(presentationCard.root);
    const targetPosition = getElementBounds(targets[currentIndex]);
    testAnimation.playAnimation(new Vec2(startPosition.centerX, startPosition.centerY), new Vec2(targetPosition.centerX, targetPosition.centerY));
});
