import {Vec2, Vec3} from './vec';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {getElementBounds} from './domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, DefaultBezierParams, IBezierParams } from './math';

const board = document.getElementById('game-board')!;
const container = document.getElementById('container')!;
const card = document.getElementById('card')!;
const cardItem = document.getElementById('card-item')!;
const shine = document.getElementById('shine')!;
const shade = document.getElementById('unshine')!;

const cardElements : ICardElements = {
	root : container,
	zoomable : card,
	cardItem : cardItem,
	shine : shine,
	shade : shade,
};

const cardOptions : ICardPresentationOptions = {
	lightDirection : (new Vec3(.15, -1, .25)).normalize(),
	simHeight : 190, 
	lightPower : 1.5,
	shadowDistance : 5
};

const presentationCard = addCardPresentationCapability(cardElements, cardOptions);

let isDragging = false;
let isSelected = false;
let startTouchTimeStamp = 0;

const clickDragThreshold = 500;

function startInput() {
	if(isSelected) {
		presentationCard.setSmoothOrientation(true);
		presentationCard.setZoom(1);
	}

	isSelected = false;
	isDragging = true;
	
	presentationCard.setSmoothOrientation(false);
	
	startTouchTimeStamp = performance.now();
}

function endInput() {
	const inputDuration = performance.now() - startTouchTimeStamp;
	if(inputDuration < clickDragThreshold) {
		isSelected = true;
		presentationCard.setZoom(2);
	}

	if (isDragging) {
		isDragging = false;
	}
}

container.addEventListener('mousedown', (ev)=>{
	startInput();
});

container.addEventListener('mouseup', (ev)=>{
	endInput();
});

container.addEventListener('pointerleave', (ev)=> {
	if (isSelected) {
		isSelected = false;
		presentationCard.setZoom(1);
		presentationCard.setOrientation(Vec2.Zero);
	}
});

container.addEventListener("touchstart", (ev)=>{
	startInput();
}, false);

container.addEventListener("touchcancel", (ev)=>{
	endInput();
}, false);

container.addEventListener("touchend", (ev)=>{
	endInput();
}, false);


function cardMove(posX : number, posY : number) {
	if (isSelected) {
		const targetRect = getElementBounds(presentationCard);
		const evPosition = new Vec2(posX - targetRect.centerX, posY - targetRect.centerY);
		presentationCard.setOrientation(evPosition);
	}
}

container.addEventListener('mousemove', (ev)=> {
	cardMove(ev.clientX, ev.clientY);
});

container.addEventListener('touchmove', (ev)=> {
	const target = ev.touches[0];
	cardMove(target.clientX, target.clientY);
});

presentationCard.setOrientation(Vec2.Zero);

const testButton = document.getElementById('test-button') as HTMLButtonElement;
const targets = [
	document.getElementById('target-1')!,
	document.getElementById('target-2')!,
	document.getElementById('target-3')!,
	document.getElementById('target-4')!,
];

let currentIndex = 0;

testButton.addEventListener('click', (_ev)=>{
	currentIndex = (currentIndex + 1) % targets.length;
	const startPosition = getElementBounds(presentationCard.root)
	const targetPosition = getElementBounds(targets[currentIndex]);
	presentationCard.lerpAnimator.startAnimation(
		new Vec2(startPosition.centerX, startPosition.centerY),
		new Vec2(targetPosition.centerX, targetPosition.centerY),
		1,
		{
			p1x : 0.32, 
			p1y : 0.0, 
			p2x : 0.5, 
			p2y : 1}
		);
});

function boardMove(posX : number, posY : number) {
	const startPosition = getElementBounds(presentationCard.root)
	const targetPosition = getElementBounds(targets[currentIndex]);
	presentationCard.lerpAnimator.startAnimation(
		new Vec2(startPosition.centerX, startPosition.centerY),
		new Vec2(posX, posY),
		2,
		{
			p1x : .32,
			p1y : .32,
			p2x : .75,
			p2y : .75
		});
}

board.addEventListener('mousemove', (event)=>{
	if(isDragging) {
		boardMove(event.clientX , event.clientY);
	}
});

board.addEventListener('touchmove', (event)=>{
	if(isDragging) {
		const target = event.targetTouches[0];
		boardMove(target.clientX, target.clientY - 150);
	}
});

//setupSandboxCurves(presentationCard.lerpAnimator.getBezierParams(1));