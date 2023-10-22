import { Vec2 } from './vec';
import { IBezierParams, BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from './math';
import { uniqueId } from './domUtils';
import { ICardPresentation } from './cardTool';

let lastFrameTimeStamp = 0;
let frameDelay = 0;
const cardAnimations : CardAnimation[] = [] ;

function cardAnimationCallback(timeStamp : number) {
	const currentFrameTimeStamp = performance.now();
	frameDelay = currentFrameTimeStamp - lastFrameTimeStamp;
	lastFrameTimeStamp = currentFrameTimeStamp;
	for(let index = cardAnimations.length - 1; index > -1; --index) {
		const animationFinished = cardAnimations[index].AnimationFrame(frameDelay);
		if(animationFinished) {
			cardAnimations.splice(index, 1);
		}
	}
	
	requestAnimationFrame(cardAnimationCallback);
}

cardAnimationCallback(performance.now());

class CardAnimation {
	id : string;
	target : ICardPresentation;

	startEvent : CustomEvent;
	endEvent : CustomEvent;

	constructor(target : ICardPresentation) {
		this.target = target;
		this.id = uniqueId();
		
		this.startEvent = new CustomEvent('cardAnimationStart');
		this.endEvent = new CustomEvent('cardAnimationEnd');
	}

	StopAnimation() {
		const index = cardAnimations.findIndex(e => e.id === this.id);
		if(index < 0) {
			return;
		}

		cardAnimations.splice(index, 1);
		this.target.dispatchEvent(this.endEvent);
	}

	AnimationFrame(dt : number) : boolean {
		throw new Error("methode not implemented");
	}
}

class CardLerpAnimation extends CardAnimation {
	p0 : Vec2;
	p1 : Vec2;
	duration : number;
	startTime : number;
	rotationFactor : number;
	elapsedTime : number;
	travel : Vec2;
	bezierParams : IBezierParams;
	direction : Vec2;

	constructor(target : ICardPresentation, rotationFactor : number) {
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
	};
	
	StartAnimation(p0 : Vec2, p1 : Vec2, speed : number, bezierParams : IBezierParams) {
		this.p0 = p0.clone();
		this.p1 = p1.clone();
		const distance = (Vec2.sub(p1, p0).length());
		this.duration = distance / speed;
		this.startTime = performance.now() - frameDelay;
		this.elapsedTime = 0;
		this.travel = Vec2.sub(p1, p0);
		this.direction = this.travel.norm();
		this.bezierParams = bezierParams;
		
		if (!cardAnimations.find((e)=>e.id === this.id)) {
			cardAnimations.push(this);
		}

		this.target.dispatchEvent(this.startEvent);
	}

	AnimationFrame(dt : number) : boolean {
		this.elapsedTime += dt;
		if (this.elapsedTime > this.duration || this.duration === 0)
		{
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
	duration : number;
	startFaceDown : boolean;
	endTime : number;
	elapsedTime : number;

	constructor(target : ICardPresentation) {
		super(target);
		this.duration = 0;
		this.endTime = 0;
		this.startFaceDown = false;
		this.elapsedTime = 0;
	}

	StartAnimation(startFaceDown : boolean, duration : number) {
		this.duration = duration;
		const startTime = performance.now() - frameDelay;
		this.endTime = startTime + duration;
		this.elapsedTime = 0;
		this.startFaceDown = startFaceDown;

		if (!cardAnimations.find((e)=>e.id === this.id)) {
			cardAnimations.push(this);
		}

		this.target.dispatchEvent(this.startEvent);
	}

	AnimationFrame(dt: number): boolean {
		
		this.elapsedTime += dt;
		if (this.target.isFlipped === this.startFaceDown && this.elapsedTime >= (this.duration / 2)) {
			this.target.SetFlip(!this.startFaceDown);
		}

		if (this.elapsedTime > this.duration || this.duration === 0)
		{
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

export {CardFlipAnimation, CardLerpAnimation};