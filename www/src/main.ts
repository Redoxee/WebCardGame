import {Vec2, Vec3} from './vec';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {getElementBounds} from './domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, DefaultBezierParams, IBezierParams } from './math';

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

container.addEventListener('mousedown', (ev)=>{
	startMove();
});

container.addEventListener('mouseup', (ev)=>{
	endMove();
});

container.addEventListener('pointerleave', (ev)=> {
	endMove();
});

container.addEventListener('mousemove', (ev)=> {
	if (isDragging) {
		const target = ev.target! as HTMLElement;
		const targetRect = getElementBounds(target);
		const evPosition = new Vec2(ev.clientX - targetRect.centerX, ev.clientY - targetRect.centerY);
		presentationCard.setOrientation(evPosition);
	}
});

container.addEventListener("touchstart", (ev)=>{
	startMove();
}, false);

container.addEventListener("touchcancel", (ev)=>{
	endMove();
}, false);

container.addEventListener("touchend", (ev)=>{
	endMove();
}, false);

container.addEventListener('touchmove',(ev)=>{
	ev.preventDefault();
	if(isDragging)
	{
		const target = ev.target! as HTMLElement;
		const targetRect = getElementBounds(target);

		const evPosition = new Vec2(ev.touches[0].clientX - targetRect.centerX, ev.touches[0].clientY - targetRect.centerY);
		presentationCard.setOrientation(evPosition);
	}
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
		new Vec2(targetPosition.centerX, targetPosition.centerY));
});