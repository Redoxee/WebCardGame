import { Vec2, Vec3 } from './vec';
import { addCustomStyle } from './domUtils';
import { BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from './math';
function rotatePitchRoll(vec, pitch, roll) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}
let lastFrameTimeStamp = 0;
let frameDelay = 0;
const cardAnimations = [];
function cardAnimationCallback(timeStamp) {
    const currentFrameTimeStamp = performance.now();
    frameDelay = currentFrameTimeStamp - lastFrameTimeStamp;
    lastFrameTimeStamp = currentFrameTimeStamp;
    cardAnimations.forEach(element => {
        element.animationFrame(frameDelay);
    });
    requestAnimationFrame(cardAnimationCallback);
}
cardAnimationCallback(performance.now());
class CardLerpAnimation {
    constructor(target, rotationFactor) {
        this.target = target;
        this.rotationFactor = rotationFactor;
        this.duration = 0;
        this.p0 = Vec2.Zero;
        this.p1 = Vec2.Zero;
        this.travel = Vec2.Zero;
        this.endTime = 0;
        this.elapsedTime = 0;
        this.startTime = -1;
        this.bezierParams = BezierPreset.DefaultBezierParams;
        this.direction = Vec2.Zero;
    }
    ;
    startAnimation(p0, p1, speed, bezierParams) {
        this.p0 = p0;
        this.p1 = p1;
        const distance = (Vec2.sub(p1, p0).length());
        this.duration = distance / speed;
        this.startTime = performance.now() - frameDelay;
        this.endTime = this.startTime + this.duration;
        this.elapsedTime = 0;
        this.travel = Vec2.sub(p1, p0);
        this.direction = this.travel.norm();
        this.bezierParams = bezierParams;
        if (!cardAnimations.find((e) => e === this)) {
            cardAnimations.push(this);
        }
    }
    animationFrame(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime > this.duration || this.duration === 0) {
            this.target.root.style.left = `${this.p1.x}px`;
            this.target.root.style.top = `${this.p1.y}px`;
            this.target.setOrientation(Vec2.Zero);
            cardAnimations.splice(cardAnimations.findIndex((e) => e === this), 1);
            return;
        }
        const t = this.elapsedTime / this.duration;
        const rotationFactor = this.rotationFactor;
        const transformedTime = cubicInterpolationBezier(t, this.bezierParams);
        const currentPos = Vec2.add(this.p0, this.travel.scale(transformedTime.y));
        this.target.root.style.left = `${currentPos.x}px`;
        this.target.root.style.top = `${currentPos.y}px`;
        const transformedAcceleration = cubicInterpolationBezierFirstDerivative(t, this.bezierParams).scale(rotationFactor);
        this.target.setOrientation(this.direction.scale(transformedAcceleration.y));
    }
}
function addCardPresentationCapability(cardElements, options) {
    const card = cardElements.root;
    card.root = cardElements.root;
    const zoomElement = cardElements.zoomable;
    const shadowOffset = {
        x: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Left),
        y: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Down)
    };
    cardElements.cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
    const shadeDirection = new Vec3(-options.lightDirection.x, -options.lightDirection.y, options.lightDirection.z);
    card.setOrientation = (position) => {
        const atanX = Math.atan2(Math.abs(position.x), options.simHeight);
        const angleX = position.x === 0 ? 0 : position.x > 0 ? atanX : -atanX;
        const atanY = Math.atan2(Math.abs(position.y), options.simHeight);
        const angleY = position.y === 0 ? 0 : position.y > 0 ? -atanY : atanY;
        // Rotating a vector up toward the viewer to the inclination of the card.
        const normal = rotatePitchRoll(Vec3.Backward, angleX, angleY);
        const li = Math.pow(Vec3.dot(normal, options.lightDirection), options.lightPower);
        cardElements.cardItem.style.transform = `rotateY(${angleX}rad) rotateX(${angleY}rad)`;
        cardElements.shine.style.opacity = `${li * 100}%`;
        const unLi = Math.pow(Vec3.dot(normal, shadeDirection), options.lightPower);
        cardElements.shade.style.opacity = `${unLi * 100}%`;
    };
    const smoothTransition = addCustomStyle({
        className: "zoomin",
        content: "transition: transform 0.25s ease-out;"
    });
    zoomElement.classList.add(smoothTransition);
    card.setZoom = (zoom) => {
        zoomElement.style.transform = `scale(${zoom})`;
    };
    card.setSmoothOrientation = (enabled) => {
        if (enabled) {
            if (!cardElements.cardItem.classList.contains(smoothTransition)) {
                cardElements.cardItem.classList.add(smoothTransition);
            }
        }
        else {
            if (cardElements.cardItem.classList.contains(smoothTransition)) {
                cardElements.cardItem.classList.remove(smoothTransition);
            }
        }
    };
    card.lerpAnimator = new CardLerpAnimation(card, 100);
    return card;
}
export { addCardPresentationCapability };
