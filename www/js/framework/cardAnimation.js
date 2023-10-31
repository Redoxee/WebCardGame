import { Vec2 } from './vec';
import { BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from './mathUtils';
import { uniqueId } from './domUtils';
let lastFrameTimeStamp = 0;
let frameDelay = 0;
const cardAnimations = [];
function cardAnimationCallback() {
    const currentFrameTimeStamp = performance.now();
    frameDelay = currentFrameTimeStamp - lastFrameTimeStamp;
    lastFrameTimeStamp = currentFrameTimeStamp;
    for (let index = cardAnimations.length - 1; index > -1; --index) {
        const animationFinished = cardAnimations[index].AnimationFrame(frameDelay);
        if (animationFinished) {
            cardAnimations[index].isRuning = false;
            if (cardAnimations[index].then) {
                cardAnimations[index].then();
            }
            cardAnimations.splice(index, 1);
        }
    }
    requestAnimationFrame(cardAnimationCallback);
}
cardAnimationCallback();
class CardAnimation {
    constructor(target) {
        this.target = target;
        this.id = uniqueId();
        this.isRuning = false;
        this.startEvent = new CustomEvent('cardAnimationStart');
        this.endEvent = new CustomEvent('cardAnimationEnd');
        this.animationName = 'genericAnimation';
    }
    StartAnimation(params) {
        this.then = params.then;
    }
    StopAnimation() {
        const index = cardAnimations.findIndex(e => e.id === this.id);
        this.isRuning = false;
        if (index < 0) {
            return;
        }
        cardAnimations.splice(index, 1);
        this.target.dispatchEvent(this.endEvent);
    }
    AnimationFrame(_dt) {
        throw new Error("methode not implemented");
    }
}
class CardLerpAnimation extends CardAnimation {
    constructor(target) {
        super(target);
        this.rotationFactor = 0;
        this.duration = 0;
        this.p0 = Vec2.Zero.clone();
        this.p1 = Vec2.Zero.clone();
        this.travel = Vec2.Zero.clone();
        this.elapsedTime = 0;
        this.startTime = -1;
        this.bezierParams = BezierPreset.DefaultBezierParams;
        this.direction = Vec2.Zero.clone();
        this.id = uniqueId();
        this.animationName = 'lerpAnimation';
    }
    ;
    StartAnimation(params) {
        var _a;
        super.StartAnimation(params);
        this.p0 = ((_a = params.p0) === null || _a === void 0 ? void 0 : _a.clone()) || this.target.currentPosition;
        this.p1 = params.p1.clone();
        this.travel = Vec2.sub(this.p1, this.p0);
        const distance = (this.travel.length());
        this.duration = distance / params.speed;
        this.startTime = performance.now() - frameDelay;
        this.elapsedTime = 0;
        this.direction = this.travel.norm();
        this.bezierParams = params.bezierParams || BezierPreset.DefaultBezierParams;
        this.rotationFactor = params.rotationFactor || 0;
        this.isRuning = true;
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
            if (this.rotationFactor > 0) {
                this.target.LookToward(Vec2.Zero);
            }
            this.target.dispatchEvent(this.endEvent);
            return true;
        }
        const t = this.elapsedTime / this.duration;
        const transformedTime = cubicInterpolationBezier(t, this.bezierParams);
        const currentPos = Vec2.add(this.p0, this.travel.scale(transformedTime.y));
        this.target.root.style.left = `${currentPos.x}px`;
        this.target.root.style.top = `${currentPos.y}px`;
        this.target.currentPosition = currentPos;
        // this.target.dispatchEvent(new CustomEvent('animationFrame'));
        if (this.rotationFactor > 0) {
            const transformedAcceleration = cubicInterpolationBezierFirstDerivative(t, this.bezierParams).scale(this.rotationFactor);
            this.target.LookToward(this.direction.scale(transformedAcceleration.y));
        }
        return false;
    }
}
class CardFlipAnimation extends CardAnimation {
    constructor(target) {
        super(target);
        this.duration = 0;
        this.endTime = 0;
        this.startFaceDown = false;
        this.elapsedTime = 0;
        this.animationName = 'cardFlip';
    }
    StartAnimation(params) {
        super.StartAnimation(params);
        this.duration = params.duration;
        const startTime = performance.now() - frameDelay;
        this.endTime = startTime + params.duration;
        this.elapsedTime = 0;
        this.startFaceDown = params.startFaceDown;
        if (!cardAnimations.find((e) => e.id === this.id)) {
            cardAnimations.push(this);
        }
        this.target.dispatchEvent(this.startEvent);
    }
    AnimationFrame(dt) {
        this.elapsedTime += dt;
        if (this.target.isFlipped === this.startFaceDown && this.elapsedTime >= (this.duration / 2)) {
            this.target.SetFlip(!this.startFaceDown);
        }
        if (this.elapsedTime > this.duration || this.duration === 0) {
            this.target.dispatchEvent(this.endEvent);
            return true;
        }
        // Animation time from 0 to 1
        let t = this.elapsedTime / this.duration;
        // from 0 to .5 to 0 (at .5 the card is side way so invisible, finishing at 0 makes it so the content isn't mirrored)
        t = .5 - Math.abs(t - .5);
        this.target.SetRotation(t * Math.PI, 0);
        return false;
    }
}
class CirclingAnimation extends CardAnimation {
    constructor(target, radius, duration) {
        super(target);
        this.duration = duration;
        this.elapsedTime = 0;
        this.radius = radius;
        this.circleCenter = Vec2.Zero;
        this.startPosition = Vec2.Zero;
        this.angleDelta = 0;
        this.direction = 1;
        this.targetZIndex = "";
        this.animationName = 'circling';
    }
    StartAnimation(params) {
        super.StartAnimation(params);
        this.elapsedTime = -params.delay;
        if (!cardAnimations.find((e) => e.id === this.id)) {
            cardAnimations.push(this);
        }
        const angleDelta = params.anglePercentage * Math.PI * 2;
        this.circleCenter = Vec2.sub(this.target.currentPosition, new Vec2(Math.sin(angleDelta), Math.cos(angleDelta)).scale(this.radius));
        this.angleDelta = angleDelta;
        this.startPosition = this.target.currentPosition;
        this.target.dispatchEvent(this.startEvent);
        if (Math.random() > .5) {
            this.direction = 1;
        }
        else {
            this.direction = -1;
        }
        this.targetZIndex = params.targetZIndex;
    }
    AnimationFrame(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime > this.duration || this.duration === 0) {
            this.target.SetPosition(this.startPosition);
            return true;
        }
        if (this.elapsedTime < 0) {
            // delay hasn't finished yet
            return false;
        }
        // Animation time from 0 to 1
        let t = this.elapsedTime / this.duration;
        // Ease in out, t is still in the 0 1 range
        t = (Math.sin((t - .5) * Math.PI) + 1) / 2;
        t = t * t;
        const a = t * 2 * Math.PI * this.direction + this.angleDelta;
        const position = Vec2.add(this.circleCenter, (new Vec2(Math.sin(a), Math.cos(a))).scale(this.radius));
        this.target.SetPosition(position);
        if (t > .5) {
            this.target.style.zIndex = this.targetZIndex;
        }
        return false;
    }
}
export { CardAnimation, CardFlipAnimation, CardLerpAnimation, CirclingAnimation };
