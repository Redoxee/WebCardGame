import { addCustomStyle, BoundingRect } from './domUtils';
import { BezierPreset } from './math';
var ReservationResult;
(function (ReservationResult) {
    ReservationResult[ReservationResult["New"] = 0] = "New";
    ReservationResult[ReservationResult["Moved"] = 1] = "Moved";
    ReservationResult[ReservationResult["Same"] = 2] = "Same";
})(ReservationResult || (ReservationResult = {}));
function setupCardCollection(collectionELement, params) {
    const cardCollection = collectionELement;
    const itemPoolSize = 100;
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
        const pooledItem = document.createElement('div');
        pooledItem.bounds = new BoundingRect(pooledItem);
        pooledItem.classList.add(itemStyleClass);
        cardCollection.itemPool.push(pooledItem);
    }
    cardCollection.ReserveSlot = (selector) => {
        if (!cardCollection.reservingItem) {
            const newItem = cardCollection.itemPool.pop();
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
            cardCollection.SlideAllCardsToAssignedItems();
            return ReservationResult.New;
        }
        else {
            const reservingIndex = selector(cardCollection.itemInUse);
            const previousEmptyIndex = cardCollection.reservingItem.index;
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
                cardCollection.SlideAllCardsToAssignedItems();
                return ReservationResult.Moved;
            }
        }
        return ReservationResult.Same;
    };
    cardCollection.AssignCardToReservation = (card) => {
        if (!cardCollection.reservingItem) {
            console.warn('Trying to assign card but no slot reserved!');
            return;
        }
        cardCollection.reservingItem.assignedCard = card;
        cardCollection.reservingItem.bounds.Recompute();
        card.lerpAnimator.StartAnimation(cardCollection.reservingItem.assignedCard.currentPosition, cardCollection.reservingItem.bounds.centerPosition, 1, BezierPreset.Linear);
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
    cardCollection.SlideAllCardsToAssignedItems = () => {
        cardCollection.itemInUse.forEach((item, index) => {
            if (item.assignedCard) {
                item.bounds.Recompute();
                // item.assignedCard.SetPosition(item.bounds.centerPosition);
                const b = new BoundingRect(item.assignedCard);
                item.assignedCard.lerpAnimator.StartAnimation(item.assignedCard.currentPosition, item.bounds.centerPosition, 1, BezierPreset.EaseInOut);
                item.assignedCard.style.zIndex = index.toString();
            }
        });
    };
    cardCollection.ContainsCard = (card) => {
        return cardCollection.itemInUse.find((el) => el.assignedCard === card) !== undefined;
    };
    cardCollection.DetachCard = (card) => {
        const index = cardCollection.itemInUse.findIndex((el) => el.assignedCard === card);
        if (index < 0) {
            console.warn('detaching unkown card');
            return;
        }
        cardCollection.removeChild(cardCollection.itemInUse[index]);
        cardCollection.itemInUse.splice(index, 1);
        cardCollection.SlideAllCardsToAssignedItems();
        const event = new CustomEvent('card-detach', { detail: {
                card
            } });
        cardCollection.dispatchEvent(event);
    };
    cardCollection.InsertCardInstant = (card, index) => {
        const newItem = cardCollection.itemPool.pop();
        cardCollection.itemInUse.splice(index, 0, newItem);
        cardCollection.insertBefore(newItem, cardCollection.childNodes[index + 1]);
        newItem.assignedCard = card;
        cardCollection.bounds.Recompute();
        cardCollection.itemInUse.forEach((item) => {
            if (!item.assignedCard) {
                return;
            }
            item.bounds.Recompute();
            item.assignedCard.SetPosition(item.bounds.centerPosition);
        });
    };
    cardCollection.PushCardInstant = (card) => {
        cardCollection.InsertCardInstant(card, cardCollection.itemInUse.length);
    };
    return cardCollection;
}
function SelectClosestItemSelector(posX, posY) {
    const selector = (items) => {
        let bestIndex = 0;
        let bestDistanceSq = Number.MAX_VALUE;
        for (let index = 0; index < items.length; ++index) {
            items[index].bounds.Recompute();
            const x = items[index].bounds.centerPosition.x - posX;
            const y = items[index].bounds.centerPosition.y - posY;
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
function setupDeckCollection(collectionElement, params) {
    const deck = setupCardCollection(collectionElement, params);
    deck.ShuffleAnimation = () => {
        var _a;
        if (deck.itemInUse.length < 1) {
            return;
        }
        deck.itemInUse.splice(0, 0, deck.itemInUse.pop());
        for (let index = 0; index < deck.itemInUse.length; ++index) {
            const anglePercentage = index / deck.itemInUse.length;
            const delay = anglePercentage * 100;
            const nextZindex = index;
            (_a = deck.itemInUse[index].assignedCard) === null || _a === void 0 ? void 0 : _a.circlingAnimation.StartAnimation(delay, anglePercentage, nextZindex.toString());
        }
    };
    return deck;
}
export { ReservationResult, setupCardCollection, SelectClosestItemSelector, setupDeckCollection };
