import { Vec2 } from './vec';
import { ICardPresentation } from './cardTool';
import { BoundingRect } from './domUtils';
import { BezierPreset } from './math';

interface ICardCollectionItem extends HTMLDivElement {
	assignedCard : ICardPresentation|null;
	index : number;
}

type SlotIndexSelector = (availableSlots : ICardCollectionItem[]) => number;

interface ICardCollection extends HTMLElement {
	itemPool : ICardCollectionItem[];
	itemInUse : ICardCollectionItem[];
	reservingItem : ICardCollectionItem|null;
	bounds : BoundingRect;

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
	cardCollection.bounds = new BoundingRect(cardCollection);

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

function SelectClosestItemSelector(posX : number, posY : number) {
	const selector = (items : ICardCollectionItem[]) : number => {
		let bestIndex = 0;
		let bestDistanceSq = 999999;
		for (let index = 0; index < items.length; ++index) {
			const rect = new BoundingRect(items[index]);
			const x = rect.centerX - posX;
			const y = rect.centerY - posY;
			const distanceSq = x * x + y * y;
			if (distanceSq < bestDistanceSq) {
				bestDistanceSq = distanceSq;
				bestIndex = index;
			}
		}
	
		return bestIndex;
	}

	return selector;
}

export {setupCardCollection, SelectClosestItemSelector};