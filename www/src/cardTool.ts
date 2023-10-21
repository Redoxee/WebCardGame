import {Vec2, Vec3} from './vec';
import {addCustomStyle, BoundingRect, uniqueId} from './domUtils';
import {IBezierParams, BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative} from './math';

function rotatePitchRoll(vec : Vec3, pitch : number, roll : number) {
	const cp = Math.cos(pitch);
	const sp = Math.sin(pitch);
	const cr = Math.cos(roll);
	const sr = Math.sin(roll);
	
	return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}

interface ICardElements {
	root : HTMLElement,
	zoomable : HTMLElement,
	cardItem : HTMLElement,
	shine : HTMLElement,
	shade : HTMLElement
}

interface ICardPresentationOptions {
	simHeight : number;
	lightDirection : Vec3;
	lightPower : number;
	shadowDistance : number;
}

interface ICardPresentation extends HTMLElement {
	root : HTMLElement;
	lerpAnimator : CardLerpAnimation;
	currentPosition : Vec2;
	isFlipped : boolean;

	SetOrientation(position : Vec2) : void;
	SetZoom(zoom : number) : void;
	SetSmoothOrientation(enabled : boolean) : void;
	SetPosition(pos : Vec2) : void;
	Flip() : void;
}

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

class CardLerpAnimation extends CardAnimation{
	p0 : Vec2;
	p1 : Vec2;
	duration : number;
	endTime : number;
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
		this.endTime = 0;
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
		this.endTime = this.startTime + this.duration;
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
			this.target.SetOrientation(Vec2.Zero);
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
		this.target.SetOrientation(this.direction.scale(transformedAcceleration.y));
		return false;
	}
}

function addCardPresentationCapability(cardElements : ICardElements, options : ICardPresentationOptions) : ICardPresentation{
	const card = cardElements.root as ICardPresentation;
	card.root = cardElements.root;
	const zoomElement = cardElements.zoomable;
	card.isFlipped = false;

	const shadowOffset = {
		x : options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Left), 
		y : options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Down)
	};

	cardElements.cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
	
	const shadeDirection = new Vec3(-options.lightDirection.x, -options.lightDirection.y, options.lightDirection.z);
	
	card.SetPosition = (position : Vec2) => {
		card.lerpAnimator.StopAnimation();
		card.root.style.left = `${position.x}px`;
		card.root.style.top = `${position.y}px`;
		card.currentPosition = position.clone();
	};

	card.SetOrientation = (position : Vec2) => {
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
	}

	const smoothTransition = addCustomStyle({
		className:"zoomin",
		content: "transition: transform 0.25s ease-out;"
	});

	zoomElement.classList.add(smoothTransition);
	card.SetZoom = (zoom) => {
		zoomElement.style.transform = `scale(${zoom})`;
	};

	card.SetSmoothOrientation = (enabled) => {
		if (enabled) {
			if(!cardElements.cardItem.classList.contains(smoothTransition)) {
				cardElements.cardItem.classList.add(smoothTransition);
			}
		}
		else {
			if(cardElements.cardItem.classList.contains(smoothTransition)) {
				cardElements.cardItem.classList.remove(smoothTransition);
			}
		}
	}

	card.Flip = ()=> {
		card.isFlipped = !card.isFlipped;
	};

	card.lerpAnimator = new CardLerpAnimation(card, 100);

	const bounds = new BoundingRect(card);
	card.currentPosition = bounds.centerPosition.clone();

	return card;
}

export {addCardPresentationCapability, ICardElements, ICardPresentation, ICardPresentationOptions, CardLerpAnimation};