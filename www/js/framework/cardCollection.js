import { addCustomStyle, BoundingRect } from './domUtils';
import { BezierPreset } from './mathUtils';
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
    cardCollection.AssignCardToReservation = (card, then) => {
        if (!cardCollection.reservingItem) {
            console.warn('Trying to assign card but no slot reserved!');
            return;
        }
        cardCollection.reservingItem.assignedCard = card;
        const index = cardCollection.reservingItem.index;
        cardCollection.reservingItem.bounds.Recompute();
        card.lerpAnimator.StartAnimation({
            p0: cardCollection.reservingItem.assignedCard.currentPosition,
            p1: cardCollection.reservingItem.bounds.centerPosition,
            bezierParams: BezierPreset.EaseInOut,
            speed: 1,
            rotationFactor: 0,
            then: () => {
                card.style.zIndex = index.toString();
                if (then) {
                    then();
                }
            }
        });
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
                item.assignedCard.lerpAnimator.StartAnimation({
                    p0: item.assignedCard.currentPosition,
                    p1: item.bounds.centerPosition,
                    speed: 1,
                    bezierParams: BezierPreset.EaseInOut,
                    then: () => { }
                });
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
        const item = cardCollection.itemInUse[index];
        cardCollection.removeChild(item);
        cardCollection.itemInUse.splice(index, 1);
        cardCollection.SlideAllCardsToAssignedItems();
        item.assignedCard = null;
        cardCollection.itemPool.push(item);
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
        card.style.zIndex = index.toString();
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
    deck.ShuffleAnimation = (then) => {
        var _a;
        if (deck.itemInUse.length < 1) {
            if (then) {
                then();
            }
            return;
        }
        deck.itemInUse.splice(0, 0, deck.itemInUse.pop());
        for (let index = 0; index < deck.itemInUse.length; ++index) {
            const anglePercentage = index / deck.itemInUse.length;
            const delay = anglePercentage * 100;
            const nextZindex = index;
            const thenAction = index === (deck.itemInUse.length - 1) ? then : undefined;
            (_a = deck.itemInUse[index].assignedCard) === null || _a === void 0 ? void 0 : _a.circlingAnimation.StartAnimation({
                delay,
                anglePercentage: anglePercentage,
                targetZIndex: nextZindex.toString(),
                then: thenAction
            });
        }
    };
    deck.PopCard = () => {
        if (deck.itemInUse.length < 1) {
            return undefined;
        }
        const item = deck.itemInUse.pop();
        deck.removeChild(item);
        deck.itemPool.push(item);
        const cardResult = item.assignedCard;
        item.assignedCard = null;
        return cardResult;
    };
    return deck;
}
export { ReservationResult, setupCardCollection, SelectClosestItemSelector, setupDeckCollection };
