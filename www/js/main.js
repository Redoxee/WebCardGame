import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { getElementBounds } from './domUtils';
import { v4 as uuid } from 'uuid';
import { BezierPreset } from './math';
const board = document.getElementById('game-board');
const container = document.getElementById('card-root');
function makeCard(rootNode) {
    const cardClassName = `PresentationCard${uuid()}`;
    rootNode.classList.add(cardClassName);
    const card = document.querySelector(`.${cardClassName} #card`);
    const cardItem = document.querySelector(`.${cardClassName} #card-item`);
    const shine = document.querySelector(`.${cardClassName} #shine`);
    const shade = document.querySelector(`.${cardClassName} #shade`);
    const cardElements = {
        root: rootNode,
        zoomable: card,
        cardItem: cardItem,
        shine: shine,
        shade: shade,
    };
    const cardOptions = {
        lightDirection: (new Vec3(.15, -1, .25)).normalize(),
        simHeight: 190,
        lightPower: 1.5,
        shadowDistance: 5
    };
    const presentationCard = addCardPresentationCapability(cardElements, cardOptions);
    presentationCard.setOrientation(Vec2.Zero);
    return presentationCard;
}
const presentationCard = makeCard(container);
let draggedObject = null;
let isSelected = false;
let startTouchTimeStamp = 0;
const clickDragThreshold = 500;
function startInput(card) {
    if (isSelected) {
        presentationCard.setSmoothOrientation(true);
        presentationCard.setZoom(1);
    }
    draggedObject = card;
    presentationCard.setSmoothOrientation(false);
    startTouchTimeStamp = performance.now();
}
function endInput() {
    const inputDuration = performance.now() - startTouchTimeStamp;
    if (inputDuration < clickDragThreshold) {
        if (!isSelected) {
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
function cardFollowPosition(card, posX, posY) {
    if (isSelected) {
        const targetRect = getElementBounds(presentationCard);
        const evPosition = new Vec2(posX - targetRect.centerX, posY - targetRect.centerY);
        card.setOrientation(evPosition);
    }
}
function setupCardInput(targetCard) {
    targetCard.root.addEventListener('mousedown', (_) => {
        startInput(targetCard);
    });
    targetCard.root.addEventListener('mouseup', (_) => {
        //endInput();
    });
    targetCard.root.addEventListener('pointerleave', (_) => {
        if (isSelected) {
            isSelected = false;
            targetCard.setZoom(1);
            targetCard.setOrientation(Vec2.Zero);
        }
    });
    targetCard.root.addEventListener("touchstart", (ev) => {
        const target = ev.target;
        startInput(target);
    }, false);
    targetCard.root.addEventListener("touchcancel", (ev) => {
        endInput();
    }, false);
    targetCard.root.addEventListener("touchend", (ev) => {
        endInput();
    }, false);
    targetCard.root.addEventListener('mousemove', (ev) => {
        cardFollowPosition(targetCard, ev.clientX, ev.clientY);
    });
    targetCard.root.addEventListener('touchmove', (ev) => {
        const positionHolder = ev.targetTouches[0];
        cardFollowPosition(targetCard, positionHolder.clientX, positionHolder.clientY);
    });
}
setupCardInput(presentationCard);
const testButton = document.getElementById('test-button');
const targets = [
    document.getElementById('target-1'),
    document.getElementById('target-2'),
    document.getElementById('target-3'),
    document.getElementById('target-4'),
];
let currentIndex = 0;
testButton.addEventListener('click', (_ev) => {
    currentIndex = (currentIndex + 1) % targets.length;
    const startPosition = getElementBounds(presentationCard.root);
    const targetPosition = getElementBounds(targets[currentIndex]);
    presentationCard.lerpAnimator.startAnimation(new Vec2(startPosition.centerX, startPosition.centerY), new Vec2(targetPosition.centerX, targetPosition.centerY), .65, BezierPreset.EaseInOut);
});
function boardMove(card, posX, posY) {
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
    }
    else if (lp > 1) {
        lp = 1;
    }
    // Applying a ramp
    lp = lp * lp;
    // converting to speed
    const lerpedSpeed = (maxSpeed - minSpeed) * lp + minSpeed;
    card.lerpAnimator.startAnimation(start, end, lerpedSpeed, BezierPreset.Linear);
}
board.addEventListener('mousemove', (event) => {
    if (draggedObject) {
        boardMove(draggedObject, event.clientX, event.clientY);
    }
});
board.addEventListener('touchmove', (event) => {
    if (draggedObject) {
        const target = event.targetTouches[0];
        boardMove(draggedObject, target.clientX, target.clientY - 150);
    }
});
board.addEventListener('mouseup', () => {
    endInput();
});
const cloned = container.cloneNode(true);
board.appendChild(cloned);
const clonedCard = makeCard(cloned);
setupCardInput(clonedCard);
const clonedBound = getElementBounds(cloned);
clonedCard.lerpAnimator.startAnimation(new Vec2(clonedBound.centerX, clonedBound.centerY), new Vec2(600, 300), .5, BezierPreset.EaseInOut);
const cardCollectionElement = document.getElementById('mock-collection');
function setupCardCollection(collectionELement) {
    const cardCollection = collectionELement;
    const itemPoolSize = 30;
    cardCollection.itemPool = [];
    cardCollection.itemInUse = [];
    cardCollection.reservingItem = null;
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
        const itemRect = getElementBounds(cardCollection.reservingItem);
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
                const itemRect = getElementBounds(item);
                item.assignedCard.lerpAnimator.startAnimation(item.assignedCard.currentPosition, new Vec2(itemRect.centerX, itemRect.centerY), 1, BezierPreset.EaseInOut);
            }
        });
    };
    return cardCollection;
}
const cardCollection = setupCardCollection(cardCollectionElement);
cardCollection.addEventListener('mouseenter', (ev) => {
    const selector = (items) => {
        let bestIndex = 0;
        let bestDistanceSq = 999999;
        for (let index = 0; index < items.length; ++index) {
            const rect = getElementBounds(items[index]);
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
    cardCollection.ReserveSlot(selector);
});
cardCollection.addEventListener('mouseleave', (ev) => {
    cardCollection.CancelReservation();
});
