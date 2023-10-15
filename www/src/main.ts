import {Vec2, Vec3} from './vec';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {getElementBounds} from './domUtils';
import {v4 as uuid} from 'uuid';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, BezierPreset, IBezierParams } from './math';

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

const presentationCard = makeCard(container);

let draggedObject : ICardPresentation | null = null;
let isSelected = false;
let startTouchTimeStamp = 0;

const clickDragThreshold = 500;

function startInput(card : ICardPresentation) {
	if(isSelected) {
		presentationCard.setSmoothOrientation(true);
		presentationCard.setZoom(1);
	}

	draggedObject = card;
	
	presentationCard.setSmoothOrientation(false);
	
	startTouchTimeStamp = performance.now();
}

function endInput() {
	const inputDuration = performance.now() - startTouchTimeStamp;
	if(inputDuration < clickDragThreshold) {
		if(!isSelected)
		{
			isSelected = true;
			presentationCard.setZoom(2);
		}
		else {
			isSelected = false;
			presentationCard.setZoom(1);
		}
	}

	if (draggedObject) {
		draggedObject = null;
	}
}

function cardFollowPosition(card : ICardPresentation,posX : number, posY : number) {
	if (isSelected) {
		const targetRect = getElementBounds(presentationCard);
		const evPosition = new Vec2(posX - targetRect.centerX, posY - targetRect.centerY);
		card.setOrientation(evPosition);
	}
}

function setupCardInput(targetCard : ICardPresentation) {

	targetCard.root.addEventListener('mousedown', (_)=>{
		startInput(targetCard);
	});
	
	targetCard.root.addEventListener('mouseup', (_)=>{
		//endInput();
	});
	
	targetCard.root.addEventListener('pointerleave', (_)=> {
		if (isSelected) {
			isSelected = false;
			targetCard.setZoom(1);
			targetCard.setOrientation(Vec2.Zero);
		}
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
	
	targetCard.root.addEventListener('mousemove', (ev)=> {
		cardFollowPosition(targetCard, ev.clientX, ev.clientY);
	});
	
	targetCard.root.addEventListener('touchmove', (ev)=> {
		const positionHolder = ev.targetTouches[0];
		cardFollowPosition(targetCard, positionHolder.clientX, positionHolder.clientY);
	});
}

setupCardInput(presentationCard);

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
		.65,
		BezierPreset.EaseInOut
	);
});

function boardMove(card : ICardPresentation,posX : number, posY : number) {
	const startPosition = getElementBounds(card.root);
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

const cloned = container.cloneNode(true) as HTMLElement;
board.appendChild(cloned);

const clonedCard = makeCard(cloned);
setupCardInput(clonedCard);

const clonedBound = getElementBounds(cloned);
clonedCard.lerpAnimator.startAnimation(new Vec2(clonedBound.centerX, clonedBound.centerY), new Vec2(600, 300), .5, BezierPreset.EaseInOut)

const cardCollection = document.getElementById('mock-collection')!;

interface ICardCollectionItem extends HTMLElement {

}

type SlotIndexSelector = (availableSlots : ICardCollectionItem[]) => Number;

interface ICardCollection extends HTMLElement {
	itemPool : ICardCollectionItem[];
	itemInUse : ICardCollectionItem[];
	cardItems : ICardPresentation|null[];
	isReserving : boolean;

	ReserveSlot : (selector : SlotIndexSelector)=>void;
}

function setupCardCollection(collectionELement : HTMLElement) {
	const cardCollection = collectionELement as ICardCollection;

	const itemPoolSize = 30;

	cardCollection.itemPool = [];
	cardCollection.cardItems = [];
	cardCollection.itemInUse = [];
	cardCollection.isReserving = false;

	for (let index = 0; index < itemPoolSize; ++index) {
		const pooledItem = document.createElement('div') as ICardCollectionItem;
		cardCollection.itemPool.push(pooledItem)
	}

	cardCollection.ReserveSlot = (selector : SlotIndexSelector) => {
		if (!cardCollection.isReserving) {
			const newItem = cardCollection.itemPool.pop()!;
			cardCollection.appendChild(newItem);
			cardCollection.itemInUse.push(newItem);
		}

		cardCollection.isReserving = true;
		// determine the slot index
		const reservingIndex = selector(cardCollection.itemInUse);
		for(let index = cardCollection.itemInUse.length - 1; index > reservingIndex; --index) {
			cardCollection.itemInUse[index] = cardCollection.itemInUse[index - 1];
		}

		// TODO : Attach cards to slots
	};

	return cardCollection;
}

setupCardCollection(cardCollection);