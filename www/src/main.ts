import {Vec2, Vec3} from './vec';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {addCustomStyle, BoundingRect} from './domUtils';
import {v4 as uuid} from 'uuid';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, BezierPreset, IBezierParams } from './math';
import { setupCardCollection, SelectClosestItemSelector } from './cardCollectionTool';

const board = document.getElementById('game-board')!;
const container = document.getElementById('card-root')!;

function makeCard(rootNode : HTMLElement) : ICardPresentation {
	const cardClassName = `PresentationCard${uuid()}`;
	rootNode.classList.add(cardClassName);
	const card = document.querySelector(`.${cardClassName} #card`)! as HTMLElement;
	const cardItem = document.querySelector(`.${cardClassName} #card-item`)! as HTMLElement;
	const shine = document.querySelector(`.${cardClassName} #shine`)! as HTMLElement;
	const shade = document.querySelector(`.${cardClassName} #shade`)! as HTMLElement;

	const cardElements : ICardElements = {
		root : rootNode,
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
	presentationCard.setOrientation(Vec2.Zero);
	return presentationCard;
}

const debugCard = makeCard(container);

let draggedObject : ICardPresentation | null = null;

function startInput(card : ICardPresentation) {
	draggedObject = card;
	
	debugCard.setSmoothOrientation(false);
}

function endInput() {
	if (draggedObject) {
		draggedObject = null;
	}
}

function setupCardInput(targetCard : ICardPresentation) {
	targetCard.root.addEventListener('mousedown', (_)=>{
		startInput(targetCard);
	});

	targetCard.root.addEventListener("touchstart", (ev)=>{
		const target = ev.target as ICardPresentation;
		startInput(target);
	}, false);
	
	targetCard.root.addEventListener("touchcancel", (ev)=>{
		endInput();
	}, false);
	
	targetCard.root.addEventListener("touchend", (ev)=>{
		endInput();
	}, false);
}

setupCardInput(debugCard);

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
	const startPosition = new BoundingRect(debugCard.root)
	const targetPosition = new BoundingRect(targets[currentIndex]);
	debugCard.lerpAnimator.startAnimation(
		new Vec2(startPosition.centerX, startPosition.centerY),
		new Vec2(targetPosition.centerX, targetPosition.centerY),
		.65,
		BezierPreset.EaseInOut
	);
});

function boardMove(card : ICardPresentation,posX : number, posY : number) {
	const startPosition = new BoundingRect(card.root);
	const start = new Vec2(startPosition.centerX, startPosition.centerY);
	const end = new Vec2(posX, posY);

	const travelLength = Vec2.sub(end, start).length();

	const lerpLowerBound = 45;
	const lerpUpperBound = 180;
	const minSpeed = .8;
	const maxSpeed = 2.7;

	// Computing the distance versus the lower upper bound (if distance is low keep the low speed, speedup as distance is high)
	let lp = (travelLength - lerpLowerBound) / (lerpUpperBound - lerpLowerBound);
	
	// clamping between 0 and 1
	if (lp < 0) {
		lp = 0;
	} else if (lp > 1) {
		lp = 1;
	}

	// Applying a ramp
	lp = lp * lp;
	// converting to speed
	const lerpedSpeed = (maxSpeed - minSpeed) * lp + minSpeed;

	card.lerpAnimator.startAnimation(
		start,
		end,
		lerpedSpeed,
		BezierPreset.Linear);
}

board.addEventListener('mousemove', (event)=>{
	if(draggedObject) {
		boardMove(draggedObject, event.clientX , event.clientY);
	}
});

board.addEventListener('touchmove', (event)=>{
	if(draggedObject) {
		const target = event.targetTouches[0];
		boardMove(draggedObject, target.clientX, target.clientY - 150);
	}
});

board.addEventListener('mouseup', ()=>{
	endInput();
});

const cloned = debugCard.cloneNode(true) as HTMLElement;
board.appendChild(cloned);

const clonedCard = makeCard(cloned);
setupCardInput(clonedCard);

const clonedBound = new BoundingRect(cloned);
clonedCard.lerpAnimator.startAnimation(new Vec2(clonedBound.centerX, clonedBound.centerY), new Vec2(600, 300), .5, BezierPreset.EaseInOut)

const testCards : ICardPresentation[] = [];
for (let index = 0; index < 10; ++index){
	const element = debugCard.cloneNode(true) as HTMLElement;
	board.appendChild(element);
	const testCard = makeCard(element);
	testCard.lerpAnimator.startAnimation(testCard.currentPosition, 
		Vec2.add(testCard.currentPosition, new Vec2(index  * 30, 0)),
		.5,
		BezierPreset.EaseInOut);
	setupCardInput(testCard);
	testCards.push(testCard);
}

const cardCollectionElement = document.getElementById('mock-collection')!;

const cardCollection = setupCardCollection(cardCollectionElement);

board.addEventListener('mousemove', (ev)=> {
	const mousePosition = new Vec2(ev.clientX, ev.clientY);
	if (cardCollection.bounds.Contains(mousePosition)) {
		if (!cardCollection.reservingItem) {
			cardCollection.ReserveSlot(SelectClosestItemSelector(ev.clientX, ev.clientY));
		}
	}
	else {
		if (cardCollection.reservingItem) {
			cardCollection.CancelReservation();
		}
	}
});