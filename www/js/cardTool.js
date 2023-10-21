import { Vec2, Vec3 } from './vec';
import { addCustomStyle, BoundingRect, uniqueId } from './domUtils';
import { BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from './math';
function rotatePitchRoll(vec, pitch, roll) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}
class CardAnimation {
    constructor(target) {
        this.target = target;
        this.id = uniqueId();
        this.startEvent = new CustomEvent('cardAnimationStart');
        this.endEvent = new CustomEvent('cardAnimationEnd');
    }
    StopAnimation() {
        const index = cardAnimations.findIndex(e => e.id === this.id);
        if (index < 0) {
            return;
        }
        cardAnimations.splice(index, 1);
        this.target.dispatchEvent(this.endEvent);
    }
    AnimationFrame(dt) {
        throw new Error("methode not implemented");
    }
}
let lastFrameTimeStamp = 0;
let frameDelay = 0;
const cardAnimations = [];
function cardAnimationCallback(timeStamp) {
    const currentFrameTimeStamp = performance.now();
    frameDelay = currentFrameTimeStamp - lastFrameTimeStamp;
    lastFrameTimeStamp = currentFrameTimeStamp;
    for (let index = cardAnimations.length - 1; index > -1; --index) {
        const animationFinished = cardAnimations[index].AnimationFrame(frameDelay);
        if (animationFinished) {
            cardAnimations.splice(index, 1);
        }
    }
    requestAnimationFrame(cardAnimationCallback);
}
cardAnimationCallback(performance.now());
class CardLerpAnimation extends CardAnimation {
    constructor(target, rotationFactor) {
        super(target);
        this.rotationFactor = rotationFactor;
        this.duration = 0;
        this.p0 = Vec2.Zero.clone();
        this.p1 = Vec2.Zero.clone();
        this.travel = Vec2.Zero.clone();
        this.elapsedTime = 0;
        this.startTime = -1;
        this.bezierParams = BezierPreset.DefaultBezierParams;
        this.direction = Vec2.Zero.clone();
        this.id = uniqueId();
    }
    ;
    StartAnimation(p0, p1, speed, bezierParams) {
        this.p0 = p0.clone();
        this.p1 = p1.clone();
        const distance = (Vec2.sub(p1, p0).length());
        this.duration = distance / speed;
        this.startTime = performance.now() - frameDelay;
        this.elapsedTime = 0;
        this.travel = Vec2.sub(p1, p0);
        this.direction = this.travel.norm();
        this.bezierParams = bezierParams;
        if (!cardAnimations.find((e) => e.id === this.id)) {
            cardAnimations.push(this);
        }
        this.target.dispatchEvent(this.startEvent);
    }
    AnimationFrame(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime > this.duration || this.duration === 0) {
            this.target.root.style.left = `${this.p1.x}px`;
            this.target.root.style.top = `${this.p1.y}px`;
            this.target.currentPosition = this.p1;
            this.target.LookToward(Vec2.Zero);
            this.target.dispatchEvent(this.endEvent);
            return true;
        }
        const t = this.elapsedTime / this.duration;
        const rotationFactor = this.rotationFactor;
        const transformedTime = cubicInterpolationBezier(t, this.bezierParams);
        const currentPos = Vec2.add(this.p0, this.travel.scale(transformedTime.y));
        this.target.root.style.left = `${currentPos.x}px`;
        this.target.root.style.top = `${currentPos.y}px`;
        this.target.currentPosition = currentPos;
        // this.target.dispatchEvent(new CustomEvent('animationFrame'));
        const transformedAcceleration = cubicInterpolationBezierFirstDerivative(t, this.bezierParams).scale(rotationFactor);
        this.target.LookToward(this.direction.scale(transformedAcceleration.y));
        return false;
    }
}
class CardFlipAnimation extends CardAnimation {
    constructor(target) {
        super(target);
        this.duration = 0;
        this.endTime = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
    }
    StartAnimation(duration) {
        this.duration = duration;
        this.startTime = performance.now() - frameDelay;
        this.endTime = this.startTime + duration;
        this.elapsedTime = 0;
        if (!cardAnimations.find((e) => e.id === this.id)) {
            cardAnimations.push(this);
        }
        this.target.dispatchEvent(this.startEvent);
    }
    AnimationFrame(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime > this.duration || this.duration === 0) {
            this.target.dispatchEvent(this.endEvent);
            console.log('ended');
            return true;
        }
        const t = this.elapsedTime / this.duration;
        console.log(t);
        this.target.SetRotation(t * Math.PI, 0);
        return false;
    }
}
function addCardPresentationCapability(cardElements, options) {
    const card = cardElements.root;
    card.root = cardElements.root;
    const zoomElement = cardElements.zoomable;
    card.isFlipped = false;
    const shadowOffset = {
        x: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Left),
        y: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Down)
    };
    cardElements.cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
    const shadeDirection = new Vec3(-options.lightDirection.x, -options.lightDirection.y, options.lightDirection.z);
    card.SetPosition = (position) => {
        card.lerpAnimator.StopAnimation();
        card.root.style.left = `${position.x}px`;
        card.root.style.top = `${position.y}px`;
        card.currentPosition = position.clone();
    };
    card.LookToward = (position) => {
        const atanX = Math.atan2(Math.abs(position.x), options.simHeight);
        const angleX = position.x === 0 ? 0 : position.x > 0 ? atanX : -atanX;
        const atanY = Math.atan2(Math.abs(position.y), options.simHeight);
        const angleY = position.y === 0 ? 0 : position.y > 0 ? -atanY : atanY;
        card.SetRotation(angleX, angleY);
    };
    card.SetRotation = (ax, ay) => {
        // Rotating a vector up toward the viewer to the inclination of the card.
        const normal = rotatePitchRoll(Vec3.Backward, ax, ay);
        const li = Math.pow(Vec3.dot(normal, options.lightDirection), options.lightPower);
        cardElements.cardItem.style.transform = `rotateY(${ax}rad) rotateX(${ay}rad)`;
        cardElements.shine.style.opacity = `${li * 100}%`;
        const unLi = Math.pow(Vec3.dot(normal, shadeDirection), options.lightPower);
        cardElements.shade.style.opacity = `${unLi * 100}%`;
    };
    const smoothTransition = addCustomStyle({
        className: "zoomin",
        content: "transition: transform 0.25s ease-out;"
    });
    zoomElement.classList.add(smoothTransition);
    card.SetZoom = (zoom) => {
        zoomElement.style.transform = `scale(${zoom})`;
    };
    card.SetSmoothOrientation = (enabled) => {
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
    card.Flip = () => {
        card.isFlipped = !card.isFlipped;
        card.flipAnimator.StartAnimation(1000);
    };
    card.lerpAnimator = new CardLerpAnimation(card, 100);
    card.flipAnimator = new CardFlipAnimation(card);
    const bounds = new BoundingRect(card);
    card.currentPosition = bounds.centerPosition.clone();
    return card;
}
export { addCardPresentationCapability, CardLerpAnimation };
