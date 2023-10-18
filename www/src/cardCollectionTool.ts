import { Vec2 } from './vec';
import { ICardPresentation } from './cardTool';
import { addCustomStyle, BoundingRect, uniqueId } from './domUtils';
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
	ContainsCard : (card : ICardPresentation) => boolean;
	DetachCard : (card : ICardPresentation) => void;
	SlideAllCardsToAssignedItems : ()=>void;
}

interface ICardCollectionParameters {
	itemStyle? : string
}

function setupCardCollection(collectionELement : HTMLElement, params : ICardCollectionParameters) {
	const cardCollection = collectionELement as ICardCollection;

	const itemPoolSize = 30;

	cardCollection.itemPool = [];
	cardCollection.itemInUse = [];
	cardCollection.reservingItem = null;
	cardCollection.bounds = new BoundingRect(cardCollection);

	let itemStyle = "color:white;";
	if (params.itemStyle) {
		itemStyle += params.itemStyle;
	}

	const itemStyleClass = addCustomStyle({
		className: "CardCollectionItem",
		content: itemStyle,
	});

	for (let index = 0; index < itemPoolSize; ++index) {
		const pooledItem = document.createElement('div')!as ICardCollectionItem;
		pooledItem.classList.add(itemStyleClass);
		cardCollection.itemPool.push(pooledItem)
	}

	cardCollection.ReserveSlot = (selector : SlotIndexSelector) => {
		if (!cardCollection.reservingItem) {
			const newItem = cardCollection.itemPool.pop()!;
			cardCollection.appendChild(newItem);
			cardCollection.itemInUse.push(newItem);
			
			const reservingIndex = selector(cardCollection.itemInUse);
			
			const numberOfItems = cardCollection.itemInUse.length;
			for (let index = numberOfItems - 2; index >= reservingIndex; --index) {
				cardCollection.itemInUse[index + 1].assignedCard = cardCollection.itemInUse[index].assignedCard;
			}
			
			cardCollection.reservingItem = cardCollection.itemInUse[reservingIndex];
			cardCollection.reservingItem.index = reservingIndex;
			cardCollection.reservingItem.assignedCard = null;

			cardCollection.bounds.Recompute();
		}
		else {
			const reservingIndex = selector(cardCollection.itemInUse);
			const previousEmptyIndex = cardCollection.reservingItem.index;
			const numberOfItems = cardCollection.itemInUse.length;
			if (reservingIndex !== previousEmptyIndex) {

				if (reservingIndex > previousEmptyIndex) {
					for (let index = previousEmptyIndex; index < (reservingIndex); ++index) {
						cardCollection.itemInUse[index].assignedCard = cardCollection.itemInUse[index + 1].assignedCard;
					}
				}
				else {
					for (let index = previousEmptyIndex; index > (reservingIndex); --index) {
						cardCollection.itemInUse[index].assignedCard = cardCollection.itemInUse[index - 1].assignedCard;
					}
				}

				cardCollection.reservingItem = cardCollection.itemInUse[reservingIndex];
				cardCollection.reservingItem.index = reservingIndex;
				cardCollection.reservingItem.assignedCard = null;
			}
		}

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
		
		card.style.zIndex = cardCollection.reservingItem.index.toString();
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
		cardCollection.reservingItem.replaceChildren();

		cardCollection.itemPool.push(cardCollection.reservingItem);
		cardCollection.reservingItem = null;
		
		cardCollection.SlideAllCardsToAssignedItems();
	};

	cardCollection.SlideAllCardsToAssignedItems = ()=>{
		cardCollection.itemInUse.forEach((item, index) => {
			if(item.assignedCard) {
				const itemRect = new BoundingRect(item);
				item.assignedCard.lerpAnimator.startAnimation(
					item.assignedCard.currentPosition, 
					new Vec2(itemRect.centerX, itemRect.centerY),
					1,
					BezierPreset.EaseInOut);
				item.assignedCard.style.zIndex = index.toString();
			}
		});
	};

	cardCollection.ContainsCard = (card : ICardPresentation) => {
		return cardCollection.itemInUse.find((el)=>el.assignedCard === card) !== undefined;
	}

	cardCollection.DetachCard = (card) => {
		const index = cardCollection.itemInUse.findIndex((el)=>el.assignedCard === card);
		if(index < 0) {
			console.warn('detaching unkown card');
			return;
		}

		cardCollection.removeChild(cardCollection.itemInUse[index]);
		cardCollection.itemInUse.splice(index, 1);
		cardCollection.SlideAllCardsToAssignedItems();
	}

	return cardCollection;
}

function SelectClosestItemSelector(posX : number, posY : number) {
	const selector = (items : ICardCollectionItem[]) : number => {
		let bestIndex = 0;
		let bestDistanceSq = Number.MAX_VALUE;
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

export {ICardCollection, ICardCollectionParameters, setupCardCollection, SelectClosestItemSelector};