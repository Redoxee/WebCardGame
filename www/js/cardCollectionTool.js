import { Vec2 } from './vec';
import { BoundingRect } from './domUtils';
import { BezierPreset } from './math';
function setupCardCollection(collectionELement) {
    const cardCollection = collectionELement;
    const itemPoolSize = 30;
    cardCollection.itemPool = [];
    cardCollection.itemInUse = [];
    cardCollection.reservingItem = null;
    cardCollection.bounds = new BoundingRect(cardCollection);
    for (let index = 0; index < itemPoolSize; ++index) {
        const pooledItem = document.createElement('div');
        cardCollection.itemPool.push(pooledItem);
    }
    cardCollection.ReserveSlot = (selector) => {
        if (!cardCollection.reservingItem) {
            const newItem = cardCollection.itemPool.pop();
            cardCollection.appendChild(newItem);
            cardCollection.itemInUse.push(newItem);
        }
        // determine the slot index
        const reservingIndex = selector(cardCollection.itemInUse);
        for (let index = cardCollection.itemInUse.length - 1; index > reservingIndex; --index) {
            cardCollection.itemInUse[index].assignedCard = cardCollection.itemInUse[index - 1].assignedCard;
        }
        cardCollection.reservingItem = cardCollection.itemInUse[reservingIndex];
        cardCollection.reservingItem.assignedCard = null;
        cardCollection.reservingItem.index = reservingIndex;
        cardCollection.SlideAllCardsToAssignedItems();
    };
    cardCollection.AssignCardToReservation = (card) => {
        if (!cardCollection.reservingItem) {
            console.warn('Trying to assign card but no slot reserved!');
            return;
        }
        cardCollection.reservingItem.assignedCard = card;
        const itemRect = new BoundingRect(cardCollection.reservingItem);
        card.lerpAnimator.startAnimation(cardCollection.reservingItem.assignedCard.currentPosition, new Vec2(itemRect.centerX, itemRect.centerY), 1, BezierPreset.EaseInOut);
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
    cardCollection.SlideAllCardsToAssignedItems = () => {
        cardCollection.itemInUse.forEach(item => {
            if (item.assignedCard) {
                const itemRect = new BoundingRect(item);
                item.assignedCard.lerpAnimator.startAnimation(item.assignedCard.currentPosition, new Vec2(itemRect.centerX, itemRect.centerY), 1, BezierPreset.EaseInOut);
            }
        });
    };
    return cardCollection;
}
function SelectClosestItemSelector(posX, posY) {
    const selector = (items) => {
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
    };
    return selector;
}
export { setupCardCollection, SelectClosestItemSelector };
