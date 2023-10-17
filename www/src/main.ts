import {Vec2, Vec3} from './vec';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {addCustomStyle, BoundingRect} from './domUtils';
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
	
	targetCard.root.addEventListener('mouseup', (_)=>{
		//endInput();
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

interface ICardCollectionItem extends HTMLDivElement {
	assignedCard : ICardPresentation|null;
	index : number;
}

type SlotIndexSelector = (availableSlots : ICardCollectionItem[]) => number;

interface ICardCollection extends HTMLElement {
	itemPool : ICardCollectionItem[];
	itemInUse : ICardCollectionItem[];
	reservingItem : ICardCollectionItem|null;

	ReserveSlot : (selector : SlotIndexSelector)=>void;
	CancelReservation : ()=>void;
	AssignCardToReservation : (card : ICardPresentation)=>void;
	SlideAllCardsToAssignedItems : ()=>void;
}

function setupCardCollection(collectionELement : HTMLElement) {
	const cardCollection = collectionELement as ICardCollection;

	const itemPoolSize = 30;

	cardCollection.itemPool = [];
	cardCollection.itemInUse = [];
	cardCollection.reservingItem = null;

	for (let index = 0; index < itemPoolSize; ++index) {
		const pooledItem = document.createElement('div')!as ICardCollectionItem;
		cardCollection.itemPool.push(pooledItem)
	}

	cardCollection.ReserveSlot = (selector : SlotIndexSelector) => {
		if (!cardCollection.reservingItem) {
			const newItem = cardCollection.itemPool.pop()!;
			cardCollection.appendChild(newItem);
			cardCollection.itemInUse.push(newItem);
		}
		
		// determine the slot index
		const reservingIndex = selector(cardCollection.itemInUse);
		for(let index = cardCollection.itemInUse.length - 1; index > reservingIndex; --index) {
			cardCollection.itemInUse[index].assignedCard = cardCollection.itemInUse[index - 1].assignedCard;
		}

		cardCollection.reservingItem = cardCollection.itemInUse[reservingIndex];
		cardCollection.reservingItem.assignedCard = null;
		cardCollection.reservingItem.index = reservingIndex;
		cardCollection.SlideAllCardsToAssignedItems();
	};

	cardCollection.AssignCardToReservation = (card : ICardPresentation) => {
		if (!cardCollection.reservingItem) {
			console.warn('Trying to assign card but no slot reserved!');
			return;
		}

		cardCollection.reservingItem.assignedCard = card;
		
		const itemRect = new BoundingRect(cardCollection.reservingItem);
		card.lerpAnimator.startAnimation(
			cardCollection.reservingItem.assignedCard.currentPosition, 
			new Vec2(itemRect.centerX, itemRect.centerY),
			1,
			BezierPreset.EaseInOut);

		cardCollection.reservingItem = null;
	};

	cardCollection.CancelReservation = () => {
		if (!cardCollection.reservingItem) {
			console.warn('Cancelling but there is no reservation');
			return;
		}

		cardCollection.removeChild(cardCollection.reservingItem);
		cardCollection.itemInUse.splice(cardCollection.reservingItem.index, 1);
		cardCollection.reservingItem.assignedCard = null;
		cardCollection.reservingItem.index = -1;

		cardCollection.itemPool.push(cardCollection.reservingItem);
		cardCollection.reservingItem = null;
		
		cardCollection.SlideAllCardsToAssignedItems();
	};

	cardCollection.SlideAllCardsToAssignedItems = ()=>{
		cardCollection.itemInUse.forEach(item => {
			if(item.assignedCard) {
				const itemRect = new BoundingRect(item);
				item.assignedCard.lerpAnimator.startAnimation(
					item.assignedCard.currentPosition, 
					new Vec2(itemRect.centerX, itemRect.centerY),
					1,
					BezierPreset.EaseInOut);
			}
		});
	};

	return cardCollection;
}

const cardCollection = setupCardCollection(cardCollectionElement);

cardCollection.addEventListener('mouseenter', (ev)=>{
	const selector = (items : ICardCollectionItem[]) => {
		let bestIndex = 0;
		let bestDistanceSq = 999999;
		for (let index = 0; index < items.length; ++index) {
			const rect = new BoundingRect(items[index]);
			const x = rect.centerX - ev.clientX;
			const y = rect.centerY - ev.clientY;
			const distanceSq = x * x + y * y;
			if (distanceSq < bestDistanceSq) {
				bestDistanceSq = distanceSq;
				bestIndex = index;
			}
		}

		return bestIndex;
	};

	cardCollection.ReserveSlot(selector)
});

cardCollection.addEventListener('mouseleave', (ev)=>{
	cardCollection.CancelReservation();
});